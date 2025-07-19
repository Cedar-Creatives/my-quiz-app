require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Placeholder endpoint for AI-powered quiz question generation
app.post("/api/generate-quiz", async (req, res) => {
  const { topic, complexity } = req.body;
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Generate 5 quiz questions about ${topic} at ${complexity} level with 4 multiple choice options each and mark the correct answer. Format as JSON.`,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const questions = JSON.parse(response.data.choices[0].text);
    res.json({ questions });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

// Placeholder endpoint for AI-powered explanation
app.post("/api/explain-answer", async (req, res) => {
  const { question, selectedOption, correctOption } = req.body;
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Explain why option ${correctOption} is correct and why option ${selectedOption} is incorrect for this question: ${question}`,
      temperature: 0.5,
      max_tokens: 500,
    });

    res.json({ explanation: response.data.choices[0].text });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to generate explanation" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
