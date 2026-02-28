/**
 * OpenAI client. Exposes a configured client when API key is present.
 */
const OpenAI = require('openai');

const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

function isAvailable() {
  return client !== null;
}

module.exports = {
  client,
  isAvailable,
};
