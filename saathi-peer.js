import crypto from "crypto";

export const PEER_KEYWORD_GROUPS = {
  job: [
    "job",
    "jobs",
    "career",
    "work",
    "office",
    "boss",
    "interview",
    "naukri",
    "salary",
    "promotion",
    "resign"
  ],
  relationship: [
    "relationship",
    "boyfriend",
    "girlfriend",
    "partner",
    "breakup",
    "love",
    "dating",
    "crush",
    "ex"
  ],
  marriage: [
    "marriage",
    "married",
    "wedding",
    "husband",
    "wife",
    "in-laws",
    "saas",
    "sasur",
    "shaadi",
    "divorce"
  ],
  family: [
    "family",
    "parents",
    "mother",
    "father",
    "maa",
    "papa",
    "sibling",
    "brother",
    "sister"
  ],
  stress: [
    "stress",
    "stressed",
    "anxiety",
    "anxious",
    "tension",
    "overwhelmed",
    "panic",
    "depressed"
  ],
  money: ["money", "finance", "loan", "debt", "emi", "paisa", "financial", "broke"],
  health: ["health", "sick", "illness", "hospital", "doctor", "pain", "mental"],
  loneliness: ["lonely", "loneliness", "alone", "isolated", "no friends", "akela"]
};

export const extractPeerKeywords = (text) => {
  const lower = String(text || "").toLowerCase();
  const found = new Set();
  for (const [topic, terms] of Object.entries(PEER_KEYWORD_GROUPS)) {
    if (terms.some(term => lower.includes(term))) {
      found.add(topic);
    }
  }
  return [...found];
};

export const mergeKeywords = (existing = [], incoming = []) => {
  const set = new Set([...(existing || []), ...(incoming || [])]);
  return [...set].slice(0, 12);
};

export const keywordsOverlap = (a = [], b = []) => {
  const setB = new Set(b);
  return a.filter(key => setB.has(key));
};

export const makeActorKey = (type, id) => `${type}:${id}`;

export const parseActorKey = (key) => {
  const idx = String(key).indexOf(":");
  if (idx === -1) return { type: "", id: "" };
  return {
    type: key.slice(0, idx),
    id: key.slice(idx + 1)
  };
};

export const makePeerDisplay = ({ anonymous, displayName, actorId }) => {
  if (anonymous) {
    const short = String(actorId || "").replace(/-/g, "").slice(-4) || "0000";
    return `Saathi friend #${short}`;
  }
  return displayName?.trim() || "Saathi user";
};

export const createPeerSession = ({
  actorA,
  actorB,
  matchedKeywords,
  displayA,
  displayB
}) => ({
  id: crypto.randomUUID(),
  participantA: {
    type: actorA.type,
    id: actorA.id,
    anonymous: Boolean(actorA.anonymous),
    display: displayA
  },
  participantB: {
    type: actorB.type,
    id: actorB.id,
    anonymous: Boolean(actorB.anonymous),
    display: displayB
  },
  matchedKeywords: matchedKeywords || [],
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [
    {
      id: crypto.randomUUID(),
      senderType: "system",
      senderId: "system",
      text:
        "You are now connected with someone who may be going through something similar. Be kind and respectful.",
      createdAt: new Date().toISOString()
    }
  ]
});
