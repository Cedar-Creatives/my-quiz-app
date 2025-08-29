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

// Utility: detect 402 Payment Required from OpenRouter/OpenAI errors
const getHttpStatus = (err) => (err && (err.status || err.statusCode || (err.response && err.response.status))) || undefined;
const isPaymentRequiredError = (err) => {
  const status = getHttpStatus(err);
  const msg = (err && (err.message || (err.error && err.error.message))) || '';
  return status === 402 || /insufficient (credits|quota)|payment required/i.test(msg);
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
const getNextDifficulty = (current, score) => {
  const order = ['beginner', 'intermediate', 'advanced'];
  const idx = order.indexOf(current) === -1 ? 1 : order.indexOf(current);

  if (score >= 80) return order[Math.min(idx + 1, order.length - 1)];
  if (score <= 50) return order[Math.max(idx - 1, 0)];
  return order[idx];
};

app.post("/api/generate-quiz", async (req, res) => {
  const { topic, complexity, numQuestions = 10, score: lastScore } = req.body;
  const nextDifficulty = lastScore !== undefined ? getNextDifficulty(complexity, lastScore) : complexity;
  const questionCount = Math.min(Math.max(1, parseInt(numQuestions) || 10), 100);
  // Example type annotation improvement

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo"; // configurable model
  const tokenBudget = Math.min(1200, questionCount * 90); // keep responses concise and affordable
  const temperature = 0.2;

  let attempts = 0;
  const maxAttempts = 3;
  let success = false;
  let errorMsg;
  while (attempts < maxAttempts && !success) {
    attempts++;
    console.log(`Starting attempt ${attempts} for generating quiz on topic: ${topic} at difficulty ${nextDifficulty}`);
    try {
      const prompt = `Generate exactly ${questionCount} quiz questions about ${topic} at ${nextDifficulty} level for junior developers. Each question must have: "question" string, "options" array of 4 strings, "correctAnswer" string matching one option. Keep each question and option concise (<= 12 words). Output ONLY a valid JSON array of objects, no extra text, no markdown, no code fences. Ensure pure JSON starting with [ and ending with ]. Double-quote all strings and keys, no trailing commas.`;
  
      const result = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: tokenBudget,
        temperature,
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
        const repairPrompt = `The following is a malformed JSON array of quiz questions. Fix it to be a valid JSON array of ${questionCount} objects, each with "question" (string), "options" (array of 4 short strings), "correctAnswer" (string matching one option). Ensure proper escaping and valid JSON only. Malformed content: ${rawContent}`;
        const repairResult = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: repairPrompt }],
          max_tokens: tokenBudget,
          temperature,
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
      if (isPaymentRequiredError(error)) {
        return res.status(402).json({
          error: 'Insufficient credits',
          details: 'OpenRouter reports insufficient credits to fulfill this request. Try fewer questions or upgrade your plan.',
          code: 'INSUFFICIENT_CREDITS'
        });
      }
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

app.post('/api/explain-answer', async (req, res) => {
  const { question, selectedOption, correctOption } = req.body;

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo"; // configurable model
  const max_tokens = 300;
  const temperature = 0.3;

  try {
    let prompt;
    if (selectedOption === correctOption) {
      prompt = `For the question: "${question}", explain concisely (<= 80 words) why option "${correctOption}" is the correct answer.`;
    } else {
      prompt = `For the question: "${question}", explain concisely (<= 80 words) why option "${correctOption}" is correct and why option "${selectedOption}" is incorrect.`;
    }
    const result = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens,
      temperature,
    });
    const explanation = result.choices[0].message.content;
    res.json({ explanation });
  } catch (error) {
    console.error("OpenRouter error:", error);
    if (isPaymentRequiredError(error)) {
      return res.status(402).json({
        error: 'Insufficient credits',
        details: 'OpenRouter reports insufficient credits to fulfill this request. Try again later or upgrade your plan.',
        code: 'INSUFFICIENT_CREDITS'
      });
    }
    res.status(500).json({ error: "Failed to generate explanation", details: error?.message || String(error) });
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
