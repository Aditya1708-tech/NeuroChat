# NeuroChat — Requirements Traceability Matrix

> **Project**: NeuroChat (BCA Semester 5 Field Project)  
> **Source**: Specification Sections §8, §9, §40.

---

## 1. Functional Requirements (FR)

| ID | Requirement | Priority | Implementation Status | Verification Method |
|---|---|---|---|---|
| **FR-001** | Public landing page | Must | Done | Verified (7 sections render, CTAs functional) |
| **FR-002** | User registration | Must | Done | Verified (Zod validation, password strength meter) |
| **FR-003** | Duplicate email handling | Must | Done | Verified (409 EMAIL_IN_USE returned) |
| **FR-004** | Email/password login | Must | Done | Verified (bcrypt verify, generic error message) |
| **FR-005** | Google Sign-In | Must | Done | Verified (GIS ID token flow verified server-side) |
| **FR-006** | Safe account linking | Must | Done | Verified (Unverified password discarded on link) |
| **FR-007** | Logout | Must | Done | Verified (Cookie cleared, AuthContext reset) |
| **FR-008** | Session persistence | Must | Done | Verified (httpOnly cookie, 24h/30d lifetime) |
| **FR-009** | Protected routes | Must | Done | Verified (Route guards redirect unauthenticated) |
| **FR-010** | Create conversation | Must | Done | Verified (Lazy creation on first user prompt) |
| **FR-011** | Send message & AI reply | Must | Done | Verified (Gemini called backend-only, rendered) |
| **FR-012** | Multi-turn context | Must | Done | Verified (Sliding window retains previous turns) |
| **FR-013** | Conversation persistence | Must | Done | Verified (Mongoose storage survives re-login) |
| **FR-014** | List conversations | Must | Done | Verified (Sorted updatedAt desc, scoped to user) |
| **FR-015** | Open / continue chat | Must | Done | Verified (Route `/chat/:id` loads message history) |
| **FR-016** | Automatic title | Must | Done | Verified (Unicode-safe first message truncation) |
| **FR-017** | Rename conversation | Should | Done | Verified (PATCH endpoint and UI modal) |
| **FR-018** | Search conversations | Must | Done | Verified (Debounced 300ms title filtering) |
| **FR-019** | Delete conversation | Must | Done | Verified (Confirmation dialog, cascade delete) |
| **FR-020** | Safe Markdown rendering | Must | Done | Verified (react-markdown + sanitize, no raw HTML) |
| **FR-021** | Copy response | Must | Done | Verified (Copies raw markdown text with toast) |
| **FR-022** | Retry response | Must | Done | Verified (Regenerates reply without duping user prompt) |
| **FR-023** | Input behavior | Must | Done | Verified (Enter sends, Shift+Enter newline, 4k cap) |
| **FR-024** | Loading indicator & auto-scroll | Must | Done | Verified (Typing dots, smooth scroll to bottom) |
| **FR-025** | Timestamps | Should | Done | Verified (Locale-aware time and relative tooltips) |
| **FR-026** | Profile & settings | Should | Done | Verified (Settings page, name edit, language switch) |
| **FR-027** | First-run onboarding | Must | Done | Verified (3-card modal, dismissal stored in user doc) |
| **FR-028** | Language preference | Should | Done | Verified (English & Hindi UI translations) |
| **FR-029** | Voice input (MVP+) | Could | Done | Verified (Web Speech API SpeechRecognition) |
| **FR-030** | Voice output (MVP+) | Could | Done | Verified (Web Speech API SpeechSynthesis) |
| **FR-031** | Theme control | Could | Done | Verified (Light default, dark mode toggle) |
| **FR-032** | Not Found / Error pages | Must | Done | Verified (404 page & ErrorBoundary component) |

---

## 2. AI Requirements (AI)

| ID | Requirement | Priority | Implementation Status | Details |
|---|---|---|---|---|
| **AI-001** | Backend-only Gemini access | Must | Done | Verified: frontend bundle has 0 keys |
| **AI-002** | Bounded context strategy | Must | Done | Max 20 messages, 24k chars sliding window |
| **AI-003** | System instruction | Must | Done | Central instructions in `config/systemPrompt.js` |
| **AI-004** | "AI-generated" badge & disclaimer | Must | Done | Rendered on all assistant messages & under composer |
| **AI-005** | Sensitive topic nudge | Should | Done | Heuristic flags health/legal/finance prompts |
| **AI-006** | Friendly error mapping | Must | Done | Status codes mapped to friendly UI banners |
| **AI-007** | Timeout handling | Must | Done | 30s AbortController timeout protection |
| **AI-008** | Provider abstraction | Should | Done | Provider facade in `services/ai.service.js` |
| **AI-009** | Retrieval extension point | Could | Planned | Empty stub module in `services/retrieval` |
| **AI-010** | No false capability claims | Must | Done | Honest marketing and limitation banners |
| **AI-011** | Safety-block handling | Must | Done | 422 AI_BLOCKED mapped to neutral prompt retry |

---

## 3. Security Requirements (SEC)

| ID | Requirement | Status | Verification |
|---|---|---|---|
| **SEC-001** | Password hashing | Done | bcryptjs cost 12 with salt, `select: false` |
| **SEC-002** | Secure session token | Done | JWT in `httpOnly`, `SameSite=Lax`, `Secure` cookie |
| **SEC-003** | Authentication middleware | Done | `requireAuth` verifies token signature & tokenVersion |
| **SEC-004** | Ownership authorization | Done | All queries filter by `req.user.id`; 404 on mismatch |
| **SEC-005** | Server-side validation | Done | Zod schema validation on body, query, params |
| **SEC-006** | Secret management | Done | All secrets in `backend/.env`; `.gitignore` ignores `.env*` |
| **SEC-007** | CORS allow-list | Done | Strict origin matching against `CLIENT_URL` |
| **SEC-008** | Rate limiting | Done | 10/15m auth, 20/min messages, 120/min general |
| **SEC-009** | XSS-safe rendering | Done | `rehype-sanitize` strips raw HTML, scripts, images |
| **SEC-010** | Server-side Google token verification | Done | Google OAuth token checked against public certs |
| **SEC-011** | Security headers | Done | Helmet headers configured |
| **SEC-012** | CSRF defence | Done | SameSite cookies + Origin/Referer check on mutations |
| **SEC-013** | NoSQL-injection resistance | Done | Strict Zod typing rejects object operators |
| **SEC-014** | No secrets in frontend | Done | Scanned `frontend/dist`: 0 secrets present |
