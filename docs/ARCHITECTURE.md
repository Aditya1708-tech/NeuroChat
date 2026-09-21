# NeuroChat — System Architecture & Design

> **Project**: NeuroChat (BCA Semester 5 Field Project)  
> **Topic**: Full-Stack Architecture Documentation

---

## 1. High-Level Architecture Overview

NeuroChat follows a clean decoupled client-server architecture:

```
+-------------------------------------------------------------+
|                     Browser (Client)                        |
|   React SPA · Vite · React Router · Context API · Vanilla CSS|
+-------------------------------------------------------------+
               │                                      ▲
               │ HTTPS Requests (/api/*)              │ Google ID Token
               │ Cookies (nc_token, httpOnly)         │ (GIS Sign-In)
               ▼                                      │
+-------------------------------------------------------------+
|                 Backend REST API (Node.js/Express)          |
|                                                             |
|  [Middleware Pipeline]                                      |
|    RequestId -> Helmet -> CORS -> JSON (32kb) -> CookieParser|
|    -> OriginCheck -> Routes (RateLimiters, Validate, Auth)  |
|                                                             |
|  [Controllers]                                              |
|    auth, conversation, message, user                        |
|                                                             |
|  [Services]                                                 |
|    auth.service, google.service, conversation.service,       |
|    chat.service, context.service, title.service, ai.service  |
|                                                             |
|  [Data Access]                                              |
|    Mongoose Models: User, Conversation, Message             |
+-------------------------------------------------------------+
         │                      │                     │
         ▼                      ▼                     ▼
+------------------+  +-------------------+  +-------------------+
|  MongoDB Atlas   |  |  Google Gemini API|  | Google Identity   |
|  (3 Collections) |  |  (Server Key Only)|  | Public Certs      |
+------------------+  +-------------------+  +-------------------+
```

---

## 2. Layering and Component Responsibilities

The backend follows strict separation of concerns:
- **Routes (`routes/`)**: Map HTTP verbs and paths to middleware chains and controller handlers.
- **Middleware (`middleware/`)**: Global security, authentication (`requireAuth`), rate limiting, request validation (`validate`), and error formatting.
- **Controllers (`controllers/`)**: Thin HTTP coordinators. Read requests, invoke domain services, and return shaped JSON envelopes. Never call Mongoose or Gemini directly.
- **Services (`services/`)**: Encapsulate all business rules: password hashing, sliding context window, token generation, Gemini provider calls, and title truncation. Never access `req` or `res`.
- **Models (`models/`)**: Mongoose schemas enforcing database-level validation, compound indexing, and JSON sanitization.

---

## 3. Request Flow: Sending a Chat Message (AI-001, FR-011)

```
User types in Composer & clicks Send
  │
  ├─► Frontend shows optimistic user message bubble
  │
  ├─► POST /api/conversations/:id/messages (with session cookie)
  │     │
  │     ├─► authMiddleware verifies nc_token cookie & tokenVersion
  │     ├─► validate(sendMessageSchema) validates content (max 4,000 chars)
  │     ├─► messageController calls chatService.sendMessage()
  │     │     │
  │     │     ├─ 1. Verify conversation ownership (userId == req.user.id)
  │     │     ├─ 2. Auto-set conversation title if first message
  │     │     ├─ 3. Save user message to MongoDB (never lost on failure)
  │     │     ├─ 4. Fetch up to 40 recent messages
  │     │     ├─ 5. contextService builds sliding window (<=20 msgs, <=24k chars)
  │     │     ├─ 6. aiService invokes geminiProvider with 30s timeout
  │     │     ├─ 7. Run AI-005 sensitive topic heuristic
  │     │     ├─ 8. Save assistant reply to MongoDB
  │     │     └─ 9. Bump conversation updatedAt timestamp
  │     │
  │     └─► Returns 201 { userMessage, assistantMessage, conversation, meta }
  │
  └─► Frontend renders formatted Markdown reply with "AI-generated" badge
```

---

## 4. Key Architectural Decisions (D1–D12)

1. **D1 - React + Vite**: Standard, robust SPA framework without server-side rendering complexity.
2. **D2 - httpOnly Cookie Sessions**: Eliminates the risk of XSS token theft prevalent with localStorage.
3. **D3 - Same-Origin Proxy**: Vite dev server proxies `/api` to Express (`localhost:5000`), ensuring cookies are always first-party.
4. **D4 - Google Identity Services**: Real OpenID Connect ID-token flow. The client receives a signed token which the server verifies against Google public keys.
5. **D5 - Safe Account Linking**: Unverified local passwords are dropped upon Google linking to defeat account pre-hijacking threats.
6. **D6 - Sliding Window Context**: A deterministic 20-message / 24,000-character budget guarantees reliable model memory without unbound quota consumption.
7. **D7 - Deterministic Auto-Title**: First prompt text is sanitized and truncated (up to 60 characters) using Unicode-safe code point arrays, avoiding costly AI calls.
8. **D8 - Denormalized Message Ownership**: `userId` is stored on each message, allowing single-query ownership enforcement and high-performance search.
9. **D9 - XSS-Safe Markdown**: `react-markdown` with strict `rehype-sanitize` rules disables image tags and prevents script injection.
10. **D10 - Honest AI Boundaries**: NeuroChat never claims real-time internet search or 100% accuracy.
11. **D11 - Scoped Email Reset**: Email verification and password resets are kept as planned extensions to maintain high MVP focus.
12. **D12 - CSS Custom Properties**: All theming is driven by CSS variables in `styles/tokens.css`, enabling effortless light/dark customization.
