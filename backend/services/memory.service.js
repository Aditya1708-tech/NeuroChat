import crypto from 'crypto';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let memoryAI = null;

function getMemoryClient() {
  if (!memoryAI && env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('placeholder')) {
    memoryAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return memoryAI;
}

/**
 * Retrieves all saved memories for a user.
 */
export async function getUserMemories(userId) {
  const user = await User.findById(userId).select('memories settings');
  if (!user) return [];
  if (user.settings?.memoryEnabled === false) return [];
  return user.memories || [];
}

/**
 * Manually adds a memory fact.
 */
export async function addMemory(userId, text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.trim();
  if (!cleaned) return null;

  const memory = {
    id: 'mem_' + crypto.randomUUID().slice(0, 12),
    text: cleaned,
    createdAt: new Date(),
  };

  await User.updateOne(
    { _id: userId },
    { $push: { memories: memory } }
  );

  return memory;
}

/**
 * Deletes a memory item by ID.
 */
export async function deleteMemory(userId, memoryId) {
  await User.updateOne(
    { _id: userId },
    { $pull: { memories: { id: memoryId } } }
  );
  return true;
}

/**
 * Clears all memories for a user.
 */
export async function clearMemories(userId) {
  await User.updateOne(
    { _id: userId },
    { $set: { memories: [] } }
  );
  return true;
}

/**
 * Builds long-term memory and prior conversation index for the AI system prompt.
 */
export async function buildMemoryAndChatContext(userId, currentConversationId) {
  const user = await User.findById(userId).select('name email memories settings');
  if (!user) return { memoryContext: '', recentConversationsContext: '' };

  const memoryEnabled = user.settings?.memoryEnabled !== false;

  // 1. Long-term User Memory Profile
  let memoryContext = '';
  if (memoryEnabled) {
    const memoryItems = [];
    if (user.name) {
      memoryItems.push(`User's preferred name is ${user.name}.`);
    }
    for (const m of user.memories || []) {
      if (m.text) memoryItems.push(m.text);
    }
    if (memoryItems.length > 0) {
      memoryContext = memoryItems.map((item) => `- ${item}`).join('\n');
    }
  }

  // 2. Cross-Conversation Topic Directory (Recent chats)
  let recentConversationsContext = '';
  try {
    const query = { userId };
    if (currentConversationId) {
      query._id = { $ne: currentConversationId };
    }

    const pastConvs = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title createdAt updatedAt')
      .lean();

    if (pastConvs && pastConvs.length > 0) {
      recentConversationsContext = pastConvs
        .filter((c) => c.title && c.title !== 'New chat')
        .map((c, idx) => `${idx + 1}. "${c.title}" (Date: ${new Date(c.createdAt).toLocaleDateString()})`)
        .join('\n');
    }
  } catch (err) {
    logger.warn('Failed to load past conversation directory', { error: err.message });
  }

  return { memoryContext, recentConversationsContext };
}

/**
 * Background worker to automatically extract enduring user facts or handle explicit "remember that..." commands.
 */
export async function extractAndSaveMemories(userId, conversationId, userText) {
  if (!userText || typeof userText !== 'string') return false;

  const user = await User.findById(userId).select('memories settings');
  if (!user || user.settings?.memoryEnabled === false) return false;

  const client = getMemoryClient();
  if (!client) return false;

  // Quick heuristic check: only invoke AI extraction if the message might contain personal context
  const textLower = userText.toLowerCase();
  const personalKeywords = [
    'remember', 'i am', "i'm", 'my name', 'my goal', 'my exam', 'i study', 'i work',
    'i prefer', 'i like', 'favorite', 'i live', 'semester', 'degree', 'preparing', 'learning',
    'recall', 'forget', 'syllabus', 'college', 'project'
  ];

  const mightHaveMemory = personalKeywords.some((kw) => textLower.includes(kw));
  if (!mightHaveMemory) return false;

  // Handle explicit forget command
  if (textLower.includes('forget that') || textLower.includes('remove memory') || textLower.includes('delete memory')) {
    const topicToForget = textLower
      .replace(/^(please\s+)?(forget that|remove memory about|delete memory about)\s+/i, '')
      .trim();

    if (topicToForget.length > 2) {
      const remaining = (user.memories || []).filter(
        (m) => !m.text.toLowerCase().includes(topicToForget)
      );
      if (remaining.length !== (user.memories || []).length) {
        user.memories = remaining;
        await user.save();
        return true;
      }
    }
  }

  // Use Gemini to extract key user facts
  try {
    const model = client.getGenerativeModel(
      { model: env.GEMINI_MODEL || 'gemini-3.5-flash-lite' },
      { timeout: 7000 }
    );

    const existingMemoriesStr = (user.memories || []).map((m) => m.text).join('; ');

    const prompt = `You are the memory manager for an AI assistant like ChatGPT.
Analyze this user message to see if the user shared an enduring personal fact, background detail, preference, current study/work goal, or explicit "remember that..." instruction.

Existing known memories: [${existingMemoriesStr}]
User message: "${userText.slice(0, 500)}"

Instructions:
1. If the user states a new enduring fact about themselves (e.g. "User is in 5th semester studying CS", "User prefers Java over Python", "User is preparing for Company Secretary"), formulate it as ONE clear, concise third-person statement.
2. If the information is trivial, a fleeting question, already known in existing memories, or has no enduring personal fact, return "NONE".
3. Return ONLY the extracted statement or "NONE". Do not include quotes or conversational filler.`;

    const res = await model.generateContent(prompt);
    let extracted = (await res.response.text()) || '';
    extracted = extracted.replace(/["'*`#\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();

    if (!extracted || extracted.toUpperCase() === 'NONE' || extracted.length < 5 || extracted.length > 200) {
      return false;
    }

    // Check if duplicate of existing memory
    const isDuplicate = (user.memories || []).some(
      (m) => m.text.toLowerCase() === extracted.toLowerCase() || m.text.toLowerCase().includes(extracted.toLowerCase())
    );

    if (isDuplicate) return false;

    // Save new memory
    const newMem = {
      id: 'mem_' + crypto.randomUUID().slice(0, 12),
      text: extracted,
      createdAt: new Date(),
    };

    user.memories.push(newMem);
    // Limit to 50 memories max
    if (user.memories.length > 50) {
      user.memories.shift();
    }

    await user.save();
    logger.info('Saved new user memory', { userId, memory: extracted });
    return true;
  } catch (err) {
    logger.warn('Memory extraction skipped or failed', { error: err.message });
    return false;
  }
}
