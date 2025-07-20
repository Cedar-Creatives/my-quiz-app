const assert = require('assert');
const { repairJson } = require('json-repair-js');

describe('JSON Repair', () => {
  it('should correctly repair malformed JSON from Gemini', () => {
    // Sample malformed JSON from Gemini logs
    const malformedJson = `[
      {
        "question": "What is the capital of France?",
        "options": [
          "Berlin",
          "Madrid",
          "Paris",
          "Rome"
        ],
        "correctAnswer": "Paris"
      },
      {
        "question": "Which planet is known as the Red Planet?",
        "options": [
          "Earth",
          "Mars",
          "Jupiter",
          "Venus"
        ],
        "correctAnswer": "Mars"
      }
    ]`;

    const repairedJson = repairJson(malformedJson);
    const parsedJson = JSON.parse(repairedJson);

    assert.strictEqual(Array.isArray(parsedJson), true, 'Should be an array');
    assert.strictEqual(parsedJson.length, 2, 'Should contain 2 questions');
    assert.strictEqual(parsedJson[0].question, 'What is the capital of France?', 'First question should match');
  });
});