# NeuroChat — Master Specification (v1.0 Baseline)

> **Status**: Frozen baseline specification  
> **Source**: `features/NeuroChat_Master_Specification_v1.1_indigo-theme.pdf`  
> **Academic Project**: BCA Semester 5 Field Project  
> **Topic**: Practical implementation of a Semester 3 ChatGPT & Conversational AI study (80 participants).

---

## 1. Executive Summary

NeuroChat is a full-stack, web-based AI conversational assistant. Users register (email/password or Google), hold multi-turn conversations with an AI, and find those conversations saved, organized, and searchable whenever they return.

### What NeuroChat is:
- A React single-page application with a light, softly glowing, premium visual identity.
- A Node.js/Express REST API owning authentication, validation, data access, and AI calls.
- A MongoDB database storing users, conversations, and messages.
- An integration with the Google Gemini API (server-side only) for AI responses.

### What NeuroChat is not:
- Not a ChatGPT clone: it has its own branding, UI, and architecture.
- Not a new AI model: NeuroChat does not train or host a language model. The academic contribution is the design and development of the complete application and its supporting architecture.
- Not an always-correct system: it clearly says so in the interface.

---

## 2. Key Architecture Decisions

| # | Decision | Chosen | Why |
|---|---|---|---|
| **D1** | Frontend Language | React + JavaScript (Vite) | Fewer moving parts; standard modern build tooling |
| **D2** | Session Mechanism | JWT in an `httpOnly` cookie | Token unreachable by JavaScript; XSS cannot steal it |
| **D3** | Cross-Domain Cookies | Frontend proxies `/api` to backend | Avoids 3rd-party cookie blocking in Safari & Chrome |
| **D4** | Google Sign-In | Google Identity Services ID-token flow | Real OpenID Connect; no client secret exposed in browser |
| **D5** | Account Linking | Link only on Google-verified email; drop unverified password | Prevents account pre-hijacking |
| **D6** | Context Handling | Sliding window with budget (20 msgs / 24,000 chars) | Simple, explainable, bounded cost |
| **D7** | Conversation Title | First message, cleaned & Unicode truncated | Saves AI quota and latency |
| **D8** | Message Ownership | `userId` stored on each message | Single-query authorization & search |
| **D9** | Markdown Rendering | `react-markdown` + `rehype-sanitize` | Blocks XSS from model responses |
| **D10** | Real-Time Info | Explicitly not claimed | Honest boundaries; retrieval hook reserved |
| **D11** | Email Verification | Planned, not in MVP | Scoped out honestly |
| **D12** | Styling System | CSS tokens + variables | Central theming; fully explainable in viva |

---

## 3. Scope Boundary

- **MVP (Required for Submission)**:
  - Public Landing page with all 7 sections, Privacy & Terms pages, 404 page.
  - Registration, login, Google Sign-In, logout, session restore, rate limiting.
  - Multi-turn conversation with Gemini (backend only), sliding window context, safe Markdown, copy, retry/regenerate, AI-generated badge, disclaimer, sensitive-topic nudge.
  - Persistent conversations and messages, auto-titles, list/open/delete with confirmation, search by title.
  - Light-first design system with subtle glow, responsive mobile drawer, onboarding guide, English + Hindi interface.
  - MongoDB schemas and indexes, Zod validation, ownership checks, env-based secret isolation.
- **MVP+ (Stretch)**:
  - Voice dictation input & text-to-speech aloud.
  - Dark theme toggle.
  - Message-content full-text search.
