#!/usr/bin/env node
/**
 * Build vector embeddings for Saathi knowledge base topics.
 * Requires OPENAI_API_KEY in environment or .env
 * Usage: node scripts/build-kb-embeddings.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const KB_DIR = path.join(ROOT, "knowledge-base");
const INDEX_PATH = path.join(KB_DIR, "search-index.json");
const OUT_PATH = path.join(KB_DIR, "embeddings.json");

const MODEL = "text-embedding-3-small";
const BATCH_SIZE = 50;

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY required. Set in .env or environment.");
  process.exit(1);
}

if (!fs.existsSync(INDEX_PATH)) {
  console.error("search-index.json not found. Run: npm run kb:generate");
  process.exit(1);
}

async function embedBatch(texts) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      input: texts
    })
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || "Embedding API error");
  }

  return data.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

async function main() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  const topics = index.topics || [];
  const results = [];

  console.log(`Embedding ${topics.length} topics with ${MODEL}...`);

  for (let i = 0; i < topics.length; i += BATCH_SIZE) {
    const batch = topics.slice(i, i + BATCH_SIZE);
    const texts = batch.map(
      (t) => t.searchText || `${t.topic}. ${t.overview || ""}`
    );
    const embeddings = await embedBatch(texts);

    for (let j = 0; j < batch.length; j++) {
      results.push({
        slug: batch[j].slug,
        category: batch[j].category,
        topic: batch[j].topic,
        enriched: Boolean(batch[j].enriched),
        embedding: embeddings[j]
      });
    }

    console.log(`  ${Math.min(i + BATCH_SIZE, topics.length)} / ${topics.length}`);
  }

  const out = {
    model: MODEL,
    dimensions: results[0]?.embedding?.length || 1536,
    generatedAt: new Date().toISOString(),
    count: results.length,
    topics: results
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out));
  console.log(`Wrote ${OUT_PATH} (${results.length} vectors)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
