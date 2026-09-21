# NeuroChat — AI Integration & Context Architecture

> **Source**: Specification §17, §18, §19  
> **Model**: Google Gemini (`gemini-1.5-flash`)

---

## 1. Context Construction Algorithm (`context.service.js`)

Conversational AI models have finite context windows. To ensure predictable costs, fast response times, and deterministic memory, NeuroChat implements a bounded sliding window algorithm:

- **Constraints**:
  - `MAX_CONTEXT_MESSAGES = 20`
  - `MAX_CONTEXT_CHARS = 24,000`
  - Maximum user input = `4,000` characters

### Algorithm Steps:
1. `candidates = [...history, newUserMessage]` (all stored messages are valid turns).
2. Walk from **newest to oldest** message; accumulate into buffer while `count <= 20` and `totalChars <= 24,000`.
3. Stop at the first message that would breach either budget (ensuring dialog turns remain contiguous).
4. Reverse the selected buffer back into chronological order.
5. If the first message in the buffer is an assistant turn, drop it (conversations must begin with a user turn).
6. Merge consecutive messages sharing the same role (e.g., if a prior network drop left two consecutive user queries).
7. Map roles to Gemini API format (`user` -> `"user"`, `assistant` -> `"model"`).
8. If older messages were pruned, flag `contextTruncated = true` in response metadata to display an honest note in the UI.

---

## 2. Central System Prompt (`config/systemPrompt.js`)

All AI calls pass central system instructions via the Gemini SDK:
1. **Assistant Identity**: "You are NeuroChat, an intelligent, helpful, and transparent conversational AI assistant."
2. **Honesty & Uncertainty**: Admit uncertainty ("I am not sure") rather than hallucinating facts, statistics, or quotes.
3. **No Live Internet Access**: Explicitly state inability to browse the live web when asked about real-time events.
4. **Multilingual Responsiveness**: Reply fluently in the language of the prompt (English, Hindi, etc.).
5. **Clean Markdown**: Produce structured output with headings, bulleted lists, and copyable code blocks.

---

## 3. Error Code Mapping Matrix (§18.4)

| Upstream / Server Condition | HTTP Status | Error Code | Friendly UI Message | Retried Stored Data |
|---|---|---|---|---|
| Invalid server key / Google 401/403 | 502 | `AI_CONFIG_ERROR` | "NeuroChat's AI service isn't available right now. Please try again later." | User message preserved |
| Quota / Rate limit (429) | 429 | `AI_RATE_LIMITED` | "NeuroChat is busy right now. Wait a moment and retry." | User message preserved |
| Call timeout (>30s) | 504 | `AI_TIMEOUT` | "That took too long. Please retry." | User message preserved |
| Google 5xx / Network reset | 503 | `AI_UNAVAILABLE` | "The AI service is temporarily unavailable. Please retry." | User message preserved |
| Safety block | 422 | `AI_BLOCKED` | "I can't help with that request. Try asking differently." | User message preserved |
| Empty response | 502 | `AI_EMPTY_RESPONSE`| "I couldn't produce an answer. Try rephrasing or retry." | User message preserved |

> **Critical Rule**: The user's prompt is **always committed to MongoDB first** before initiating the AI call. Even if Gemini fails, the user's message is preserved and the UI displays an inline error with a **Retry** button.
