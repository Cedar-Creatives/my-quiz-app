require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { jsonrepair } = require('jsonrepair');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Placeholder endpoint for AI-powered quiz question generation
app.post("/api/generate-quiz", async (req, res) => {
  const { topic, complexity } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  let attempts = 0;
  const maxAttempts = 3;
  let success = false;
  let errorMsg;
  while (attempts < maxAttempts && !success) {
    attempts++;
    console.log(`Starting attempt ${attempts} for generating quiz on topic: ${topic}`);
    try {
      const prompt = `Generate exactly 10 quiz questions about ${topic} at ${complexity} level for junior developers. Each question must have: "question" string, "options" array of 4 strings, "correctAnswer" string matching one option. Output ONLY as a valid JSON array of objects, no extra text. Do not include any markdown or code blocks. Ensure the output is a pure JSON array starting with [ and ending with ]. Make sure all strings are double-quoted, all keys have colons, no trailing commas, and the structure is strictly an array of objects with the specified keys. If there are any double quotes inside string values, escape them with a backslash (\"). For example, a question like 'What is "Git"?' should be formatted as "What is \"Git\"?". Ensure colons inside strings are properly enclosed in double quotes without acting as key-value separators.`;
      const result = await model.generateContent(prompt);
      const rawContent = result.response.text();
      console.log(`Attempt ${attempts} - Raw Gemini Response:`, rawContent);

      // Robust parsing
      let jsonString = rawContent.trim();
      jsonString = jsonString.replace(/```json|[`]{3}/g, '').trim(); // Remove code blocks
      const jsonStart = jsonString.search(/\[\s*\{/);
      const jsonEnd = jsonString.lastIndexOf('}]') + 1;
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        jsonString = jsonString.slice(jsonStart, jsonEnd);
      }
      // Fix common issues
      jsonString = jsonString
        .replace(/([,{])(\s*)([}\]])/g, '$1$3') // Missing commas
        .replace(/\b(\w+)\s*:/g, '"$1":') // Unquoted keys
        .replace(/'(.*?)'/g, '"$1"') // Single to double quotes
        .replace(/,(\s*[}\]])/g, '$1') // Trailing commas
        .replace(/("\w+")\s*([^:,}\]])/g, '$1:$2') // Insert missing colons after keys
        .replace(/"([^"]*?)"\s*:\s*"([^"]*?)([^\\])"([^"]*?)"/g, '"$1":"$2$3\\"$4"') // Fix unescaped quotes in values
        .replace(/"([^"]*?)"\s*([^:,}\]\s])/g, '"$1","$2'); // Fix missing commas between key-value pairs
      console.log(`Attempt ${attempts} - JSON String before repair:`, jsonString);

      // Repair any remaining issues
      jsonString = jsonrepair(jsonString);
      console.log(`Attempt ${attempts} - Repaired JSON:`, jsonString);

      let questions;
      try {
        questions = JSON.parse(jsonString);
      } catch (parseError) {
        console.log(`Attempt ${attempts} - JSON.parse failed, attempting Gemini repair.`);
        const repairPrompt = `The following is a malformed JSON array of quiz questions. Fix it to be a valid JSON array of 10 objects, each with "question" (string), "options" (array of 4 strings), "correctAnswer" (string matching one option). Ensure proper escaping of inner quotes and no syntax errors. Malformed content: ${rawContent}`;
        const repairResult = await model.generateContent(repairPrompt);
        const repairedContent = repairResult.response.text().trim().replace(/```json|[`]{3}/g, '').trim();
        jsonString = jsonrepair(repairedContent); // Repair again if needed
        questions = JSON.parse(jsonString);
      }
      if (!Array.isArray(questions) || questions.length !== 10 || !questions.every(q => q.question && Array.isArray(q.options) && q.options.length === 4 && q.correctAnswer)) {
        throw new Error('Invalid quiz format');
      }
      console.log(`Attempt ${attempts} - Successfully parsed ${questions.length} questions.`);
      res.json({ questions });
      success = true;
    } catch (error) {
      console.error(`Attempt ${attempts} failed for topic ${topic}:`, error);
      errorMsg = error.message;
    }
  }
  if (!success) {
    res.status(500).json({ error: "Failed to generate quiz after " + maxAttempts + " attempts", details: errorMsg });
  }
});
// Remove old OpenAI endpoints if not needed
app.post("/api/explain-answer", async (req, res) => {
  const { question, selectedOption, correctOption } = req.body;
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        { role: "user", content: `Explain why option ${correctOption} is correct and why option ${selectedOption} is incorrect for this question: ${question}` }
      ],
      temperature: 0.5,
      max_tokens: 500
    });

    const rawContent = response.choices[0].message.content;
    const jsonString = rawContent.replace(/```json|```/g, '').trim();
    res.json({ explanation: jsonString });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to generate explanation" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
