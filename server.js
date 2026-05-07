import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// ✅ OpenAI key from .env
const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY;

// ✅ Simple memory
let conversationHistory = [];

// ✅ Crisis words
const crisisWords = [
  "suicide",
  "kill myself",
  "end my life",
  "self harm",
  "want to die"
];

// ✅ Emotional modes
const modeInstructions = {

  vent:
    "Mostly listen carefully and validate emotions. Do not rush to advice.",

  reflect:
    "Ask thoughtful reflective questions that help the user understand themselves.",

  calm:
    "Speak gently, slowly and help reduce anxiety and overwhelm.",

  clarity:
    "Help the user think clearly and logically without sounding cold."

};

// ✅ Chat endpoint
app.post("/chat", async (req, res) => {

  try {

    const userMessage = req.body.message;

    const userMode =
      req.body.mode || "vent";

    // ✅ Crisis check
    const isCrisis =
      crisisWords.some(word =>
        userMessage
          .toLowerCase()
          .includes(word)
      );

    if (isCrisis) {

      return res.json({
        reply:
          "I'm really glad you shared this with me. Please consider reaching out to someone you trust or contact Kiran Helpline (India): 1800-599-0019."
      });

    }

    // ✅ Save user message
    conversationHistory.push({
      role: "user",
      content: userMessage
    });

    // ✅ Keep only last 10 messages
    conversationHistory =
      conversationHistory.slice(-10);

    // ✅ Emotional prompt
    const messages = [

      {
        role: "system",

        content: `
You are Saathi.

You are an emotionally intelligent emotional-support companion for Indian users.

You are warm, calm, emotionally mature and thoughtful.

You are NOT a therapist.

Your role:
- help users feel heard
- ask emotionally insightful questions
- avoid robotic language
- avoid lectures
- avoid clichés
- respond naturally

IMPORTANT:
- never shame
- never judge
- avoid sounding corporate
- avoid long answers
- speak naturally like a wise trusted friend

When users are emotional:
- slow down
- acknowledge feelings first
- then gently explore

Avoid:
- fake positivity
- motivational speeches
- over-explaining

Current emotional mode:
${modeInstructions[userMode]}
`
      },

      ...conversationHistory

    ];

    // ✅ OpenAI request
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${OPENAI_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.9
        })
      }
    );

    const data =
      await response.json();

    console.log(
      "OPENAI RESPONSE:",
      data
    );

    let reply =
      "Sorry, I couldn't respond.";

    // ✅ Safe response handling
    if (
      data.choices &&
      data.choices.length > 0
    ) {

      reply =
        data.choices[0]
          .message.content;

    } else if (data.error) {

      reply =
        "OpenAI Error: " +
        data.error.message;

    }

    // ✅ Save AI response
    conversationHistory.push({
      role: "assistant",
      content: reply
    });

    // ✅ Send to frontend
    res.json({ reply });

  } catch (error) {

    console.error(
      "SERVER ERROR:",
      error
    );

    res.status(500).json({
      reply: "Server crashed"
    });

  }

});

// ✅ Root route
app.get("/", (req, res) => {

  res.send("Saathi backend is running");

});

// ✅ Start server
app.listen(3000, () => {

  console.log(
    "Server running on port 3000"
  );

});