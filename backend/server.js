import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("GEMINI API KEY loaded:", process.env.GEMINI_API_KEY ? "YES ✅" : "NO ❌");


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

// ─────────────────────────────────────────
// 🔹 Analyze Code API
// ─────────────────────────────────────────
app.post("/analyze", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.trim() === "") {
      return res.status(400).json({ error: "Code is required" });
    }

    const prompt = `
You are a strict DSA mentor reviewing student code.

Rules:
- Only report REAL errors (logic or syntax)
- Do NOT give full optimized code
- Give only HINTS for improvement, not full solution
- Be concise, use bullet points for everything
- Each bullet point should be short and clear

Respond in EXACTLY this format:

**Errors:**
• <error 1>
• <error 2>
(If no errors, write: • No major logical errors found)

**Time Complexity:**
• <Big-O notation> — <1 line explanation>

**Space Complexity:**
• <Big-O notation> — <1 line explanation>

**Hints to Optimize:**
• <hint 1>
• <hint 2>
(Give direction only, no code)

Code to review:
${code}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ analysis: text });

  } catch (error) {
    console.error("Gemini Error:", error.message);
    res.status(500).json({ analysis: "❌ Gemini API failed: " + error.message });
  }
});

// ─────────────────────────────────────────
// 🔹 Approach API
// ─────────────────────────────────────────
app.post("/approach", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "Question is required" });
    }

    const prompt = `
You are a DSA mentor helping a student understand how to approach a problem.

Rules:
- Do NOT give any code
- Use bullet points for everything
- Be concise and beginner-friendly

Respond in EXACTLY this format:

**Intuition:**
• <key insight 1>
• <key insight 2>

**Brute Force Approach:**
• <step 1>
• <step 2>

**How to Optimize:**
• <optimization idea 1>
• <optimization idea 2>

**Data Structures to Use:**
• <data structure> — <why it helps>

**Edge Cases to Handle:**
• <edge case 1>
• <edge case 2>

Problem:
${question}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ analysis: text });

  } catch (error) {
    console.error("Gemini Error:", error.message);
    console.error("Error status:", error.status);
    console.error("Error body:", error?.error);
    res.status(500).json({ analysis: "❌ Gemini API failed: " + error.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
