require("dotenv").config();
const OpenAI = require('openai');

(async () => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
    const model = "openai/gpt-3.5-turbo"; // Changed to a valid OpenRouter model
    const result = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: "Hello, world!" }],
    });
    console.log("API call successful:", result.choices[0].message.content);
  } catch (error) {
    console.error("API call failed:", error);
  }
})();
