const { GoogleGenAI } = require('@google/genai');

let ai = null;

// Initialize the Gemini client (lazy — created on first use)
const getClient = () => {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

/**
 * Generate an AI response using Gemini with conversation history.
 *
 * @param {Array} history - Previous messages: [{ role: 'user'|'model', content: '...' }]
 * @param {string} newMessage - The latest user message
 * @returns {string} - The AI response text
 */
const generateResponse = async (history, newMessage) => {
  const client = getClient();

  // Transform MongoDB message format to Gemini history format
  const geminiHistory = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  // Create a chat session with the conversation history
  const chat = client.chats.create({
    model: 'gemini-2.0-flash',
    history: geminiHistory
  });

  // Send the new message
  const response = await chat.sendMessage({ message: newMessage });

  // Extract and return the text response
  const text = response.text;

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
};

module.exports = { generateResponse };
