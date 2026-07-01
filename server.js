import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs/promises";
import { existsSync } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import webpush from "web-push";
import {
  buildHelpHint,
  buildNameHint,
  buildGenderHint,
  buildLanguageHint,
  buildSystemPrompt,
  countUserMessages,
  generateSaathiReply,
  isAskingForHelp,
  pickFewShots,
  pickRandomOpener,
  refreshThreadSummary,
  shouldRefreshSummary,
  shouldUseName
} from "./saathi-chat.js";
import { buildKnowledgeContext, findKnowledgeMatches, getUsedTopicKeys } from "./saathi-knowledge.mjs";
import {
  getKbStatus,
  loadTestQueries,
  reviewOne,
  runBatchReview,
  runThreadReview
} from "./saathi-kb-review.mjs";
import {
  addCorrection,
  deleteCorrection,
  findMatchingCorrections,
  getCorrectionCount,
  listCorrections,
  correctionsToFewShots
} from "./saathi-kb-corrections.mjs";
import {
  createPeerSession,
  extractPeerKeywords,
  keywordsOverlap,
  makeActorKey,
  makePeerDisplay,
  mergeKeywords,
  parseActorKey
} from "./saathi-peer.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const PROFESSIONALS_FILE = path.join(DATA_DIR, "professionals.json");
const SUPPORT_FILE = path.join(DATA_DIR, "supportRequests.json");
const PUSH_SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "pushSubscriptions.json");
const CHAT_SESSIONS_FILE = path.join(DATA_DIR, "chatSessions.json");
const GUEST_PROFILES_FILE = path.join(DATA_DIR, "guestProfiles.json");
const PRO_STATUS_FILE = path.join(DATA_DIR, "proStatus.json");
const PRO_TEMPLATES_FILE = path.join(DATA_DIR, "proTemplates.json");
const PEER_SESSIONS_FILE = path.join(DATA_DIR, "peerSessions.json");
const PEER_SETTINGS_FILE = path.join(DATA_DIR, "peerSettings.json");
const FRONTEND_DIST = path.join(__dirname, "saathi-react", "dist");
const PRO_DIST = path.join(__dirname, "saathi-pro", "dist");
const SERVER_VERSION = "2026-06-24-peer-v1";
const SUPPORT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const PEER_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const PRO_STATUS_STALE_MS = 2 * 60 * 1000;
const PEER_PRESENCE_STALE_MS = 90 * 1000;
const SERVER_PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(cors());

// ✅ OpenAI key from .env
const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY;

// ✅ Auth + user memory
let users = [];
const sessions = new Map();
let chatSessionsByUserId = {};
const guestThreadsByGuestId = new Map();
let guestProfilesByGuestId = {};
const otpByPhone = new Map();
let professionals = {
  lawyers: [],
  tarot: [],
  astro: []
};
let supportRequests = [];
let pushSubscriptionsByUserId = {};
let proStatusByPhone = {};
let proTemplatesByPhone = {};
let peerSessions = [];
let peerSettingsByActor = {};
const onlinePeers = new Map();

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 45 * 1000;
const OTP_MAX_ATTEMPTS = 6;

const normalizeIndianPhoneToE164 = (input) => {
  const raw = String(input || "").trim();
  const digits = raw.replace(/[^\d]/g, "");

  // Accept:
  // - 10 digit Indian numbers: 9876543210
  // - 12 digit with country code: 919876543210
  // - E.164: +919876543210
  if (raw.startsWith("+")) {
    if (/^\+91\d{10}$/.test(raw)) return raw;
    return null;
  }

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
};

const generateOtp = () => String(
  Math.floor(100000 + Math.random() * 900000)
);

const isWhatsAppConfigured = () =>
  Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );

const normalizePhoneKey = (input) => {
  const e164 = normalizeIndianPhoneToE164(input);
  if (e164) return e164;
  const digits = String(input || "").replace(/[^\d]/g, "");
  return digits ? `+${digits}` : "";
};

const phonesMatch = (a, b) => {
  const na = normalizePhoneKey(a);
  const nb = normalizePhoneKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const da = na.replace(/\D/g, "").slice(-10);
  const db = nb.replace(/\D/g, "").slice(-10);
  return da.length === 10 && da === db;
};

const formatRequestStamp = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    });
  } catch {
    return "";
  }
};

const sendWhatsAppMessage = async ({ toE164, body }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.log(`[DEV] WhatsApp to ${toE164}: ${body}`);
    return { delivered: false, dev: true };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const payload = new URLSearchParams({
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    To: toE164.startsWith("whatsapp:") ? toE164 : `whatsapp:${toE164}`,
    Body: body
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: payload
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("TWILIO WHATSAPP ERROR:", response.status, text);
    throw new Error("Failed to deliver WhatsApp message.");
  }

  const result = await response.json().catch(() => ({}));
  console.log(
    "TWILIO WHATSAPP SENT:",
    result.sid || "ok",
    "to",
    toE164
  );
  return { delivered: true, dev: false };
};

const sendWhatsAppOtp = async ({ toE164, code }) =>
  sendWhatsAppMessage({
    toE164,
    body: `Saathi login code: ${code}\n(Valid for 5 minutes)`
  });

const notifyWhatsAppSafe = async (toPhone, body) => {
  const toE164 = normalizeIndianPhoneToE164(toPhone) || normalizePhoneKey(toPhone);
  if (!toE164) return;
  try {
    await sendWhatsAppMessage({ toE164, body });
  } catch (error) {
    console.error("WHATSAPP NOTIFY ERROR:", error.message);
  }
};

const isLocalAppUrl = (url) => /localhost|127\.0\.0\.1/i.test(String(url || ""));

const getLanIPv4Base = () => {
  const nets = os.networkInterfaces();
  for (const ifaces of Object.values(nets)) {
    for (const iface of ifaces || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return `http://${iface.address}:${SERVER_PORT}`;
      }
    }
  }
  return null;
};

const getPublicAppBase = () => {
  if (process.env.LOCAL_ONLY === "1") {
    return `http://localhost:${SERVER_PORT}`;
  }
  const configured = String(process.env.APP_URL || "")
    .trim()
    .replace(/\/$/, "");
  if (configured && isLocalAppUrl(configured)) {
    return configured;
  }
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured;
  }
  const lan = getLanIPv4Base();
  if (lan) return lan;
  return `http://localhost:${SERVER_PORT}`;
};

const buildSaathiDeepLink = (
  { requestId, action, guestId },
  req,
  { preferPublic = false } = {}
) => {
  const origin = String(req?.headers?.origin || "").trim();
  let base = getPublicAppBase();
  if (
    !preferPublic &&
    origin &&
    /^https?:\/\//i.test(origin) &&
    !isLocalAppUrl(origin)
  ) {
    base = origin.replace(/\/$/, "");
  } else if (!preferPublic && origin && /^https?:\/\//i.test(origin)) {
    base = origin.replace(/\/$/, "");
  }

  const url = new URL(base);
  url.searchParams.set("open", "support");
  url.searchParams.set("requestId", requestId);
  if (action) url.searchParams.set("action", action);
  if (guestId) url.searchParams.set("guestId", guestId);
  return url.toString();
};

const buildShortSupportLink = (requestId, { action = "accept" } = {}) => {
  const base = getPublicAppBase().replace(/\/$/, "");
  const url = new URL(`${base}/r/${requestId}`);
  if (action) url.searchParams.set("action", action);
  return url.toString();
};

const formatProfessionalWhatsAppAlert = ({
  topic,
  requesterDisplay,
  requestId,
  createdAt
}) => {
  const shortLink = buildShortSupportLink(requestId);
  const code = requestId.slice(0, 8);
  const when = createdAt ? formatRequestStamp(createdAt) : "";
  const timeLine = when ? `\nRequested: ${when}` : "";
  if (isLocalAppUrl(shortLink)) {
    const lan = getLanIPv4Base();
    if (lan) {
      const lanLink = `${lan.replace(/\/$/, "")}/r/${requestId}`;
      return (
        `Saathi: New ${topic.toUpperCase()} request from ${requesterDisplay}.${timeLine}\n\n` +
        `On your phone (same Wi-Fi), open:\n${lanLink}\n\n` +
        `Then log in with your professional WhatsApp number and tap Accept.\n` +
        `Code: ${code}`
      );
    }
    return (
      `Saathi: New ${topic.toUpperCase()} request from ${requesterDisplay}.${timeLine}\n\n` +
      `On the Saathi PC: open http://localhost:${SERVER_PORT} in a second browser (Incognito), ` +
      `log in as professional → Accept.\nCode: ${code}`
    );
  }
  return (
    `Saathi: New ${topic.toUpperCase()} request from ${requesterDisplay}.${timeLine}\n\n` +
    `Tap to accept:\n${shortLink}\n\nCode: ${code}`
  );
};

const activateSupportRequest = (request, professionalUserId) => {
  if (request.status === "active") return;
  request.status = "active";
  request.acceptedBy = professionalUserId;
  touchSupportRequest(request);
  request.messages.push({
    id: crypto.randomUUID(),
    senderType: "system",
    senderId: "system",
    text: "A professional has joined the chat.",
    createdAt: new Date().toISOString()
  });
};

const wrapAsync = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const whatsappWithOpenLink = (text, link) => `${text}\n\nOpen in Saathi:\n${link}`;

const getProfessionalPhonesForTopic = (topic) => {
  const list = professionals[topic];
  return Array.isArray(list) ? list.filter(Boolean) : [];
};

const getProfessionalTopicsForPhone = (phone) =>
  Object.entries(professionals)
    .filter(([, phones]) => {
      const list = Array.isArray(phones) ? phones : phones ? [phones] : [];
      return list.some(p => phonesMatch(p, phone));
    })
    .map(([topic]) => topic);

const getProStatus = (phone) => {
  const key = normalizePhoneKey(phone);
  const entry = proStatusByPhone[key];
  if (!entry) return "away";
  const age = Date.now() - new Date(entry.updatedAt).getTime();
  if (age > PRO_STATUS_STALE_MS) return "away";
  return entry.status === "online" ? "online" : "away";
};

const countOnlineProsForTopic = (topic) => {
  const phones = getProfessionalPhonesForTopic(topic);
  const online = phones.filter(p => getProStatus(p) === "online").length;
  return { online, total: phones.length };
};

const pickRandomProfessionalPhone = (topic) => {
  const phones = getProfessionalPhonesForTopic(topic);
  if (!phones.length) return "";
  const onlinePhones = phones.filter(p => getProStatus(p) === "online");
  const pool = onlinePhones.length ? onlinePhones : phones;
  return pool[Math.floor(Math.random() * pool.length)];
};

const getPeerSettings = (type, id) => {
  const key = makeActorKey(type, id);
  return (
    peerSettingsByActor[key] || {
      contactOk: false,
      anonymous: false,
      keywords: []
    }
  );
};

const setPeerSettings = async (type, id, patch) => {
  const key = makeActorKey(type, id);
  const current = getPeerSettings(type, id);
  peerSettingsByActor[key] = {
    contactOk:
      patch.contactOk !== undefined ? Boolean(patch.contactOk) : current.contactOk,
    anonymous:
      patch.anonymous !== undefined ? Boolean(patch.anonymous) : current.anonymous,
    keywords: patch.keywords !== undefined ? patch.keywords : current.keywords,
    updatedAt: new Date().toISOString()
  };
  await savePeerSettings();
  return peerSettingsByActor[key];
};

const touchPeerPresence = (actor, extra = {}) => {
  const key = makeActorKey(actor.type, actor.id);
  const settings = getPeerSettings(actor.type, actor.id);
  onlinePeers.set(key, {
    type: actor.type,
    id: actor.id,
    contactOk: settings.contactOk,
    anonymous: settings.anonymous,
    keywords: settings.keywords || [],
    display:
      actor.user?.displayName ||
      actor.user?.email ||
      actor.user?.phone ||
      extra.display ||
      actor.id,
    lastSeen: Date.now()
  });
};

const pruneStalePresence = () => {
  const cutoff = Date.now() - PEER_PRESENCE_STALE_MS;
  for (const [key, entry] of onlinePeers.entries()) {
    if (entry.lastSeen < cutoff) onlinePeers.delete(key);
  }
};

const countOnlinePeers = () => {
  pruneStalePresence();
  let total = 0;
  let matchable = 0;
  for (const entry of onlinePeers.values()) {
    total += 1;
    if (entry.contactOk) matchable += 1;
  }
  return { total, matchable };
};

const findActivePeerSessionForActor = (type, id) =>
  peerSessions.find(
    session =>
      session.status === "active" &&
      ((session.participantA.type === type && session.participantA.id === id) ||
        (session.participantB.type === type && session.participantB.id === id))
  );

const getPeerPartner = (session, type, id) => {
  if (session.participantA.type === type && session.participantA.id === id) {
    return session.participantB;
  }
  if (session.participantB.type === type && session.participantB.id === id) {
    return session.participantA;
  }
  return null;
};

const findPeerSessionsForActor = (type, id) =>
  peerSessions
    .filter(
      session =>
        (session.participantA.type === type &&
          session.participantA.id === id) ||
        (session.participantB.type === type && session.participantB.id === id)
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );

const publicOnlinePeerEntry = entry =>
  makePeerDisplay({
    anonymous: entry.anonymous,
    displayName: entry.display,
    actorId: entry.id
  });

const tryPeerMatch = async (actor, latestMessage) => {
  const settings = getPeerSettings(actor.type, actor.id);
  if (!settings.contactOk) return null;
  if (findActivePeerSessionForActor(actor.type, actor.id)) return null;

  const newKeywords = extractPeerKeywords(latestMessage);
  const merged = mergeKeywords(settings.keywords, newKeywords);
  if (newKeywords.length) {
    await setPeerSettings(actor.type, actor.id, { keywords: merged });
  }
  if (!merged.length) return null;

  touchPeerPresence(actor);
  pruneStalePresence();

  const selfKey = makeActorKey(actor.type, actor.id);
  const candidates = [];
  for (const [key, entry] of onlinePeers.entries()) {
    if (key === selfKey) continue;
    if (!entry.contactOk) continue;
    if (findActivePeerSessionForActor(entry.type, entry.id)) continue;
    const overlap = keywordsOverlap(merged, entry.keywords || []);
    if (!overlap.length) continue;
    candidates.push({ entry, overlap });
  }
  if (!candidates.length) return null;

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  const partner = pick.entry;
  const displayA = makePeerDisplay({
    anonymous: settings.anonymous,
    displayName: actor.user?.displayName,
    actorId: actor.id
  });
  const displayB = makePeerDisplay({
    anonymous: partner.anonymous,
    displayName: partner.display,
    actorId: partner.id
  });
  const session = createPeerSession({
    actorA: { type: actor.type, id: actor.id, anonymous: settings.anonymous },
    actorB: { type: partner.type, id: partner.id, anonymous: partner.anonymous },
    matchedKeywords: pick.overlap,
    displayA,
    displayB
  });
  peerSessions.push(session);
  await savePeerSessions();
  return {
    sessionId: session.id,
    partnerDisplay: displayB,
    matchedTopics: pick.overlap
  };
};

const purgeOldPeerSessions = async () => {
  const cutoff = Date.now() - PEER_RETENTION_MS;
  const before = peerSessions.length;
  peerSessions = peerSessions.filter(session => {
    const last =
      session.updatedAt ||
      session.messages?.at(-1)?.createdAt ||
      session.createdAt;
    return new Date(last).getTime() >= cutoff;
  });
  if (peerSessions.length !== before) {
    await savePeerSessions();
  }
};

const findUserPhoneByRequester = (request) => {
  if (request.requesterType !== "user") return null;
  const requester = users.find(item => item.id === request.requesterId);
  return requester?.phone || null;
};

const findOpenSupportRequestsForActor = (actor) => {
  const open = supportRequests.filter(
    item =>
      item.requesterType === actor.type &&
      item.requesterId === actor.id &&
      (item.status === "waiting" || item.status === "active")
  );
  open.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return open;
};

const findOpenSupportRequestForActor = (actor) =>
  findOpenSupportRequestsForActor(actor)[0] || null;

const findOpenSupportRequestForActorTopic = (actor, topic) =>
  findOpenSupportRequestsForActor(actor).find(item => item.topic === topic) ||
  null;

const getRequestLastActivityMs = (request) => {
  const msgTimes = (request.messages || []).map(m =>
    new Date(m.createdAt).getTime()
  );
  const lastMsg = msgTimes.length ? Math.max(...msgTimes) : 0;
  const closed = request.closedAt
    ? new Date(request.closedAt).getTime()
    : 0;
  const declined = request.declinedAt
    ? new Date(request.declinedAt).getTime()
    : 0;
  return Math.max(
    new Date(request.createdAt).getTime(),
    lastMsg,
    closed,
    declined,
    request.updatedAt ? new Date(request.updatedAt).getTime() : 0
  );
};

const touchSupportRequest = (request) => {
  request.updatedAt = new Date().toISOString();
};

const purgeOldSupportRequests = async () => {
  const cutoff = Date.now() - SUPPORT_RETENTION_MS;
  const before = supportRequests.length;
  supportRequests = supportRequests.filter(
    item => getRequestLastActivityMs(item) >= cutoff
  );
  if (supportRequests.length !== before) {
    await saveSupportRequests();
    console.log(
      `Purged ${before - supportRequests.length} support chats older than 30 days.`
    );
  }
};

const getProUserIdsForPhone = (assignedPhone) =>
  users
    .filter(item => phonesMatch(item.phone, assignedPhone))
    .map(item => item.id);

const buildProDeepLink = (requestId, action = "") => {
  const url = new URL(`${getPublicAppBase().replace(/\/$/, "")}/pro/`);
  url.searchParams.set("open", "support");
  url.searchParams.set("requestId", requestId);
  if (action) url.searchParams.set("action", action);
  return url.pathname + url.search;
};

const normalizeProfessionalsOnLoad = () => {
  const normalizeList = (value) => {
    if (Array.isArray(value)) {
      return value.map(item => normalizePhoneKey(item)).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      return [normalizePhoneKey(value)].filter(Boolean);
    }
    return [];
  };
  professionals = {
    lawyers: normalizeList(professionals.lawyers),
    tarot: normalizeList(professionals.tarot),
    astro: normalizeList(professionals.astro)
  };
};

const normalizeSupportRequestsOnLoad = () => {
  supportRequests = supportRequests.map(item => ({
    ...item,
    assignedPhone:
      normalizePhoneKey(item.assignedPhone) || item.assignedPhone
  }));
};

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedHash, "hex");
  if (hashBuffer.length !== storedBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, storedBuffer);
};

const generateToken = () =>
  crypto.randomBytes(32).toString("hex");

const makeChatTitle = (text) => {
  const clean = String(text || "").trim().replace(/\s+/g, " ");
  if (!clean) return "New chat";
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean;
};

const loadChatSessions = async () => {
  try {
    const raw = await fs.readFile(CHAT_SESSIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    chatSessionsByUserId =
      parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(CHAT_SESSIONS_FILE, "{}", "utf-8");
      chatSessionsByUserId = {};
      return;
    }
    throw error;
  }
};

const saveChatSessions = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    CHAT_SESSIONS_FILE,
    JSON.stringify(chatSessionsByUserId, null, 2),
    "utf-8"
  );
};

const getUserSessions = (userId) => {
  if (!chatSessionsByUserId[userId]) {
    chatSessionsByUserId[userId] = [];
  }
  return chatSessionsByUserId[userId];
};

const findUserSession = (userId, chatId) =>
  getUserSessions(userId).find(item => item.id === chatId);

const createUserSession = (userId) => {
  const session = {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    summary: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const sessions = getUserSessions(userId);
  sessions.unshift(session);
  while (sessions.length > 12) {
    sessions.pop();
  }
  return session;
};

const sessionToSummary = (session) => ({
  id: session.id,
  title: session.title,
  updatedAt: session.updatedAt,
  preview:
    session.messages.filter(m => m.role === "user").at(-1)?.content?.slice(0, 80) ||
    "No messages yet"
});

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const publicUser = (user) => ({
  id: user.id,
  email: user.email || null,
  phone: user.phone || null,
  displayName: user.displayName || "",
  city: user.city || "",
  profilePhoto: user.profilePhoto || "",
  bio: user.bio || "",
  aiName: user.aiName || "",
  gender: user.gender || "",
  language: user.language || "",
  professionalTopics: user.phone
    ? getProfessionalTopicsForPhone(user.phone)
    : []
});

const normalizeAiCompanionName = (value) =>
  String(value || "")
    .trim()
    .slice(0, 8);

const normalizeGender = (value) => {
  const v = String(value || "").trim().toLowerCase();
  if (["male", "m", "man", "boy"].includes(v)) return "male";
  if (["female", "f", "woman", "girl"].includes(v)) return "female";
  return "";
};

const normalizeLanguage = (value) => {
  const v = String(value || "").trim().toLowerCase();
  if (["english", "en", "eng"].includes(v)) return "english";
  if (["hindi", "hi", "hin"].includes(v)) return "hindi";
  if (["hinglish", "hi-en", "mix", "mixed"].includes(v)) return "hinglish";
  return "";
};

const loadGuestProfiles = async () => {
  try {
    const raw = await fs.readFile(GUEST_PROFILES_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    guestProfilesByGuestId =
      parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(GUEST_PROFILES_FILE, "{}", "utf-8");
      guestProfilesByGuestId = {};
      return;
    }
    throw error;
  }
};

const saveGuestProfiles = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    GUEST_PROFILES_FILE,
    JSON.stringify(guestProfilesByGuestId, null, 2),
    "utf-8"
  );
};

const normalizeGuestThread = (raw) => {
  if (Array.isArray(raw)) {
    return {
      messages: raw,
      summary: "",
      userMessageCount: raw.filter(m => m.role === "user").length
    };
  }
  const messages = raw?.messages || [];
  return {
    messages,
    summary: raw?.summary || "",
    userMessageCount:
      raw?.userMessageCount ??
      messages.filter(m => m.role === "user").length
  };
};

const getGuestThread = (guestId) => {
  const existing = guestThreadsByGuestId.get(guestId);
  const thread = normalizeGuestThread(existing || { messages: [] });
  guestThreadsByGuestId.set(guestId, thread);
  return thread;
};

const getGuestProfile = (guestId, body = {}) => {
  const stored = guestProfilesByGuestId[guestId] || {};
  const displayName = String(
    body.guestName || body.displayName || stored.displayName || ""
  )
    .trim()
    .slice(0, 40);
  const city = String(body.guestCity || body.city || stored.city || "")
    .trim()
    .slice(0, 60);
  const aiName =
    body.aiName !== undefined
      ? normalizeAiCompanionName(body.aiName)
      : normalizeAiCompanionName(stored.aiName || "");
  const gender =
    body.gender !== undefined
      ? normalizeGender(body.gender)
      : normalizeGender(stored.gender || "");
  const language =
    body.language !== undefined
      ? normalizeLanguage(body.language)
      : normalizeLanguage(stored.language || "");
  if (
    displayName ||
    city ||
    body.aiName !== undefined ||
    body.gender !== undefined ||
    body.language !== undefined ||
    stored.aiName ||
    stored.gender ||
    stored.language
  ) {
    guestProfilesByGuestId[guestId] = {
      displayName: displayName || stored.displayName || "",
      city: city || stored.city || "",
      aiName: aiName || stored.aiName || "",
      gender: gender || stored.gender || "",
      language: language || stored.language || ""
    };
  }
  return (
    guestProfilesByGuestId[guestId] || {
      displayName: "",
      city: "",
      aiName: "",
      gender: "",
      language: ""
    }
  );
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token || !sessions.has(token)) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  req.user = sessions.get(token);
  next();
};

const getUserFromAuthHeader = (authorizationHeader) => {
  const authHeader = authorizationHeader || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token || !sessions.has(token)) {
    return null;
  }

  return sessions.get(token);
};

const getActorId = (req) => {
  const authedUser = getUserFromAuthHeader(req.headers.authorization);
  if (authedUser?.id) {
    return { type: "user", id: authedUser.id, user: authedUser };
  }

  const guestId = String(
    req.body?.guestId || req.query?.guestId || ""
  ).trim();
  if (guestId) {
    return { type: "guest", id: guestId, user: null };
  }
  return null;
};

const normalizeTopic = (topic) => {
  const value = String(topic || "").trim().toLowerCase();
  if (value === "lawyers") return "lawyers";
  if (value === "tarot") return "tarot";
  if (value === "astro") return "astro";
  return null;
};

const loadUsers = async () => {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    users = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(USERS_FILE, "[]", "utf-8");
      users = [];
      return;
    }
    throw error;
  }
};

const saveUsers = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    USERS_FILE,
    JSON.stringify(users, null, 2),
    "utf-8"
  );
};

const loadProfessionals = async () => {
  try {
    const raw = await fs.readFile(PROFESSIONALS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      professionals = {
        lawyers: parsed.lawyers ?? [],
        tarot: parsed.tarot ?? [],
        astro: parsed.astro ?? []
      };
      normalizeProfessionalsOnLoad();
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(
        PROFESSIONALS_FILE,
        JSON.stringify(professionals, null, 2),
        "utf-8"
      );
      return;
    }
    throw error;
  }
};

const saveProfessionals = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    PROFESSIONALS_FILE,
    JSON.stringify(professionals, null, 2),
    "utf-8"
  );
};

const loadSupportRequests = async () => {
  try {
    const raw = await fs.readFile(SUPPORT_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    supportRequests = Array.isArray(parsed) ? parsed : [];
    normalizeSupportRequestsOnLoad();
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(SUPPORT_FILE, "[]", "utf-8");
      supportRequests = [];
      return;
    }
    throw error;
  }
};

const saveSupportRequests = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    SUPPORT_FILE,
    JSON.stringify(supportRequests, null, 2),
    "utf-8"
  );
};

const loadProStatus = async () => {
  try {
    const raw = await fs.readFile(PRO_STATUS_FILE, "utf-8");
    proStatusByPhone = JSON.parse(raw) || {};
  } catch (error) {
    if (error.code === "ENOENT") {
      proStatusByPhone = {};
      await fs.writeFile(PRO_STATUS_FILE, "{}", "utf-8");
      return;
    }
    throw error;
  }
};

const saveProStatus = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    PRO_STATUS_FILE,
    JSON.stringify(proStatusByPhone, null, 2),
    "utf-8"
  );
};

const loadProTemplates = async () => {
  try {
    const raw = await fs.readFile(PRO_TEMPLATES_FILE, "utf-8");
    proTemplatesByPhone = JSON.parse(raw) || {};
  } catch (error) {
    if (error.code === "ENOENT") {
      proTemplatesByPhone = {};
      await fs.writeFile(PRO_TEMPLATES_FILE, "{}", "utf-8");
      return;
    }
    throw error;
  }
};

const saveProTemplates = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    PRO_TEMPLATES_FILE,
    JSON.stringify(proTemplatesByPhone, null, 2),
    "utf-8"
  );
};

const loadPeerSessions = async () => {
  try {
    const raw = await fs.readFile(PEER_SESSIONS_FILE, "utf-8");
    peerSessions = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      peerSessions = [];
      await fs.writeFile(PEER_SESSIONS_FILE, "[]", "utf-8");
      return;
    }
    throw error;
  }
};

const savePeerSessions = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    PEER_SESSIONS_FILE,
    JSON.stringify(peerSessions, null, 2),
    "utf-8"
  );
};

const loadPeerSettings = async () => {
  try {
    const raw = await fs.readFile(PEER_SETTINGS_FILE, "utf-8");
    peerSettingsByActor = JSON.parse(raw) || {};
  } catch (error) {
    if (error.code === "ENOENT") {
      peerSettingsByActor = {};
      await fs.writeFile(PEER_SETTINGS_FILE, "{}", "utf-8");
      return;
    }
    throw error;
  }
};

const savePeerSettings = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    PEER_SETTINGS_FILE,
    JSON.stringify(peerSettingsByActor, null, 2),
    "utf-8"
  );
};

const adminGuard = (req, res, next) => {
  const adminKey = process.env.ADMIN_KEY || "change-me-admin-key";
  const provided = String(req.headers["x-admin-key"] || "");
  if (!provided || provided !== adminKey) {
    return res.status(401).json({ error: "Invalid admin key." });
  }
  next();
};

const loadPushSubscriptions = async () => {
  try {
    const raw = await fs.readFile(PUSH_SUBSCRIPTIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    pushSubscriptionsByUserId =
      parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(PUSH_SUBSCRIPTIONS_FILE, "{}", "utf-8");
      pushSubscriptionsByUserId = {};
      return;
    }
    throw error;
  }
};

const savePushSubscriptions = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    PUSH_SUBSCRIPTIONS_FILE,
    JSON.stringify(pushSubscriptionsByUserId, null, 2),
    "utf-8"
  );
};

const sendPushToUserIds = async (userIds, payload) => {
  if (
    !process.env.VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.VAPID_SUBJECT
  ) {
    return;
  }

  for (const userId of userIds) {
    const subscriptions = pushSubscriptionsByUserId[userId] || [];
    const stillValid = [];
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          sub,
          JSON.stringify(payload)
        );
        stillValid.push(sub);
      } catch (error) {
        // drop stale subscriptions
      }
    }
    pushSubscriptionsByUserId[userId] = stillValid;
  }
  await savePushSubscriptions();
};

// ✅ Crisis words
const crisisWords = [
  "suicide",
  "kill myself",
  "end my life",
  "self harm",
  "want to die"
];

app.get("/whatsapp/status", (req, res) => {
  res.json({
    configured: isWhatsAppConfigured()
  });
});

// ✅ WhatsApp OTP endpoints
app.post("/auth/whatsapp/request-otp", async (req, res) => {
  try {
    const phoneE164 = normalizeIndianPhoneToE164(req.body.phone);
    if (!phoneE164) {
      return res.status(400).json({
        error: "Please enter a valid Indian phone number."
      });
    }

    const existing = otpByPhone.get(phoneE164);
    if (
      existing &&
      Date.now() - existing.lastSentAt < OTP_RESEND_COOLDOWN_MS
    ) {
      return res.status(429).json({
        error: "Please wait a moment before requesting another OTP."
      });
    }

    const code = generateOtp();
    otpByPhone.set(phoneE164, {
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
      attemptsLeft: OTP_MAX_ATTEMPTS,
      lastSentAt: Date.now()
    });

    let result;
    try {
      result = await sendWhatsAppOtp({
        toE164: phoneE164,
        code
      });
    } catch (sendError) {
      // Twilio failed (sandbox not joined, wrong number, etc.) — still allow login in dev
      console.error("TWILIO OTP FAILED:", sendError.message);
      console.log(`[DEV FALLBACK] WhatsApp OTP for ${phoneE164}: ${code}`);
      return res.json({
        ok: true,
        dev: true,
        twilioFailed: true,
        message:
          "WhatsApp could not send (check Twilio sandbox). OTP is printed in your backend terminal."
      });
    }

    res.json({
      ok: true,
      dev: result.dev,
      message: result.dev
        ? "Dev mode: OTP is printed in backend terminal logs."
        : "OTP sent via Twilio. If you do not see it, join the Twilio WhatsApp sandbox from your phone first (Twilio Console → Messaging → Try WhatsApp)."
    });
  } catch (error) {
    console.error("WHATSAPP OTP REQUEST ERROR:", error);
    res.status(500).json({
      error: "Could not send OTP right now."
    });
  }
});

app.post("/auth/dev-login", async (req, res) => {
  if (process.env.LOCAL_ONLY !== "1") {
    return res.status(404).json({ error: "Not available." });
  }
  try {
    const phoneE164 = normalizeIndianPhoneToE164(req.body.phone);
    if (!phoneE164) {
      return res.status(400).json({ error: "Invalid phone." });
    }

    let user = users.find(u => phonesMatch(u.phone, phoneE164));
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        phone: phoneE164,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      await saveUsers();
    }

    const token = generateToken();
    sessions.set(token, {
      id: user.id,
      email: user.email || null,
      phone: user.phone || null
    });

    console.log(`[LOCAL DEV LOGIN] ${phoneE164}`);

    res.json({
      token,
      dev: true,
      user: {
        id: user.id,
        email: user.email || null,
        phone: user.phone || null
      }
    });
  } catch (error) {
    console.error("DEV LOGIN ERROR:", error);
    res.status(500).json({ error: "Dev login failed." });
  }
});

app.post("/auth/whatsapp/verify-otp", async (req, res) => {
  try {
    const phoneE164 = normalizeIndianPhoneToE164(req.body.phone);
    const code = String(req.body.code || "").trim();

    if (!phoneE164 || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        error: "Invalid phone or OTP."
      });
    }

    const record = otpByPhone.get(phoneE164);
    if (!record) {
      return res.status(400).json({
        error: "OTP not found. Please request a new one."
      });
    }

    if (Date.now() > record.expiresAt) {
      otpByPhone.delete(phoneE164);
      return res.status(400).json({
        error: "OTP expired. Please request a new one."
      });
    }

    if (record.attemptsLeft <= 0) {
      otpByPhone.delete(phoneE164);
      return res.status(429).json({
        error: "Too many attempts. Please request a new OTP."
      });
    }

    if (record.code !== code) {
      record.attemptsLeft -= 1;
      otpByPhone.set(phoneE164, record);
      return res.status(401).json({
        error: "Incorrect OTP."
      });
    }

    otpByPhone.delete(phoneE164);

    let user = users.find(u => u.phone === phoneE164);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        phone: phoneE164,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      await saveUsers();
    }

    const token = generateToken();
    sessions.set(token, {
      id: user.id,
      email: user.email || null,
      phone: user.phone || null
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email || null,
        phone: user.phone || null
      }
    });
  } catch (error) {
    console.error("WHATSAPP OTP VERIFY ERROR:", error);
    res.status(500).json({
      error: "Could not verify OTP right now."
    });
  }
});

// ✅ Register endpoint
app.post("/auth/register", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters."
      });
    }

    const exists = users.some(user => user.email === email);
    if (exists) {
      return res.status(409).json({
        error: "Account already exists. Please login."
      });
    }

    const newUser = {
      id: crypto.randomUUID(),
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await saveUsers();

    const token = generateToken();
    sessions.set(token, {
      id: newUser.id,
      email: newUser.email,
      phone: newUser.phone || null
    });

    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ error: "Registration failed." });
  }
});

// ✅ Login endpoint
app.post("/auth/login", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  const user = users.find(item => item.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({
      error: "Invalid email or password."
    });
  }

  const token = generateToken();
  sessions.set(token, {
    id: user.id,
    email: user.email,
    phone: user.phone || null
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email
    }
  });
});

// ✅ Current user endpoint
app.get("/auth/me", authMiddleware, (req, res) => {
  const dbUser = users.find(u => u.id === req.user.id) || req.user;
  const professionalTopics = dbUser.phone
    ? getProfessionalTopicsForPhone(dbUser.phone)
    : [];
  res.json({
    user: publicUser(dbUser),
    professionalTopics,
    whatsappConfigured: isWhatsAppConfigured(),
    hasPassword: Boolean(dbUser.passwordHash)
  });
});

app.patch("/auth/profile", authMiddleware, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (req.body.displayName !== undefined) {
      user.displayName = String(req.body.displayName || "")
        .trim()
        .slice(0, 40);
    }
    if (req.body.city !== undefined) {
      user.city = String(req.body.city || "").trim().slice(0, 60);
    }
    if (req.body.profilePhoto !== undefined) {
      const photo = String(req.body.profilePhoto || "");
      if (photo.length > 350000) {
        return res.status(400).json({ error: "Photo too large (max ~250KB)." });
      }
      user.profilePhoto = photo;
    }
    if (req.body.bio !== undefined) {
      user.bio = String(req.body.bio || "").trim().slice(0, 200);
    }
    if (req.body.aiName !== undefined) {
      user.aiName = normalizeAiCompanionName(req.body.aiName);
    }
    if (req.body.gender !== undefined) {
      user.gender = normalizeGender(req.body.gender);
    }
    if (req.body.language !== undefined) {
      user.language = normalizeLanguage(req.body.language);
    }
    await saveUsers();
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);
    res.status(500).json({ error: "Could not update profile." });
  }
});

app.post("/guest/profile", async (req, res) => {
  try {
    const guestId = String(req.body.guestId || "").trim();
    if (!guestId) {
      return res.status(400).json({ error: "guestId is required." });
    }
    const profile = getGuestProfile(guestId, req.body);
    await saveGuestProfiles();
    res.json({ profile });
  } catch (error) {
    console.error("GUEST PROFILE ERROR:", error);
    res.status(500).json({ error: "Could not save profile." });
  }
});

app.post("/auth/change-password", authMiddleware, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const user = users.find(u => u.id === req.user.id);

    if (!user?.passwordHash) {
      return res.status(400).json({
        error: "Password change is only for email accounts."
      });
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(401).json({ error: "Current password is wrong." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters."
      });
    }

    user.passwordHash = hashPassword(newPassword);
    await saveUsers();
    res.json({ ok: true });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ error: "Could not change password." });
  }
});

app.get("/chat/sessions", authMiddleware, (req, res) => {
  const sessions = getUserSessions(req.user.id)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5)
    .map(sessionToSummary);
  res.json({ sessions });
});

app.get("/chat/sessions/:id", authMiddleware, (req, res) => {
  const session = findUserSession(req.user.id, req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Chat not found." });
  }
  res.json({
    session: {
      id: session.id,
      title: session.title,
      messages: session.messages,
      updatedAt: session.updatedAt
    }
  });
});

app.post("/chat/sessions/new", authMiddleware, async (req, res) => {
  const session = createUserSession(req.user.id);
  await saveChatSessions();
  res.json({ session: sessionToSummary(session) });
});

// ✅ Logout endpoint
app.post("/auth/logout", authMiddleware, (req, res) => {
  const token = (req.headers.authorization || "").slice(7).trim();
  sessions.delete(token);
  res.json({ ok: true });
});

app.post("/push/subscribe", authMiddleware, async (req, res) => {
  const subscription = req.body.subscription;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: "Invalid subscription payload." });
  }

  const userId = req.user.id;
  const current = pushSubscriptionsByUserId[userId] || [];
  const exists = current.some(item => item.endpoint === subscription.endpoint);
  if (!exists) {
    current.push(subscription);
    pushSubscriptionsByUserId[userId] = current;
    await savePushSubscriptions();
  }
  res.json({ ok: true });
});

app.get("/guide/status", (req, res) => {
  const topics = ["lawyers", "tarot", "astro"].reduce((acc, topic) => {
    acc[topic] = countOnlineProsForTopic(topic);
    return acc;
  }, {});
  const peers = countOnlinePeers();
  res.json({ topics, peersOnline: peers.matchable, peersTotal: peers.total });
});

app.post("/presence/heartbeat", async (req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Login or guest session required." });
  }
  const settings = getPeerSettings(actor.type, actor.id);
  touchPeerPresence(actor, {
    display: String(req.body?.display || "").trim()
  });
  if (req.body?.contactOk !== undefined || req.body?.anonymous !== undefined) {
    await setPeerSettings(actor.type, actor.id, {
      contactOk:
        req.body.contactOk !== undefined
          ? Boolean(req.body.contactOk)
          : settings.contactOk,
      anonymous:
        req.body.anonymous !== undefined
          ? Boolean(req.body.anonymous)
          : settings.anonymous
    });
  }
  res.json({
    ok: true,
    settings: getPeerSettings(actor.type, actor.id),
    peersOnline: countOnlinePeers()
  });
});

app.get("/presence/stats", (req, res) => {
  res.json(countOnlinePeers());
});

app.get("/peer/settings", (req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Login or guest session required." });
  }
  res.json({ settings: getPeerSettings(actor.type, actor.id) });
});

app.put("/peer/settings", async (req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Login or guest session required." });
  }
  const settings = await setPeerSettings(actor.type, actor.id, {
    contactOk: req.body?.contactOk,
    anonymous: req.body?.anonymous
  });
  res.json({ settings });
});

app.get("/peer/my-active", (req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Login or guest session required." });
  }
  const session = findActivePeerSessionForActor(actor.type, actor.id);
  if (!session) return res.json({ session: null });
  const partner = getPeerPartner(session, actor.type, actor.id);
  res.json({
    session: {
      ...session,
      partnerDisplay: partner?.display || "Saathi user"
    }
  });
});

app.get("/peer/online", (req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Login or guest session required." });
  }
  pruneStalePresence();
  const selfKey = makeActorKey(actor.type, actor.id);
  const stats = countOnlinePeers();
  const people = [];
  for (const [key, entry] of onlinePeers.entries()) {
    if (key === selfKey) continue;
    people.push({
      label: publicOnlinePeerEntry(entry),
      topics: entry.keywords || [],
      openToChat: Boolean(entry.contactOk)
    });
  }
  people.sort((a, b) => Number(b.openToChat) - Number(a.openToChat));
  res.json({ ...stats, people });
});

app.get("/peer/my-chats", (req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Login or guest session required." });
  }
  const sessions = findPeerSessionsForActor(actor.type, actor.id).map(session => {
    const partner = getPeerPartner(session, actor.type, actor.id);
    const lastMsg = (session.messages || [])
      .filter(m => m.senderType !== "system")
      .at(-1);
    return {
      id: session.id,
      status: session.status,
      partnerDisplay: partner?.display || "Saathi user",
      matchedKeywords: session.matchedKeywords || [],
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      preview: lastMsg?.text || "Chat started",
      lastAt: lastMsg?.createdAt || session.updatedAt || session.createdAt
    };
  });
  res.json({ sessions });
});

app.get("/peer/session/:id", (req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Login or guest session required." });
  }
  const session = peerSessions.find(item => item.id === req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found." });
  const isMember =
    (session.participantA.type === actor.type &&
      session.participantA.id === actor.id) ||
    (session.participantB.type === actor.type &&
      session.participantB.id === actor.id);
  if (!isMember) return res.status(403).json({ error: "Not allowed." });
  const partner = getPeerPartner(session, actor.type, actor.id);
  res.json({
    session: { ...session, partnerDisplay: partner?.display || "Saathi user" }
  });
});

app.post("/peer/session/:id/message", async (req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Login or guest session required." });
  }
  const text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "Message required." });
  const session = peerSessions.find(item => item.id === req.params.id);
  if (!session || session.status !== "active") {
    return res.status(400).json({ error: "Chat is not active." });
  }
  const isA =
    session.participantA.type === actor.type &&
    session.participantA.id === actor.id;
  const isB =
    session.participantB.type === actor.type &&
    session.participantB.id === actor.id;
  if (!isA && !isB) return res.status(403).json({ error: "Not allowed." });
  session.messages.push({
    id: crypto.randomUUID(),
    senderType: isA ? "a" : "b",
    senderId: actor.id,
    text,
    createdAt: new Date().toISOString()
  });
  session.updatedAt = new Date().toISOString();
  await savePeerSessions();
  const partner = getPeerPartner(session, actor.type, actor.id);
  res.json({
    session: { ...session, partnerDisplay: partner?.display || "Saathi user" }
  });
});

app.post("/peer/session/:id/leave", async (req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Login or guest session required." });
  }
  const session = peerSessions.find(item => item.id === req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found." });
  const isMember =
    (session.participantA.type === actor.type &&
      session.participantA.id === actor.id) ||
    (session.participantB.type === actor.type &&
      session.participantB.id === actor.id);
  if (!isMember) return res.status(403).json({ error: "Not allowed." });
  session.status = "closed";
  session.closedAt = new Date().toISOString();
  session.updatedAt = session.closedAt;
  session.messages.push({
    id: crypto.randomUUID(),
    senderType: "system",
    senderId: "system",
    text: "Chat ended.",
    createdAt: session.closedAt
  });
  await savePeerSessions();
  res.json({ ok: true });
});

app.post("/pro/status", authMiddleware, async (req, res) => {
  const phone = String(req.user.phone || "").trim();
  if (!phone || !getProfessionalTopicsForPhone(phone).length) {
    return res.status(403).json({ error: "Not a registered professional." });
  }
  const status = req.body?.status === "online" ? "online" : "away";
  const key = normalizePhoneKey(phone);
  proStatusByPhone[key] = { status, updatedAt: new Date().toISOString() };
  await saveProStatus();
  res.json({ status });
});

app.get("/pro/templates", authMiddleware, (req, res) => {
  const phone = normalizePhoneKey(req.user.phone);
  if (!phone) return res.json({ templates: [] });
  res.json({ templates: proTemplatesByPhone[phone] || [] });
});

app.put("/pro/templates", authMiddleware, async (req, res) => {
  const phone = normalizePhoneKey(req.user.phone);
  if (!phone || !getProfessionalTopicsForPhone(phone).length) {
    return res.status(403).json({ error: "Not a registered professional." });
  }
  const templates = Array.isArray(req.body?.templates)
    ? req.body.templates
        .map(item => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];
  proTemplatesByPhone[phone] = templates;
  await saveProTemplates();
  res.json({ templates });
});

// ✅ Admin panel endpoints
app.get("/admin/data", adminGuard, (req, res) => {
  pruneStalePresence();
  res.json({
    users,
    professionals,
    supportRequests,
    peerSessions,
    onlinePeers: [...onlinePeers.entries()].map(([key, entry]) => ({
      key,
      ...entry,
      lastSeen: new Date(entry.lastSeen).toISOString()
    })),
    onlinePros: Object.entries(professionals).flatMap(([topic, phones]) =>
      (Array.isArray(phones) ? phones : []).map(phone => ({
        topic,
        phone,
        status: getProStatus(phone)
      }))
    )
  });
});

app.put("/admin/professionals", adminGuard, async (req, res) => {
  const incoming = req.body || {};
  const normalizePhoneList = (value) => {
    const list = Array.isArray(value)
      ? value
      : String(value || "")
          .split(/[,;\n]+/)
          .map(item => item.trim())
          .filter(Boolean);
    return [...new Set(list.map(item => normalizePhoneKey(item)).filter(Boolean))];
  };

  professionals = {
    lawyers: normalizePhoneList(incoming.lawyers),
    tarot: normalizePhoneList(incoming.tarot),
    astro: normalizePhoneList(incoming.astro)
  };
  await saveProfessionals();
  res.json({ ok: true, professionals });
});

app.get("/admin/kb/status", adminGuard, (req, res) => {
  res.json(getKbStatus());
});

app.get("/admin/kb/test-queries", adminGuard, (req, res) => {
  res.json({ queries: loadTestQueries() });
});

app.post("/admin/kb/review", adminGuard, async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ error: "message is required." });
    }
    const result = await reviewOne({
      message,
      threadSummary: String(req.body?.threadSummary || "").trim(),
      recentTopics: Array.isArray(req.body?.recentTopics) ? req.body.recentTopics : [],
      live: Boolean(req.body?.live),
      limit: Math.min(5, Math.max(1, Number(req.body?.limit) || 3)),
      apiKey: OPENAI_API_KEY,
      companionName: String(req.body?.companionName || "Saathi").trim() || "Saathi"
    });
    res.json({ result });
  } catch (err) {
    console.error("KB review error:", err);
    res.status(500).json({ error: err.message || "KB review failed." });
  }
});

app.post("/admin/kb/review/batch", adminGuard, async (req, res) => {
  try {
    const data = await runBatchReview({
      live: Boolean(req.body?.live),
      apiKey: OPENAI_API_KEY,
      ids: Array.isArray(req.body?.ids) ? req.body.ids : null
    });
    res.json(data);
  } catch (err) {
    console.error("KB batch review error:", err);
    res.status(500).json({ error: err.message || "KB batch review failed." });
  }
});

app.post("/admin/kb/review/thread", adminGuard, async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages)
      ? req.body.messages.map(m => String(m || "").trim()).filter(Boolean)
      : [];
    if (!messages.length) {
      return res.status(400).json({ error: "messages array is required." });
    }
    const data = await runThreadReview(messages, {
      live: Boolean(req.body?.live),
      apiKey: OPENAI_API_KEY
    });
    res.json(data);
  } catch (err) {
    console.error("KB thread review error:", err);
    res.status(500).json({ error: err.message || "KB thread review failed." });
  }
});

app.get("/admin/kb/corrections", adminGuard, (req, res) => {
  res.json({
    corrections: listCorrections({
      category: req.query.category,
      slug: req.query.slug,
      limit: Math.min(100, Number(req.query.limit) || 50)
    })
  });
});

app.post("/admin/kb/corrections", adminGuard, async (req, res) => {
  try {
    const record = await addCorrection(
      {
        triggerMessage: req.body?.triggerMessage,
        approvedReply: req.body?.approvedReply,
        category: req.body?.category,
        slug: req.body?.slug,
        topic: req.body?.topic,
        aiReplyWas: req.body?.aiReplyWas
      },
      OPENAI_API_KEY
    );
    res.json({ ok: true, correction: record });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to save correction." });
  }
});

app.delete("/admin/kb/corrections/:id", adminGuard, async (req, res) => {
  try {
    await deleteCorrection(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(404).json({ error: err.message || "Not found." });
  }
});

// ✅ Professional help chat
app.post("/support/request", async (req, res) => {
  try {
    const actor = getActorId(req);
    if (!actor) {
      return res.status(401).json({
        error: "Login or guest session is required."
      });
    }

    const topic = normalizeTopic(req.body?.topic);
    if (!topic) {
      return res.status(400).json({ error: "Invalid topic." });
    }

    const assignedPhone = pickRandomProfessionalPhone(topic);
    if (!assignedPhone) {
      return res.status(400).json({
        error: "No professional is configured for this topic yet."
      });
    }

    const existing = findOpenSupportRequestForActorTopic(actor, topic);
    if (existing) {
      return res.json({
        request: existing,
        existing: true,
        links: { appBase: getPublicAppBase() }
      });
    }

    const createdAt = new Date().toISOString();
    const request = {
      id: crypto.randomUUID(),
      topic,
      assignedPhone,
      requesterType: actor.type,
      requesterId: actor.id,
      requesterDisplay: actor.user?.email || actor.user?.phone || actor.id,
      status: "waiting",
      acceptedBy: null,
      createdAt,
      messages: [
        {
          id: crypto.randomUUID(),
          senderType: "system",
          senderId: "system",
          text: `Request sent on ${formatRequestStamp(createdAt)}. Someone is soon joining.`,
          createdAt
        }
      ]
    };

    supportRequests.push(request);
    await saveSupportRequests();

    const recipientUserIds = users
      .filter(item => phonesMatch(item.phone, assignedPhone))
      .map(item => item.id);

    const acceptLink = buildShortSupportLink(request.id);
    const guestOpenLink =
      request.requesterType === "guest"
        ? buildSaathiDeepLink(
            { requestId: request.id, guestId: request.requesterId },
            req
          )
        : buildSaathiDeepLink({ requestId: request.id }, req);

    const stamp = formatRequestStamp(request.createdAt);
    await sendPushToUserIds(recipientUserIds, {
      title: "New Saathi client request",
      body: `${topic.toUpperCase()} · ${stamp} — tap to accept or decline`,
      url: buildProDeepLink(request.id, "accept")
    });

    if (process.env.NOTIFY_PRO_VIA_WHATSAPP === "1") {
      await notifyWhatsAppSafe(
        assignedPhone,
        formatProfessionalWhatsAppAlert({
          topic,
          requesterDisplay: request.requesterDisplay,
          requestId: request.id,
          createdAt: request.createdAt
        })
      );
    }

    res.json({
      request,
      links: {
        professionalAccept: acceptLink,
        clientOpen: guestOpenLink,
        appBase: getPublicAppBase()
      }
    });
  } catch (error) {
    console.error("SUPPORT REQUEST ERROR:", error);
    res.status(500).json({ error: "Failed to create support request." });
  }
});

app.get("/support/my-active", wrapAsync((req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  const request = findOpenSupportRequestForActor(actor);
  res.json({ request: request || null });
}));

app.get("/support/my-chats", wrapAsync((req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  const requests = findOpenSupportRequestsForActor(actor);
  res.json({ requests });
}));

app.get("/support/inbox", authMiddleware, (req, res) => {
  const phone = String(req.user.phone || "").trim();
  if (!phone) {
    return res.json({ requests: [] });
  }
  const requests = supportRequests
    .filter(
      item =>
        phonesMatch(item.assignedPhone, phone) &&
        (item.status === "waiting" || item.status === "active")
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  res.json({ requests });
});

app.post("/support/request/:id/accept", authMiddleware, async (req, res) => {
  const request = supportRequests.find(item => item.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found." });
  }

  const phone = String(req.user.phone || "").trim();
  if (!phone || !phonesMatch(phone, request.assignedPhone)) {
    return res.status(403).json({ error: "Not allowed." });
  }

  if (request.status === "active") {
    return res.json({ request });
  }
  if (request.status !== "waiting") {
    return res.status(400).json({ error: "Request is no longer available." });
  }

  activateSupportRequest(request, req.user.id);
  await saveSupportRequests();

  const requesterPhone = findUserPhoneByRequester(request);
  if (requesterPhone) {
    const chatLink = buildSaathiDeepLink(
      {
        requestId: request.id,
        guestId:
          request.requesterType === "guest" ? request.requesterId : undefined
      },
      req
    );
    await notifyWhatsAppSafe(
      requesterPhone,
      whatsappWithOpenLink(
        `Saathi: Your ${request.topic.toUpperCase()} professional has joined the chat.`,
        chatLink
      )
    );
  }

  res.json({ request });
});

app.post("/support/request/:id/decline", authMiddleware, async (req, res) => {
  const request = supportRequests.find(item => item.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found." });
  }

  const phone = String(req.user.phone || "").trim();
  if (!phone || !phonesMatch(phone, request.assignedPhone)) {
    return res.status(403).json({ error: "Not allowed." });
  }

  if (request.status !== "waiting") {
    return res.status(400).json({ error: "Request is no longer pending." });
  }

  request.status = "declined";
  request.declinedBy = req.user.id;
  request.declinedAt = new Date().toISOString();
  touchSupportRequest(request);
  request.messages.push({
    id: crypto.randomUUID(),
    senderType: "system",
    senderId: "system",
    text:
      "The professional is busy at the moment. Please connect later.",
    createdAt: new Date().toISOString()
  });
  await saveSupportRequests();

  res.json({ request });
});

app.post("/support/request/:id/close", async (req, res) => {
  const request = supportRequests.find(item => item.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found." });
  }

  const authedUser = getUserFromAuthHeader(req.headers.authorization);
  const actor = getActorId(req);
  const isPro =
    authedUser?.phone &&
    phonesMatch(authedUser.phone, request.assignedPhone);
  const isRequester =
    actor &&
    request.requesterType === actor.type &&
    request.requesterId === actor.id;

  if (!isPro && !isRequester) {
    return res.status(403).json({ error: "Not allowed." });
  }

  if (request.status === "closed") {
    return res.json({ request });
  }

  request.status = "closed";
  request.closedAt = new Date().toISOString();
  touchSupportRequest(request);
  request.messages.push({
    id: crypto.randomUUID(),
    senderType: "system",
    senderId: "system",
    text: "Chat ended.",
    createdAt: new Date().toISOString()
  });
  await saveSupportRequests();

  res.json({ request });
});

app.get("/support/pro/history", authMiddleware, (req, res) => {
  const phone = String(req.user.phone || "").trim();
  if (!phone) {
    return res.json({ requests: [] });
  }
  const cutoff = Date.now() - SUPPORT_RETENTION_MS;
  const requests = supportRequests
    .filter(
      item =>
        phonesMatch(item.assignedPhone, phone) &&
        getRequestLastActivityMs(item) >= cutoff
    )
    .sort(
      (a, b) =>
        getRequestLastActivityMs(b) - getRequestLastActivityMs(a)
    );
  res.json({ requests });
});

app.get("/support/request/:id", wrapAsync((req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const request = supportRequests.find(item => item.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found." });
  }

  const isRequester =
    request.requesterType === actor.type && request.requesterId === actor.id;
  const isAssignedProfessional =
    actor.user &&
    phonesMatch(actor.user.phone, request.assignedPhone);

  if (!isRequester && !isAssignedProfessional) {
    return res.status(403).json({ error: "Not allowed." });
  }

  res.json({ request });
}));

app.post("/support/request/:id/message", wrapAsync(async (req, res) => {
  const actor = getActorId(req);
  if (!actor) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const text = String(req.body?.text || "").trim();
  if (!text) {
    return res.status(400).json({ error: "Message is required." });
  }

  const request = supportRequests.find(item => item.id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found." });
  }

  const isRequester =
    request.requesterType === actor.type && request.requesterId === actor.id;
  const isAssignedProfessional =
    actor.user &&
    phonesMatch(actor.user.phone, request.assignedPhone);

  if (!isRequester && !isAssignedProfessional) {
    return res.status(403).json({ error: "Not allowed." });
  }

  if (request.status === "declined" || request.status === "closed") {
    return res.status(400).json({ error: "This chat is no longer active." });
  }

  if (isAssignedProfessional && request.status === "waiting") {
    activateSupportRequest(request, actor.id);
  }

  request.messages.push({
    id: crypto.randomUUID(),
    senderType: isAssignedProfessional ? "professional" : "user",
    senderId: actor.id,
    text,
    createdAt: new Date().toISOString()
  });
  touchSupportRequest(request);
  await saveSupportRequests();

  if (!isAssignedProfessional && request.status === "active") {
    await sendPushToUserIds(getProUserIdsForPhone(request.assignedPhone), {
      title: "New client message",
      body: text.length > 80 ? `${text.slice(0, 77)}…` : text,
      url: buildProDeepLink(request.id)
    });
  }

  res.json({ ok: true, request });
}));

// ✅ Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const userMessage = String(req.body.message || "").trim();
    if (!userMessage) {
      return res.status(400).json({ reply: "Message is required." });
    }

    const actor = getActorId(req);

    const isCrisis = crisisWords.some(word =>
      userMessage.toLowerCase().includes(word)
    );
    if (isCrisis) {
      return res.json({
        reply:
          "I'm really glad you shared this with me. Please consider reaching out to someone you trust or contact Kiran Helpline (India): 1800-599-0019."
      });
    }

    const authedUser = getUserFromAuthHeader(req.headers.authorization);
    const userId = authedUser?.id || null;
    const incomingChatId = String(req.body.chatId || "").trim();
    const guestId = String(req.body?.guestId || "").trim();
    const HISTORY_LIMIT = 16;

    let chatSession = null;
    let guestThread = null;
    let history = [];
    let threadSummary = "";

    const dbUser = userId ? users.find(u => u.id === userId) : null;
    let displayName =
      dbUser?.displayName ||
      String(req.body.guestName || req.body.displayName || "").trim().slice(0, 40);
    let city =
      dbUser?.city ||
      String(req.body.guestCity || req.body.city || "").trim().slice(0, 60);
    let companionName = "Saathi";
    let userGender =
      normalizeGender(dbUser?.gender) || normalizeGender(req.body.gender);
    let userLanguage =
      normalizeLanguage(dbUser?.language) || normalizeLanguage(req.body.language);

    if (userId) {
      if (incomingChatId) {
        chatSession = findUserSession(userId, incomingChatId);
      }
      if (!chatSession) {
        chatSession = createUserSession(userId);
      }
      history = chatSession.messages.slice(-HISTORY_LIMIT);
      threadSummary = chatSession.summary || "";
      companionName =
        normalizeAiCompanionName(dbUser?.aiName) ||
        normalizeAiCompanionName(req.body.aiName) ||
        "Saathi";
    } else if (guestId) {
      guestThread = getGuestThread(guestId);
      history = guestThread.messages.slice(-HISTORY_LIMIT);
      threadSummary = guestThread.summary || "";
      const guestProfile = getGuestProfile(guestId, req.body);
      displayName = guestProfile.displayName || "";
      city = guestProfile.city || "";
      companionName =
        normalizeAiCompanionName(guestProfile.aiName) ||
        normalizeAiCompanionName(req.body.aiName) ||
        "Saathi";
      userGender = normalizeGender(guestProfile.gender) || userGender;
      userLanguage = normalizeLanguage(guestProfile.language) || userLanguage;
      if (
        req.body.guestName ||
        req.body.guestCity ||
        req.body.aiName !== undefined ||
        req.body.gender !== undefined ||
        req.body.language !== undefined
      ) {
        await saveGuestProfiles();
      }
    }

    history.push({ role: "user", content: userMessage });

    if (chatSession) {
      if (chatSession.title === "New chat" && userMessage) {
        chatSession.title = makeChatTitle(userMessage);
      }
      chatSession.messages = history;
      chatSession.updatedAt = new Date().toISOString();
    }

    const trimmedHistory = history.slice(-HISTORY_LIMIT);

    if (shouldRefreshSummary(trimmedHistory, threadSummary)) {
      threadSummary = await refreshThreadSummary({
        apiKey: OPENAI_API_KEY,
        history: trimmedHistory,
        currentSummary: threadSummary
      });
      if (chatSession) chatSession.summary = threadSummary;
      if (guestThread) guestThread.summary = threadSummary;
    }

    const isShortFollowUp =
      userMessage.split(/\s+/).length <= 6 &&
      /^(what|how|why|help|then|ok|okay|idk|so|aur|ab|now|kya|kaise)\b/i.test(
        userMessage
      );
    const threadHint =
      isShortFollowUp && trimmedHistory.length > 1
        ? "\n\n[Short follow-up — continue the SAME topic from summary and chat. Give concrete steps. Do NOT ask them to share again from scratch.]"
        : "";

    const userMsgCount = countUserMessages(trimmedHistory);
    const helpHint = isAskingForHelp(userMessage)
      ? buildHelpHint(companionName)
      : "";
    const nameHint = buildNameHint(
      displayName,
      shouldUseName(userMsgCount)
    );
    const genderHint = buildGenderHint(trimmedHistory, userMessage, userGender);
    const languageHint = buildLanguageHint(userLanguage);

    const recentKbTopics = chatSession?.recentKbTopics || guestThread?.recentKbTopics || [];

    const kbMatches = await findKnowledgeMatches(
      userMessage,
      threadSummary,
      2,
      OPENAI_API_KEY,
      recentKbTopics
    );
    const topicKeys = getUsedTopicKeys(kbMatches);
    const matchedCorrections = await findMatchingCorrections(
      userMessage,
      threadSummary,
      topicKeys,
      OPENAI_API_KEY,
      2
    );

    const knowledgeHint = await buildKnowledgeContext(
      userMessage,
      threadSummary,
      companionName,
      OPENAI_API_KEY,
      recentKbTopics,
      matchedCorrections
    );

    const newKbTopics = [
      ...recentKbTopics,
      ...topicKeys
    ].slice(-6);

    const systemContent = buildSystemPrompt({
      companionName,
      threadSummary,
      displayName,
      city,
      openerHint: pickRandomOpener(),
      threadHint,
      helpHint,
      nameHint,
      genderHint,
      languageHint,
      knowledgeHint
    });

    let reply;
    try {
      reply = await generateSaathiReply({
        apiKey: OPENAI_API_KEY,
        systemContent,
        history: trimmedHistory,
        fewShots: pickFewShots(8),
        extraFewShots: correctionsToFewShots(matchedCorrections)
      });
    } catch (error) {
      console.error("OPENAI ERROR:", error);
      reply =
        "Arre network glitch lag raha hai — ek sec baad dubara likh de. Tab tak bata, abhi sabse zyada kya chal raha hai?";
    }

    const finalHistory = trimmedHistory
      .concat({ role: "assistant", content: reply })
      .slice(-HISTORY_LIMIT);

    if (userId && chatSession) {
      chatSession.messages = finalHistory;
      chatSession.recentKbTopics = newKbTopics;
      chatSession.updatedAt = new Date().toISOString();
      const all = getUserSessions(userId);
      all.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      chatSessionsByUserId[userId] = all;
      await saveChatSessions();
    } else if (guestId && guestThread) {
      guestThread.messages = finalHistory;
      guestThread.recentKbTopics = newKbTopics;
      guestThread.userMessageCount = countUserMessages(finalHistory);
      guestThreadsByGuestId.set(guestId, guestThread);
    }

    let peerMatch = null;
    if (actor) {
      touchPeerPresence(actor, { display: displayName });
      try {
        peerMatch = await tryPeerMatch(actor, userMessage);
      } catch (error) {
        console.error("PEER MATCH ERROR:", error);
      }
    }

    res.json({
      reply,
      chatId: chatSession?.id || null,
      peerMatch
    });
  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({ reply: "Server crashed" });
  }
});

app.get("/r/:requestId", (req, res) => {
  const request = supportRequests.find(item => item.id === req.params.requestId);
  if (!request) {
    return res.status(404).send("Support request not found.");
  }
  const action = String(req.query.action || "accept").trim() || "accept";
  const target = buildSaathiDeepLink(
    {
      requestId: request.id,
      action,
      guestId:
        request.requesterType === "guest" ? request.requesterId : undefined
    },
    req,
    { preferPublic: true }
  );
  res.redirect(302, target);
});

app.get("/config/app-url", (req, res) => {
  const lan = getLanIPv4Base();
  const base = getPublicAppBase();
  res.json({
    appBase: base,
    lanBase: lan,
    localhost: `http://localhost:${SERVER_PORT}`,
    phoneUsable: Boolean(lan) || !isLocalAppUrl(base),
    hint: isLocalAppUrl(base) && !lan
      ? "Local dev only: set APP_URL to a public HTTPS URL before launch, or use Wi-Fi IP for phone testing."
      : isLocalAppUrl(base) && lan
        ? "Dev mode: phone testing on same Wi-Fi only. For real users, deploy and set APP_URL to your public HTTPS site."
        : "Production: WhatsApp links use your public app URL — users can be on any network."
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    version: SERVER_VERSION,
    frontendBuilt: existsSync(path.join(FRONTEND_DIST, "index.html")),
    appBase: getPublicAppBase(),
    lanBase: getLanIPv4Base(),
    localOnly: process.env.LOCAL_ONLY === "1"
  });
});

app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    error: err.message || "Internal server error"
  });
});

// ✅ Start server
const startServer = async () => {
  if (
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  ) {
    try {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    } catch (error) {
      console.error("Invalid VAPID keys:", error.message);
    }
  }
  await loadUsers();
  await loadProfessionals();
  await loadSupportRequests();
  await loadPushSubscriptions();
  await loadChatSessions();
  await loadGuestProfiles();
  await loadProStatus();
  await loadProTemplates();
  await loadPeerSessions();
  await loadPeerSettings();
  await purgeOldSupportRequests();
  await purgeOldPeerSessions();

  if (existsSync(path.join(PRO_DIST, "index.html"))) {
    app.use("/pro", express.static(PRO_DIST));
    app.get(/^\/pro(\/.*)?$/, (req, res) => {
      res.sendFile(path.join(PRO_DIST, "index.html"));
    });
    console.log("Serving Saathi Partner UI from", PRO_DIST);
  }

  if (existsSync(path.join(FRONTEND_DIST, "index.html"))) {
    app.use(express.static(FRONTEND_DIST));
    app.get(/^(?!\/(auth|chat|support|admin|whatsapp|push|health|config|r|peer|presence|guide|pro)(\/|$)).*/, (req, res) => {
      res.sendFile(path.join(FRONTEND_DIST, "index.html"));
    });
    console.log("Serving Saathi UI from", FRONTEND_DIST);
  } else {
    app.get("/", (req, res) => {
      res.send(
        "Saathi API on port 3000. Build UI: cd saathi-react && npm run build — then restart."
      );
    });
  }

  const publicBase = getPublicAppBase();
  const lanBase = getLanIPv4Base();

  app.listen(SERVER_PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${SERVER_PORT} (${SERVER_VERSION})`);
    if (lanBase) {
      console.log(`Phone / WhatsApp links (same Wi-Fi): ${lanBase}`);
    }
    console.log(`Public app URL for links: ${publicBase}`);
    if (isLocalAppUrl(publicBase) && !lanBase) {
      console.log(
        "WARNING: Set APP_URL in .env to your Wi-Fi IP so WhatsApp links work on phones."
      );
    }
  });
};

startServer().catch(error => {
  console.error("STARTUP ERROR:", error);
});