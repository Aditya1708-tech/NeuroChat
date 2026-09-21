# NeuroChat — Viva Demonstration Plan & Defense Guide

> **Demonstration Target Duration**: 6 minutes 45 seconds  
> **Source**: Specification §39

---

## 1. Step-by-Step Viva Demonstration Script

| Time | Step | Action | What to Explain to Examiner |
|---|---|---|---|
| **0:00** | Landing Page | Scroll from Hero to Bento features and Trust section | *"Built as the practical realization of our Semester 3 field study of 80 participants, with transparent AI limitations."* |
| **0:30** | Registration | Enter name, email, demonstrate weak vs strong password | *"Real validation with strength guidance; passwords hashed via bcrypt on the server."* |
| **1:15** | Google Sign-In | Log out, click 'Continue with Google' | *"Uses Google Identity Services. The server cryptographically verifies Google's ID token and links verified emails."* |
| **1:45** | Dashboard | Display first-run onboarding card, dismiss it | *"Addresses our study's finding that new users need clear onboarding guidance."* |
| **2:05** | New Conversation | Send prompt: 'What is Java?' | *"The prompt is saved to MongoDB first; then the backend securely calls Gemini without exposing keys to the browser."* |
| **2:20** | AI Response | Highlight AI-generated badge, Markdown code block, Copy | *"Labelled AI-generated per responsible AI standards; safe sanitization prevents script injection."* |
| **2:35** | Follow-Up Context | Ask: 'What are its advantages?' | *"NeuroChat retains context across turns using a bounded sliding window algorithm."* |
| **3:05** | History | Point to generated sidebar title | *"Titles are generated deterministically from the first prompt without burning AI quota."* |
| **3:15** | Session Refresh | Press F5, reopen conversation | *"Full dialogue and turn order are persisted per user in MongoDB."* |
| **3:25** | Search | Type 'jav' in search input | *"Debounced search dynamically filters conversations scoped strictly to the authenticated user."* |
| **3:40** | Delete | Click trash icon, confirm in modal | *"Confirmation modal warns of permanent action, then cascades deletion across messages and conversation."* |
| **4:30** | MongoDB Compass | Switch to Compass, open `users` collection | *"Passwords are stored as salted bcrypt hashes ($2b$12$); Google users store verified googleId."* |
| **4:50** | Compass Data | Open `conversations` and `messages` | *"Demonstrates referencing design: one user owns many conversations; each conversation contains messages."* |
| **5:45** | Architecture | Show high-level system diagram | *"Strict layering: Routes -> Middleware -> Controllers -> Services -> Models. Browser never talks directly to Gemini."* |

---

## 2. Likely Examiner Questions & Direct Answers

### Q1: Is NeuroChat just another ChatGPT clone?
> **Answer**: No. NeuroChat is designed specifically around the empirical findings and documented limitations identified in our Semester 3 research study. It has its own unique visual identity, sliding window context architecture, transparent disclaimer banners, sensitive topic heuristics, and strict server-side secret boundaries.

### Q2: Why can't the frontend call the Gemini API directly?
> **Answer**: If the frontend called the Gemini API directly, the private API key would be visible in browser bundles or network traffic, leading to unauthorized quota theft. By routing all AI requests through our Express backend, the key remains completely protected in server environment variables.

### Q3: How do you prevent one user from reading another user's conversations?
> **Answer**: We enforce strict database authorization: every conversation and message query filters by the authenticated user's ID extracted from the verified session token (`req.user.id`). Attempting to access an ID belonging to someone else yields a `404 Not Found`, revealing no existence data.

### Q4: Why use an httpOnly cookie instead of localStorage for JWTs?
> **Answer**: JavaScript executing in the browser cannot access an `httpOnly` cookie. This completely eliminates the threat of Cross-Site Scripting (XSS) stealing the session token.

### Q5: How do you invalidate a stateless JWT before expiration?
> **Answer**: We employ a `tokenVersion` pattern. The user document tracks a version integer that is embedded in the JWT claims. When a user changes their password or logs out everywhere, the database increments `tokenVersion`, immediately invalidating all older tokens during middleware verification.

### Q6: What happens in very long conversations?
> **Answer**: NeuroChat applies a bounded sliding window algorithm capped at 20 messages and 24,000 characters. When earlier turns are trimmed, a notice informs the user that older context was pruned to preserve performance and cost boundaries.
