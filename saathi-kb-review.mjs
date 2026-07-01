/**
 * Shared KB review logic for CLI and admin API.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  findKnowledgeMatches,
  buildKnowledgeContext,
  hasEmbeddings,
  getUsedTopicKeys
} from "./saathi-knowledge.mjs";
import { getCorrectionCount, findMatchingCorrections, correctionsToFewShots } from "./saathi-kb-corrections.mjs";
import {
  buildSystemPrompt,
  generateSaathiReply,
  containsBannedPhrase,
  pickFewShots
} from "./saathi-chat.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TEST_QUERIES_PATH = path.join(__dirname, "scripts", "kb-test-queries.json");

export function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

export function replySimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const w of setA) {
    if (setB.has(w)) inter++;
  }
  const union = setA.size + setB.size - inter;
  return union ? inter / union : 0;
}

export function findRepeatedPhrases(replies, minLen = 4) {
  const phraseCounts = new Map();
  for (const reply of replies) {
    const words = String(reply || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    const seen = new Set();
    for (let i = 0; i <= words.length - minLen; i++) {
      const phrase = words.slice(i, i + minLen).join(" ");
      if (!seen.has(phrase)) {
        seen.add(phrase);
        phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
      }
    }
  }
  return [...phraseCounts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase, count]) => ({ phrase, count }));
}

export function checkExpectations(matches, expectTopics = []) {
  if (!expectTopics.length) return { ok: true, note: "no expectation" };
  const found = matches.map((m) => m.topic);
  const hit = expectTopics.some((t) =>
    found.some((f) => f.toLowerCase().includes(t.toLowerCase()))
  );
  return {
    ok: hit,
    expected: expectTopics,
    got: found,
    note: hit ? "matched expected topic" : "MISSING expected topic"
  };
}

function formatMatches(matches) {
  return matches.map((m) => ({
    topic: m.topic,
    category: m.category,
    slug: m.slug,
    enriched: Boolean(m.enriched),
    score: Number(m.score?.toFixed(3) || 0),
    semantic: Number(m.semanticScore?.toFixed(3) || 0),
    keyword: m.keywordScore || 0,
    matchType: m.matchType,
    wasRecent: Boolean(m.wasRecent)
  }));
}

export async function reviewOne({
  message,
  threadSummary = "",
  recentTopics = [],
  live = false,
  limit = 3,
  label = "",
  apiKey = null,
  companionName = "Saathi"
}) {
  const matches = await findKnowledgeMatches(
    message,
    threadSummary,
    limit,
    apiKey,
    recentTopics
  );
  const topicKeys = getUsedTopicKeys(matches);
  const matchedCorrections = await findMatchingCorrections(
    message,
    threadSummary,
    topicKeys,
    apiKey,
    2
  );

  const knowledgeHint = await buildKnowledgeContext(
    message,
    threadSummary,
    companionName,
    apiKey,
    recentTopics,
    matchedCorrections
  );

  const result = {
    label: label || message.slice(0, 60),
    message,
    threadSummary,
    recentTopics,
    matches: formatMatches(matches),
    matchedCorrections: matchedCorrections.map((c) => ({
      id: c.id,
      triggerMessage: c.triggerMessage,
      score: Number(c.score?.toFixed(3) || 0)
    })),
    knowledgePreview: knowledgeHint
      ? knowledgeHint.slice(0, 800) + (knowledgeHint.length > 800 ? "…" : "")
      : "",
    knowledgeFull: knowledgeHint || "",
    reply: null,
    warnings: []
  };

  if (live) {
    if (!apiKey) {
      result.warnings.push("OPENAI_API_KEY missing — skipping live reply");
    } else {
      const systemContent = buildSystemPrompt({
        companionName,
        threadSummary,
        knowledgeHint
      });
      const history = [{ role: "user", content: message }];
      try {
        result.reply = await generateSaathiReply({
          apiKey,
          systemContent,
          history,
          fewShots: pickFewShots(4),
          extraFewShots: correctionsToFewShots(matchedCorrections)
        });
        if (containsBannedPhrase(result.reply)) {
          result.warnings.push("BANNED_PHRASE detected in reply");
        }
      } catch (err) {
        result.warnings.push(`AI error: ${err.message}`);
      }
    }
  }

  return result;
}

export async function runThreadReview(messages, { live = false, apiKey = null } = {}) {
  const results = [];
  let threadSummary = "";
  let recentTopics = [];

  for (let i = 0; i < messages.length; i++) {
    const message = String(messages[i] || "").trim();
    if (!message) continue;

    const r = await reviewOne({
      message,
      threadSummary,
      recentTopics,
      live,
      label: `Turn ${results.length + 1}`,
      apiKey
    });
    results.push(r);

    recentTopics = [
      ...recentTopics,
      ...getUsedTopicKeys(
        r.matches.map((m) => ({
          category: m.category,
          slug: m.slug
        }))
      )
    ].slice(-6);

    if (r.reply) {
      threadSummary = `${threadSummary} User: ${message}. Saathi: ${r.reply}`.slice(
        -400
      );
    }
  }

  const replies = results.map((r) => r.reply).filter(Boolean);
  const repeatIssues = [];

  for (let i = 1; i < replies.length; i++) {
    const sim = replySimilarity(replies[i - 1], replies[i]);
    if (sim >= 0.45) {
      repeatIssues.push({
        type: "high_similarity",
        between: [`Turn ${i}`, `Turn ${i + 1}`],
        similarity: Number(sim.toFixed(3))
      });
    }
  }

  const phrases = findRepeatedPhrases(replies);
  if (phrases.length) {
    repeatIssues.push({ type: "repeated_phrases", phrases });
  }

  const topicRepeat = results.map((r) => r.matches[0]?.topic).filter(Boolean);
  const sameTopTopic =
    topicRepeat.length > 1 && topicRepeat.every((t) => t === topicRepeat[0]);
  if (sameTopTopic) {
    repeatIssues.push({
      type: "same_kb_topic_every_turn",
      topic: topicRepeat[0]
    });
  }

  return { results, repeatIssues };
}

export function loadTestQueries() {
  if (!fs.existsSync(TEST_QUERIES_PATH)) return [];
  return JSON.parse(fs.readFileSync(TEST_QUERIES_PATH, "utf8"));
}

export async function runBatchReview({ live = false, apiKey = null, ids = null } = {}) {
  let cases = loadTestQueries();
  if (ids?.length) {
    const idSet = new Set(ids);
    cases = cases.filter((c) => idSet.has(c.id));
  }

  const results = [];
  for (const c of cases) {
    const threadSummary = (c.thread || []).join(". ");
    const r = await reviewOne({
      message: c.message,
      threadSummary,
      live,
      label: c.id,
      apiKey
    });
    const expectation = checkExpectations(r.matches, c.expectTopics || []);
    r.expectation = expectation;
    r.id = c.id;
    if (!expectation.ok) r.warnings.push(expectation.note);
    results.push(r);
  }

  return {
    results,
    passed: results.filter((r) => r.expectation?.ok !== false).length,
    total: results.length
  };
}

export function getKbStatus() {
  let enrichedCount = 0;
  let topicCount = 0;
  try {
    const indexPath = path.join(__dirname, "knowledge-base", "index.json");
    if (fs.existsSync(indexPath)) {
      const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      topicCount = index.count || index.topics?.length || 0;
      enrichedCount = (index.topics || []).filter((t) => t.enriched).length;
    }
  } catch {
    /* ignore */
  }

  return {
    embeddings: hasEmbeddings(),
    topicCount,
    enrichedCount,
    testQueryCount: loadTestQueries().length,
    correctionCount: getCorrectionCount()
  };
}
