require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { jsonrepair } = require('jsonrepair');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/yourusername/my-quiz-app",
    "X-Title": "My Quiz App"
  }
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Add input sanitization
const sanitizeInput = (input) => {
  return input.replace(/[<>"]/g, '');
};

// Placeholder endpoint for AI-powered quiz question generation
/**
 * @swagger
 * /api/generate-quiz:
 *   post:
 *     summary: Generates a quiz based on topic and complexity.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *                 description: The topic for the quiz.
 *               complexity:
 *                 type: string
 *                 description: The complexity level of the quiz (e.g., 'beginner', 'intermediate', 'advanced').
 *               numQuestions:
 *                 type: integer
 *                 description: Number of questions to generate (1-100).
 *     responses:
 *       200:
 *         description: Successfully generated quiz questions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       question:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                       correctAnswer:
 *                         type: string
 *       500:
 *         description: Failed to generate quiz.
 */
app.post("/api/generate-quiz", async (req, res) => {
  const { topic, complexity, numQuestions = 10 } = req.body;
  const questionCount = Math.min(Math.max(1, parseInt(numQuestions) || 10), 100);
  // Example type annotation improvement

  const model = "openai/gpt-3.5-turbo"; // Changed to a valid OpenRouter model

  let attempts = 0;
  const maxAttempts = 3;
  let success = false;
  let errorMsg;
  while (attempts < maxAttempts && !success) {
    attempts++;
    console.log(`Starting attempt ${attempts} for generating quiz on topic: ${topic}`);
    try {
      const prompt = `Generate exactly ${questionCount} quiz questions about ${topic} at ${complexity} level for junior developers. Each question must have: "question" string, "options" array of 4 strings, "correctAnswer" string matching one option. Output ONLY as a valid JSON array of objects, no extra text. Do not include any markdown or code blocks. Ensure the output is a pure JSON array starting with [ and ending with ]. Make sure all strings are double-quoted, all keys have colons, no trailing commas, and the structure is strictly an array of objects with the specified keys. Ensure colons inside strings are properly enclosed in double quotes without acting as key-value separators.`;
  
    const result = await openai.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
      });
      const rawContent = result.choices[0].message.content;
      console.log(`Attempt ${attempts} - Raw OpenRouter Response:`, rawContent);

      // Robust parsing
      let jsonString = rawContent.trim();
      jsonString = jsonString.replace(/```json|[`]{3}/g, '').trim(); // Remove code blocks
      const jsonStart = jsonString.search(/\[\s*\{/);
      const jsonEnd = jsonString.lastIndexOf('}]') + 1;
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        jsonString = jsonString.slice(jsonStart, jsonEnd);
      }
      // Fix common issues

      console.log(`Attempt ${attempts} - JSON String before repair:`, jsonString);

      // Repair any remaining issues
      jsonString = jsonrepair(jsonString);
      console.log(`Attempt ${attempts} - Repaired JSON:`, jsonString);

      let questions;
      try {
        questions = JSON.parse(jsonString);
      } catch (parseError) {
        console.log(`Attempt ${attempts} - JSON.parse failed, attempting OpenRouter repair.`);
        const repairPrompt = `The following is a malformed JSON array of quiz questions. Fix it to be a valid JSON array of 10 objects, each with "question" (string), "options" (array of 4 strings), "correctAnswer" (string matching one option). Ensure proper escaping of inner quotes and no syntax errors. Malformed content: ${rawContent}`;
        const repairResult = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: repairPrompt }],
        });
        const repairedContent = repairResult.choices[0].message.content.trim().replace(/```json|[`]{3}/g, '').trim();
        jsonString = jsonrepair(repairedContent); // Repair again if needed
        questions = JSON.parse(jsonString);
      }
      if (!Array.isArray(questions) || questions.length !== questionCount || !questions.every(q => q.question && Array.isArray(q.options) && q.options.length === 4 && q.correctAnswer)) {
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
/**
 * @swagger
 * /api/explain-answer:
 *   post:
 *     summary: Provides an explanation for a given quiz answer.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 description: The quiz question.
 *               selectedOption:
 *                 type: string
 *                 description: The option selected by the user.
 *               correctOption:
 *                 type: string
 *                 description: The correct option for the question.
 *     responses:
 *       200:
 *         description: Successfully generated explanation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 explanation:
 *                   type: string
 *       500:
 *         description: Failed to generate explanation.
 */
/**
 * Starts the Express server and listens for incoming requests.
 * @param {number} PORT - The port number to listen on.
 * @param {function} callback - Callback function to execute once the server starts.
 */
const findAvailablePort = async (basePort = 5000) => {
  const net = require('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(findAvailablePort(basePort + 1)));
    server.listen({ port: basePort }, () => {
      server.close(() => resolve(basePort));
    });
  });
};


app.post('/api/explain-answer', async (req, res) => {
  const { question, selectedOption, correctOption } = req.body;

  const model = "openai/gpt-3.5-turbo"; // Changed to a valid OpenRouter model

  try {
    let prompt;
    if (selectedOption === correctOption) {
      prompt = `For the question: "${question}", explain concisely why option "${correctOption}" is the correct answer. Focus only on the explanation of correctness.`;
    } else {
      prompt = `For the question: "${question}", explain concisely why option "${correctOption}" is the correct answer and why option "${selectedOption}" is incorrect. Focus only on the explanation of correctness and incorrectness.`;
    }
    const result = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });
    const explanation = result.choices[0].message.content;
    res.json({ explanation });
  } catch (error) {
    console.error("OpenRouter error:", error);
    res.status(500).json({ error: "Failed to generate explanation" });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Backend is healthy');
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  process.on('SIGTERM', () => {
    server.close(() => console.log('Server terminated'));
  });
});
