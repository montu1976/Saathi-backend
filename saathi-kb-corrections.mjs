/**
 * Admin-approved reply corrections — persisted and injected into live chat.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const CORRECTIONS_FILE = path.join(DATA_DIR, "kb-corrections.json");
const KB_DIR = path.join(__dirname, "knowledge-base");

let correctionsCache = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadCorrections() {
  if (correctionsCache) return correctionsCache;
  ensureDataDir();
  if (!fs.existsSync(CORRECTIONS_FILE)) {
    correctionsCache = { corrections: [] };
    return correctionsCache;
  }
  try {
    correctionsCache = JSON.parse(fs.readFileSync(CORRECTIONS_FILE, "utf8"));
  } catch {
    correctionsCache = { corrections: [] };
  }
  if (!Array.isArray(correctionsCache.corrections)) {
    correctionsCache = { corrections: [] };
  }
  return correctionsCache;
}

async function saveCorrectionsFile(data) {
  ensureDataDir();
  correctionsCache = data;
  fs.writeFileSync(CORRECTIONS_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function reloadCorrections() {
  correctionsCache = null;
  return loadCorrections();
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function textOverlapScore(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const w of setA) {
    if (setB.has(w)) inter++;
  }
  return inter / Math.min(setA.size, setB.size);
}

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom ? dot / denom : 0;
}

async function embedText(text, apiKey) {
  if (!apiKey || !String(text || "").trim()) return null;
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: String(text).slice(0, 2000)
    })
  });
  const data = await response.json();
  if (data.error) return null;
  return data.data?.[0]?.embedding || null;
}

function appendToTopicMarkdown(category, slug, triggerMessage, approvedReply) {
  const relPath = path.join(category, `${slug}.md`);
  const paths = [
    path.join(KB_DIR, relPath),
    path.join(KB_DIR, "enriched", relPath)
  ].filter((p) => fs.existsSync(p));

  if (!paths.length) return false;

  const heading = "## Approved admin replies";
  const entry = `\n- User: "${triggerMessage.replace(/"/g, "'")}" → Saathi: "${approvedReply.replace(/"/g, "'")}"`;

  for (const filePath of paths) {
    let md = fs.readFileSync(filePath, "utf8");
    if (md.includes(heading)) {
      const idx = md.indexOf(heading);
      const after = md.indexOf("\n## ", idx + heading.length);
      if (after === -1) {
        md = md.trimEnd() + entry + "\n";
      } else {
        md = md.slice(0, after) + entry + md.slice(after);
      }
    } else {
      const relatedIdx = md.indexOf("\n## Related topics");
      const block = `\n${heading}\n${entry.trim()}\n`;
      if (relatedIdx !== -1) {
        md = md.slice(0, relatedIdx) + block + md.slice(relatedIdx);
      } else {
        md = md.trimEnd() + block;
      }
    }
    fs.writeFileSync(filePath, md, "utf8");
  }
  return true;
}

export async function addCorrection(
  {
    triggerMessage,
    approvedReply,
    category,
    slug,
    topic,
    aiReplyWas = ""
  },
  apiKey = null
) {
  const trigger = String(triggerMessage || "").trim();
  const reply = String(approvedReply || "").trim();
  if (!trigger || !reply) {
    throw new Error("triggerMessage and approvedReply are required.");
  }
  if (reply.length > 2000) {
    throw new Error("Reply too long (max 2000 chars).");
  }

  const data = loadCorrections();
  const embedding = await embedText(`${trigger}\n${reply}`, apiKey);

  const record = {
    id: crypto.randomUUID(),
    triggerMessage: trigger,
    approvedReply: reply,
    category: String(category || "").trim(),
    slug: String(slug || "").trim(),
    topic: String(topic || "").trim(),
    aiReplyWas: String(aiReplyWas || "").trim().slice(0, 2000),
    createdAt: new Date().toISOString(),
    embedding
  };

  data.corrections.push(record);
  await saveCorrectionsFile(data);

  if (record.category && record.slug) {
    appendToTopicMarkdown(record.category, record.slug, trigger, reply);
  }

  return record;
}

export async function deleteCorrection(id) {
  const data = loadCorrections();
  const before = data.corrections.length;
  data.corrections = data.corrections.filter((c) => c.id !== id);
  if (data.corrections.length === before) {
    throw new Error("Correction not found.");
  }
  await saveCorrectionsFile(data);
  return { ok: true };
}

export function listCorrections({ category, slug, limit = 50 } = {}) {
  let list = loadCorrections().corrections || [];
  if (category) list = list.filter((c) => c.category === category);
  if (slug) list = list.filter((c) => c.slug === slug);
  return list
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      triggerMessage: c.triggerMessage,
      approvedReply: c.approvedReply,
      category: c.category,
      slug: c.slug,
      topic: c.topic,
      aiReplyWas: c.aiReplyWas,
      createdAt: c.createdAt
    }));
}

export async function findMatchingCorrections(
  message,
  threadSummary = "",
  topicKeys = [],
  apiKey = null,
  limit = 2
) {
  const list = loadCorrections().corrections || [];
  if (!list.length) return [];

  const haystack = `${message} ${threadSummary}`.trim();
  const topicSet = new Set((topicKeys || []).map((k) => k.toLowerCase()));

  let queryEmbedding = null;
  if (apiKey) {
    queryEmbedding = await embedText(haystack, apiKey);
  }

  const scored = list.map((c) => {
    const key = `${c.category}/${c.slug}`.toLowerCase();
    let score = textOverlapScore(haystack, c.triggerMessage);
    if (topicSet.has(key)) score += 0.35;
    if (haystack.toLowerCase().includes(c.triggerMessage.toLowerCase().slice(0, 20))) {
      score += 0.2;
    }
    if (queryEmbedding && c.embedding?.length) {
      score += cosineSimilarity(queryEmbedding, c.embedding) * 0.5;
    }
    return { ...c, score };
  });

  return scored
    .filter((c) => c.score >= 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildCorrectionsContext(corrections, companionName = "Saathi") {
  if (!corrections?.length) return "";
  const aiName = String(companionName || "Saathi").trim() || "Saathi";
  const examples = corrections
    .map(
      (c, i) =>
        `Example ${i + 1}:\nUser: ${c.triggerMessage}\n${aiName} (approved): ${c.approvedReply}`
    )
    .join("\n\n");

  return `
APPROVED REPLIES (when user message is similar, match this tone and structure closely — do NOT copy word-for-word if context differs):
${examples}
`.trim();
}

export function correctionsToFewShots(corrections) {
  return (corrections || []).map((c) => ({
    user: c.triggerMessage,
    good: c.approvedReply
  }));
}

export function getCorrectionCount() {
  return (loadCorrections().corrections || []).length;
}
