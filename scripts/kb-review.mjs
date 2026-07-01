#!/usr/bin/env node
/**
 * CLI wrapper for Saathi KB review — see saathi-kb-review.mjs for logic.
 */
import fs from "fs";
import dotenv from "dotenv";
import { hasEmbeddings } from "../saathi-knowledge.mjs";
import {
  reviewOne,
  runThreadReview,
  runBatchReview,
  loadTestQueries
} from "../saathi-kb-review.mjs";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

function parseArgs(argv) {
  const args = {
    query: null,
    batch: false,
    live: false,
    thread: null,
    report: null,
    limit: 3
  };
  const rest = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--batch") args.batch = true;
    else if (a === "--live") args.live = true;
    else if (a === "--thread") {
      args.thread = [];
      while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        args.thread.push(argv[++i]);
      }
    } else if (a === "--report" && argv[i + 1]) {
      args.report = argv[++i];
    } else if (a === "--limit" && argv[i + 1]) {
      args.limit = Number(argv[++i]) || 3;
    } else if (!a.startsWith("--")) {
      rest.push(a);
    }
  }
  if (!args.batch && !args.thread && rest.length) {
    args.query = rest.join(" ");
  }
  return args;
}

function printResult(r, index) {
  console.log(`\n${"─".repeat(60)}`);
  if (index != null) console.log(`#${index + 1} ${r.label}`);
  console.log(`USER: ${r.message}`);
  if (r.threadSummary) console.log(`THREAD: ${r.threadSummary.slice(0, 120)}…`);
  console.log(`MATCHES (${r.matches.length}):`);
  for (const m of r.matches) {
    const tag = m.enriched ? " ★" : "";
    console.log(
      `  • ${m.topic}${tag}  score=${m.score}  sem=${m.semantic}  kw=${m.keyword}`
    );
  }
  if (r.knowledgePreview) console.log(`KB PREVIEW: ${r.knowledgePreview}`);
  if (r.reply) console.log(`REPLY:\n${r.reply}`);
  if (r.warnings?.length) console.log(`⚠ ${r.warnings.join("; ")}`);
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`Embeddings loaded: ${hasEmbeddings() ? "yes" : "no (keyword only)"}`);
  console.log(`Live AI: ${args.live ? "on" : "off"}`);

  const allResults = [];
  let repeatIssues = [];

  if (args.thread?.length) {
    const out = await runThreadReview(args.thread, { live: args.live, apiKey });
    out.results.forEach((r, i) => printResult(r, i));
    repeatIssues = out.repeatIssues;
  } else if (args.batch) {
    const { results } = await runBatchReview({ live: args.live, apiKey });
    results.forEach((r) => printResult(r));
    allResults.push(...results);
  } else if (args.query) {
    const r = await reviewOne({
      message: args.query,
      live: args.live,
      limit: args.limit,
      apiKey
    });
    printResult(r);
    allResults.push(r);
  } else {
    console.log(`
Saathi KB Review Tool — use Saathi Partner Admin → KB Review tab, or:

  node scripts/kb-review.mjs "your message"
  node scripts/kb-review.mjs "your message" --live
  node scripts/kb-review.mjs --batch [--live]
  node scripts/kb-review.mjs --thread "msg1" "msg2" --live
`);
    process.exit(0);
  }

  if (repeatIssues.length) {
    console.log(`\n${"═".repeat(60)}\nREPETITION WARNINGS:`);
    for (const issue of repeatIssues) {
      console.log(`  • ${issue.type}:`, JSON.stringify(issue));
    }
  } else if (args.thread?.length && args.live) {
    console.log(`\n✓ No major repetition flags in thread test`);
  }

  if (args.report) {
    fs.writeFileSync(
      args.report,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          embeddings: hasEmbeddings(),
          live: args.live,
          results: allResults,
          repeatIssues
        },
        null,
        2
      )
    );
    console.log(`\nReport saved: ${args.report}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
