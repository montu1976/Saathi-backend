#!/usr/bin/env node
/**
 * Generates Saathi knowledge base markdown files from topics.json
 * Usage: node scripts/generate-knowledge-base.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  CATEGORY_META,
  AGE_ADVICE,
  slugify,
  buildSituations,
  buildEmpathy,
  buildAdviceSnippets,
  buildFollowUps,
  buildRootCauses,
  buildEmotions,
  buildWarningSigns,
  buildHealthyPrinciples,
  buildFirstSteps,
  buildLongTerm,
  buildAvoid,
  buildAiQuestions,
  buildMistakes,
  buildConversationStyle,
  childrenSection,
  financesSection,
  mentalHealthSection,
  buildOverview,
  pickRelated
} from "./kb-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const KB_DIR = path.join(ROOT, "knowledge-base");
const ENRICHED_DIR = path.join(KB_DIR, "enriched");
const topicsPath = path.join(KB_DIR, "topics.json");

function readEnrichedOverride(category, slug) {
  const enrichedPath = path.join(ENRICHED_DIR, category, `${slug}.md`);
  if (fs.existsSync(enrichedPath)) {
    return fs.readFileSync(enrichedPath, "utf8");
  }
  return null;
}

function buildSearchText(topic, category, md, meta) {
  const situations = linesFromSection(extractSection(md, "Common situations (minimum 20)"), 8);
  const overview = extractSection(md, "Overview");
  const principles = linesFromSection(extractSection(md, "Healthy principles"), 5);
  const cultural = linesFromSection(extractSection(md, "Indian cultural considerations"), 3);
  return [
    topic,
    meta?.label || category,
    overview,
    principles.join(". "),
    situations.join(". "),
    cultural.join(". ")
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 4000);
}

function bulletList(items) {
  return items.map((i) => `- ${i}`).join("\n");
}

function numberedList(items) {
  return items.map((i, idx) => `${idx + 1}. ${i}`).join("\n");
}

function ageBlock(label, key, topic, category) {
  const lines = AGE_ADVICE[key](topic, category);
  return `### ${label}\n\n${bulletList(lines)}`;
}

function generateMarkdown(topic, category, allTopicsInCategory) {
  const meta = CATEGORY_META[category];
  const overview = buildOverview(topic, category, meta);
  const situations = buildSituations(topic, category, 22);
  const empathy = buildEmpathy(topic, 22);
  const advice = buildAdviceSnippets(topic, category, 22);
  const followUps = buildFollowUps(topic, 32);
  const related = pickRelated(topic, category, allTopicsInCategory, meta);

  return `# ${topic}

## Overview

${overview}

## Common situations (minimum 20)

${numberedList(situations)}

## Root causes

${bulletList(buildRootCauses(topic))}

## Emotions usually involved

${bulletList(buildEmotions())}

## Warning signs

${bulletList(buildWarningSigns(topic))}

## Healthy principles

${bulletList(buildHealthyPrinciples())}

## Practical first steps

${bulletList(buildFirstSteps(topic))}

## Long-term strategies

${bulletList(buildLongTerm(topic))}

## Things to avoid

${bulletList(buildAvoid())}

## Questions AI should ask before advising

${numberedList(buildAiQuestions(topic))}

## Indian cultural considerations

${numberedList(meta.cultural)}

## Different advice depending on age

${ageBlock("Teenager", "teenager", topic, category)}

${ageBlock("College student", "college", topic, category)}

${ageBlock("Working professional", "professional", topic, category)}

${ageBlock("Married", "married", topic, category)}

${ageBlock("Parent", "parent", topic, category)}

${ageBlock("Senior citizen", "senior", topic, category)}

## If children are involved

${childrenSection(topic, category)}

## If finances are involved

${financesSection(topic)}

## If mental health is involved

${mentalHealthSection(topic)}

## Common mistakes people make

${numberedList(buildMistakes(topic))}

## Recommended conversation style

${bulletList(buildConversationStyle())}

## Empathy statements

${numberedList(empathy)}

## Example advice snippets

${numberedList(advice)}

## Follow-up questions

${numberedList(followUps)}

## Related topics

${bulletList(related.map((t) => `[${t}](./${slugify(t)}.md)`))}
`;
}

function extractSection(md, heading) {
  const re = new RegExp(`## ${heading}\\s*\\n+([\\s\\S]*?)(?=\\n## |$)`, "i");
  const m = md.match(re);
  return m ? m[1].trim() : "";
}

function linesFromSection(section, max = 5) {
  return section
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").replace(/^-\s*/, "").trim())
    .filter(Boolean)
    .slice(0, max);
}

function main() {
  const topics = JSON.parse(fs.readFileSync(topicsPath, "utf8"));
  let count = 0;
  const index = [];
  const searchTopics = [];

  for (const [category, topicList] of Object.entries(topics)) {
    const dir = path.join(KB_DIR, category);
    fs.mkdirSync(dir, { recursive: true });
    const meta = CATEGORY_META[category];

    for (const topic of topicList) {
      const slug = slugify(topic);
      const enrichedMd = readEnrichedOverride(category, slug);
      const md = enrichedMd || generateMarkdown(topic, category, topicList);
      const filename = `${slug}.md`;
      const filepath = path.join(dir, filename);
      fs.writeFileSync(filepath, md, "utf8");
      index.push({ category, topic, file: `${category}/${filename}`, enriched: Boolean(enrichedMd) });

      const overviewRaw = extractSection(md, "Overview");
      const principles = linesFromSection(extractSection(md, "Healthy principles"), 5);
      const empathy = linesFromSection(extractSection(md, "Empathy statements"), 5);
      const advice = linesFromSection(extractSection(md, "Example advice snippets"), 5);
      const cultural = linesFromSection(extractSection(md, "Indian cultural considerations"), 3);
      const mentalHealthNote = extractSection(md, "If mental health is involved")
        .split("\n")[0]
        .slice(0, 200);

      const stopWords = new Set(["the", "and", "for", "with", "after", "about", "from", "your", "have", "this", "that", "are", "was", "were", "been", "being", "into", "over", "under", "a", "an", "of", "to", "in", "on", "at", "by", "or", "as", "is", "it", "be", "if", "we", "you", "they", "their", "our", "my", "me", "he", "she", "his", "her", "its", "not", "but", "can", "all", "any", "how", "when", "what", "who", "why", "which"]);
      const topicWords = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
      searchTopics.push({
        topic,
        slug,
        category,
        categoryLabel: meta?.label || category,
        file: `${category}/${filename}`,
        enriched: Boolean(enrichedMd),
        keywords: [
          ...topicWords,
          slug.replace(/-/g, " "),
          category.replace(/-/g, " ")
        ].filter((k) => k.length > 2 && !stopWords.has(k)),
        overview: overviewRaw.slice(0, 400),
        principles,
        empathy,
        advice,
        cultural,
        mentalHealthNote,
        searchText: buildSearchText(topic, category, md, meta)
      });
      count++;
    }
  }

  fs.writeFileSync(
    path.join(KB_DIR, "index.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), count, topics: index }, null, 2),
    "utf8"
  );

  fs.writeFileSync(
    path.join(KB_DIR, "search-index.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), topics: searchTopics }, null, 2),
    "utf8"
  );

  console.log(`Generated ${count} knowledge base files in ${KB_DIR}`);
  const enrichedCount = index.filter((t) => t.enriched).length;
  if (enrichedCount) {
    console.log(`Applied ${enrichedCount} hand-enriched topic overrides`);
  }
}

main();
