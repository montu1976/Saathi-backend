/**
 * Hybrid keyword + semantic retrieval for Saathi knowledge base.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.join(__dirname, "knowledge-base");
const INDEX_PATH = path.join(KB_DIR, "search-index.json");
const EMBEDDINGS_PATH = path.join(KB_DIR, "embeddings.json");

let searchIndex = null;
let embeddingsData = null;

const TOPIC_ALIASES = {
  breakups: ["breakup", "break up", "ex", "dumped", "split", "tod diya"],
  "marriage pressure": ["shaadi", "marriage pressure", "rishta", "rishtedaar", "wedding pressure", "biodata"],
  burnout: ["burnout", "burnt out", "exhausted at work", "mentally drained"],
  loneliness: ["lonely", "loneliness", "akela", "alone", "isolated"],
  anxiety: ["anxious", "anxiety", "panic", "tension", "ghabrahat", "darr lagta"],
  stress: ["stressed", "stress", "pressure", "overwhelmed", "tension"],
  jealousy: ["jealous", "jealousy", "jalan"],
  cheating: ["cheat", "cheating", "affair", "dhokha", "unfaithful"],
  neet: ["neet", "medical entrance", "mbbs", "doctor ban"],
  jee: ["jee", "iit", "engineering entrance", "jee mains", "jee advanced"],
  upsc: ["upsc", "civil services", "ias", "ips"],
  "job loss": ["fired", "laid off", "lost job", "unemployed", "naukri nahi", "layoff", "naukri chali", "naukri gayi", "job gayi"],
  "board exams": ["boards", "board exam", "cbse", "icse", "10th", "12th", "class 10", "class 12"],
  "long distance": ["ldr", "long distance"],
  "mother-in-law": ["saas", "mother in law", "mil", "saas bahu"],
  "father-in-law": ["sasur", "father in law", "fil"],
  bullying: ["bully", "bullied", "ragging", "harassment school"],
  divorce: ["divorce", "talaq", "separation"],
  budgeting: ["budget", "kharcha", "expenses"],
  "financial independence": ["financial freedom", "apna paisa"],
  overthinking: ["overthink", "overthinking", "spiral", "sochta rehta"],
  "low confidence": ["confidence low", "self doubt", "imposter"],
  grief: ["death", "loss", "mourning", "passed away"],
  infertility: ["infertility", "conceive", "baby nahi"],
  widowed: ["widow", "widower", "widowhood"],
  "arranged marriage": ["arranged", "rishta meeting", "biodata", "matrimony"],
  "parents expectations": ["parents expect", "mummy papa pressure", "family expectations"],
  "living-with-in-laws": ["sasural", "joint family", "in laws", "in-laws", "saas sasur", "privacy zero", "rehna pad raha"],
  cheating: ["cheat", "cheating", "affair", "dhokha", "unfaithful", "dating app secret"],
  burnout: ["burnt out", "burnout", "sunday scaries", "mentally drained", "overtime"]
};

const SEMANTIC_WEIGHT = 0.65;
const KEYWORD_WEIGHT = 0.35;
const MIN_SEMANTIC_SCORE = 0.32;
const MIN_HYBRID_SCORE = 0.25;

function loadIndex() {
  if (searchIndex) return searchIndex;
  if (!fs.existsSync(INDEX_PATH)) {
    searchIndex = { topics: [] };
    return searchIndex;
  }
  searchIndex = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  return searchIndex;
}

function loadEmbeddings() {
  if (embeddingsData) return embeddingsData;
  if (!fs.existsSync(EMBEDDINGS_PATH)) {
    embeddingsData = { topics: [] };
    return embeddingsData;
  }
  embeddingsData = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, "utf8"));
  return embeddingsData;
}

function keywordScore(topicEntry, haystack) {
  const topic = topicEntry.topic.toLowerCase();
  const slug = topicEntry.slug || "";
  let score = 0;

  if (haystack.includes(topic)) score += 12;
  if (haystack.includes(slug.replace(/-/g, " "))) score += 8;

  for (const w of topic.split(/\s+/)) {
    if (w.length > 3 && haystack.includes(w)) score += 3;
  }

  const aliases = TOPIC_ALIASES[slug] || TOPIC_ALIASES[topic] || [];
  for (const alias of aliases) {
    if (haystack.includes(alias.toLowerCase())) score += 15;
  }

  const slugPhrase = slug.replace(/-/g, " ");
  if (slugPhrase.length > 3) {
    const re = new RegExp(`\\b${slugPhrase.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (re.test(haystack)) score += 14;
  }

  for (const kw of topicEntry.keywords || []) {
    if (haystack.includes(kw.toLowerCase())) score += 4;
  }

  if (topicEntry.enriched) score += 2;

  return score;
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

async function embedQuery(text, apiKey) {
  if (!apiKey || !String(text || "").trim()) return null;

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: loadEmbeddings().model || "text-embedding-3-small",
      input: String(text).slice(0, 2000)
    })
  });

  const data = await response.json();
  if (data.error) {
    console.error("KB embedding query error:", data.error.message);
    return null;
  }

  return data.data?.[0]?.embedding || null;
}

function normalizeKeywordScores(scored) {
  const max = Math.max(...scored.map((s) => s.keywordScore), 1);
  return scored.map((s) => ({
    ...s,
    keywordNorm: s.keywordScore / max
  }));
}

/**
 * Find top matching topics using hybrid semantic + keyword scoring.
 */
export async function findKnowledgeMatches(
  message,
  threadSummary = "",
  limit = 2,
  apiKey = null,
  recentTopics = []
) {
  const index = loadIndex();
  const haystack = `${message} ${threadSummary}`.toLowerCase();
  const queryText = `${message}\n${threadSummary}`.trim();
  const recentSet = new Set((recentTopics || []).map((k) => k.toLowerCase()));

  const keywordScored = index.topics.map((t) => ({
    ...t,
    keywordScore: keywordScore(t, haystack)
  }));

  const embData = loadEmbeddings();
  const embMap = new Map(
    (embData.topics || []).map((t) => [`${t.category}/${t.slug}`, t.embedding])
  );

  let queryEmbedding = null;
  if (apiKey && embMap.size > 0) {
    queryEmbedding = await embedQuery(queryText, apiKey);
  }

  let scored = keywordScored.map((t) => {
    const key = `${t.category}/${t.slug}`;
    const semanticScore = queryEmbedding
      ? cosineSimilarity(queryEmbedding, embMap.get(key))
      : 0;
    return { ...t, semanticScore };
  });

  scored = normalizeKeywordScores(scored);

  scored = scored.map((t) => {
    const key = `${t.category}/${t.slug}`;
    const wasRecent = recentSet.has(key.toLowerCase());
    const repeatPenalty = wasRecent ? 0.35 : 0;
    const baseScore = queryEmbedding
      ? SEMANTIC_WEIGHT * t.semanticScore + KEYWORD_WEIGHT * t.keywordNorm
      : t.keywordNorm;
    return {
      ...t,
      score: Math.max(0, baseScore - repeatPenalty),
      wasRecent,
      matchType: queryEmbedding ? "hybrid" : "keyword"
    };
  });

  scored = scored
    .filter((t) => {
      if (queryEmbedding) {
        return t.score >= MIN_HYBRID_SCORE || t.keywordScore > 0;
      }
      return t.keywordScore > 0;
    })
    .sort((a, b) => b.score - a.score);

  if (queryEmbedding && scored.length) {
    const top = scored[0];
    if (top.semanticScore < MIN_SEMANTIC_SCORE && top.keywordScore === 0) {
      return [];
    }
  }

  return scored.slice(0, limit);
}

/**
 * Build compact context for system prompt (async for semantic search).
 */
export async function buildKnowledgeContext(
  message,
  threadSummary = "",
  companionName = "Saathi",
  apiKey = null,
  recentTopics = [],
  corrections = [],
  language = ""
) {
  const matches = await findKnowledgeMatches(
    message,
    threadSummary,
    2,
    apiKey,
    recentTopics
  );

  const blocks = matches.map((m) => {
    const parts = [
      `TOPIC: ${m.topic} (${m.categoryLabel || m.category})${m.enriched ? " [curated]" : ""}`,
      m.overview ? `Overview: ${m.overview}` : "",
      m.principles?.length ? `Principles: ${m.principles.join("; ")}` : "",
      m.empathy?.length ? `Empathy tone examples: ${m.empathy.slice(0, 3).join(" | ")}` : "",
      m.advice?.length ? `Practical angles: ${m.advice.slice(0, 3).join(" | ")}` : "",
      m.cultural?.length ? `Indian context: ${m.cultural.slice(0, 2).join(" ")}` : "",
      m.mentalHealthNote ? `Wellbeing note: ${m.mentalHealthNote}` : ""
    ].filter(Boolean);
    return parts.join("\n");
  });

  const aiName = String(companionName || "Saathi").trim() || "Saathi";
  const repeatNote =
    recentTopics.length > 0
      ? "\nDo NOT repeat the same advice or phrases you already gave in this thread—offer a fresh angle or ask a new specific question."
      : "";

  const correctionBlock =
    corrections?.length > 0
      ? `\n\nAPPROVED REPLIES (match tone/structure when similar):\n${corrections
          .map(
            (c) =>
              `User: ${c.triggerMessage}\n${aiName}: ${c.approvedReply}`
          )
          .join("\n\n")}`
      : "";

  if (!matches.length && !correctionBlock) return "";

  const lang = String(language || "").trim().toLowerCase();
  const voiceNote =
    lang === "english"
      ? "use for ideas and facts — reply in English only, do NOT copy Hindi/Hinglish phrasing from below"
      : lang === "hindi"
        ? "use for ideas and facts — reply in Devanagari Hindi only"
        : `still reply in short WhatsApp ${aiName} voice`;

  const topicBlock = matches.length
    ? `KNOWLEDGE BASE (${voiceNote}; do NOT dump lists or sound like an article${repeatNote}):
${blocks.join("\n\n---\n\n")}`
    : "";

  return [topicBlock, correctionBlock].filter(Boolean).join("\n\n").trim();
}

/** Returns topic keys used — store on chat session to reduce repeat injection */
export function getUsedTopicKeys(matches) {
  return (matches || []).slice(0, 2).map((m) => `${m.category}/${m.slug}`);
}

export function reloadKnowledgeIndex() {
  searchIndex = null;
  embeddingsData = null;
  return loadIndex();
}

export function hasEmbeddings() {
  return (loadEmbeddings().topics || []).length > 0;
}
