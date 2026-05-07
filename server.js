import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

// ✅ Your OpenAI API key
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY;


// ✅ Simple memory
let conversationHistory = [];

// ✅ Crisis detection
const crisisWords = [
  "suicide",
  "kill myself",
  "end my life",
  "self harm",
  "want to die"
];

// ✅ Emotional mode instructions
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

app.post("/chat", async (req, res) => {

  try {

    const userMessage = req.body.message;

    // ✅ Receive selected mode
    const userMode = req.body.mode || "vent";

    // ✅ Crisis check
    const isCrisis = crisisWords.some(word =>
      userMessage.toLowerCase().includes(word)
    );

    if (isCrisis) {

      return res.json({
        reply:
          "I'm really glad you shared this with me. You do not have to go through this alone. Please consider reaching out to someone you trust or contact Kiran Helpline (India): 1800-599-0019."
      });

    }
});