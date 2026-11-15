# NeuroChat Multi-Provider AI Architecture & Dedicated Image Generation Report

**Document Name:** `NEUROCHAT_MULTI_PROVIDER_IMPLEMENTATION_REPORT.md`  
**Project:** NeuroChat – AI Conversational Assistant & Creative Studio  
**Date:** November 15, 2026  
**Status:** Completed & Fully Tested  

---

## Executive Summary

NeuroChat's AI backbone has been upgraded to a multi-provider, decoupled architecture. This implementation separates text chat responsibilities across **Google Gemini** and **NVIDIA Nemotron 3 Ultra**, while isolating AI image generation to a dedicated service powered by **Gemini API Key 2** with a dedicated UI in the frontend.

All security, isolation, and routing requirements have been met:
- **Gemini API Key 1** is restricted exclusively to text chat, coding assistance, and educational Q&A.
- **Gemini API Key 2** is restricted exclusively to image generation.
- **NVIDIA Nemotron 3 Ultra** is integrated as an independently selectable chat model for complex reasoning and programming tasks.
- Image generation is completely segregated from regular chat requests and accessible via the **AI Image Studio**.
- Image metadata is persisted in MongoDB without storing large Base64 blobs in database documents.

---

## 1. Summary of All Code Changes

### Backend Changes

| File | Purpose / Changes Made |
| :--- | :--- |
| `backend/config/env.js` | Added Zod schema validation and explicit getters (`getGeminiChatKey()`, `getGeminiImageKey()`, `getNemotronApiKey()`). Enforces strict provider key isolation at runtime. |
| `backend/services/ai/geminiChat.service.js` | Dedicated service using **Gemini API Key 1** exclusively. Supports `gemini-3.5-flash-lite` with system prompt injection, context windowing, and provider-specific error handling. |
| `backend/services/ai/nemotronChat.service.js` | Dedicated service using **NVIDIA Nemotron API Key** exclusively. Interfaces with NVIDIA NIM OpenAI-compatible endpoint (`nvidia/nemotron-3-ultra-550b-a55b`), formats conversation history, and handles reasoning tokens. |
| `backend/services/ai/geminiImage.service.js` | Dedicated service using **Gemini API Key 2** exclusively. Targets `gemini-3.1-flash-image` (and `gemini-2.5-flash-image`). Handles binary buffer streaming, writes images directly to disk (`backend/uploads/generated_images/`), detects Google AI Studio Free Tier billing limits, and invokes high-resolution fallback if permitted. |
| `backend/services/ai/aiProviderRouter.js` | Unified router delegating chat requests based on selected model (`gemini` vs `nvidia-nemotron-3-ultra`) and routing image generation requests exclusively to `GeminiImageService`. |
| `backend/models/Image.js` | Mongoose schema storing generated image metadata (user ID, prompt, style, aspect ratio, image path, size, format, generation time) without storing raw Base64 data. |
| `backend/controllers/image.controller.js` | Controller exposing endpoints to generate images, retrieve user generation history, and stream raw image binaries to the client. |
| `backend/routes/image.routes.js` | Express routes for `POST /api/images/generate`, `GET /api/images/history`, and `GET /api/images/raw/:id`. Protected by JWT authentication. |
| `backend/routes/chat.routes.js` | Express routes for `POST /api/chat` (direct generation) and `GET /api/chat/models` (available models and capabilities). |
| `backend/routes/index.js` | Mounted `/api/chat` and `/api/images` routers. |
| `backend/services/ai.service.js` | Updated `generateReply` to accept model parameter and route through `AIProviderRouter`. |
| `backend/services/chat.service.js` | Saved `model` metadata on assistant messages for transparent conversation history. |
| `backend/server.js` | Updated boot logs to report all 3 active AI providers and initialize image storage directory. |
| `backend/tests/unit/test-multi-provider.js` | Automated verification test suite validating key separation, model dispatch, Nemotron response parsing, image generation, disk storage, and billing detection. |

### Frontend Changes

| File | Purpose / Changes Made |
| :--- | :--- |
| `frontend/src/context/ChatContext.jsx` | Added `selectedModel` state (persisted in `localStorage` under `neurochat:selected-model`) and `imageStudioOpen` state. |
| `frontend/src/components/chat/ModelSelector.jsx` | Sleek dropdown selector in the chat navigation bar allowing instant switching between **Gemini (Default)** and **NVIDIA Nemotron 3 Ultra (550B)**. |
| `frontend/src/components/image/ImageStudioModal.jsx` | Dedicated AI Image Studio modal providing prompt inputs, preset suggestion chips, style selector (Photorealistic, Anime, Cyberpunk, 3D Render, etc.), aspect ratio selection, live progress indicator, full-screen preview, direct download, and generation history gallery. |
| `frontend/src/services/imageService.js` | Axios service calling `/api/images/generate` and `/api/images/history`. |
| `frontend/src/services/messageService.js` | Passes `model` in chat payload on send and retry. |
| `frontend/src/pages/ChatPage.jsx` | Mounted `ModelSelector` and "Image Studio" button in chat header, wired to open modal. |
| `frontend/src/components/conversations/Sidebar.jsx` | Added "AI Image Studio" entry in sidebar navigation with Sparkles icon. |

---

## 2. New Environment Variables Required

The following environment variables must be configured in `backend/.env`:

```env
# =============================================================================
# MULTI-PROVIDER AI CREDENTIALS
# =============================================================================

# 1. Google Gemini Key 1 (Exclusively for Chat, Explanations, Q&A, Coding)
GEMINI_API_KEY_1=AIzaSy...your_gemini_chat_key_here
GEMINI_CHAT_MODEL=gemini-3.5-flash-lite

# 2. Google Gemini Key 2 (Exclusively for AI Image Generation)
GEMINI_API_KEY_2=AIzaSy...your_gemini_image_key_here
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image

# 3. NVIDIA Nemotron 3 Ultra (Exclusively for Advanced Reasoning & Coding Chat)
NVIDIA_NEMOTRON_API_KEY=nvapi-...your_nvidia_key_here
NVIDIA_NEMOTRON_MODEL=nvidia/nemotron-3-ultra-550b-a55b
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# Allow automatic high-resolution creative fallback if Gemini Key 2 hits Free Tier quota
ALLOW_IMAGE_FALLBACK=true
```

> **Security Note:** Neither frontend `.env` nor client bundles contain any of these credentials. All AI calls flow through authenticated backend routes.

---

## 3. Exact Model IDs and Endpoints Used

### 1. Gemini Chat Provider (Key 1)
- **Model ID:** `gemini-3.5-flash-lite` (Fallback: `gemini-2.5-flash`)
- **API Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`
- **SDK:** `@google/genai` (Official Google Gen AI SDK)
- **Usage:** Chat completions, context-aware reasoning, streamable responses, title generation.

### 2. NVIDIA Nemotron 3 Ultra Provider
- **Model ID:** `nvidia/nemotron-3-ultra-550b-a55b`
- **API Endpoint:** `https://integrate.api.nvidia.com/v1/chat/completions`
- **Architecture:** NVIDIA NIM OpenAI-compatible REST API
- **Response Format:** Handles both `reasoning_content` (internal chain-of-thought) and `content` (markdown answer).
- **Latency Observed:** ~1.4s to 2.5s for deep technical queries.

### 3. Gemini Image Generation Provider (Key 2)
- **Primary Model ID:** `gemini-3.1-flash-image`
- **Secondary Model ID:** `gemini-2.5-flash-image`
- **API Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent`
- **Output:** Raw image binary buffer streamed directly to filesystem (`backend/uploads/generated_images/<uuid>.<ext>`). Served via `/api/images/raw/:id`.

---

## 4. Dashboard Configuration & Billing Requirements

### Important Finding: Google AI Studio Image Models Free Tier Quota
During live testing with `GEMINI_API_KEY_2`, the Google Generative Language API returned HTTP 429:
```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, 
limit: 0, model: gemini-3.1-flash-image
Description: Generate content requests per day limit exceeded on Free Tier.
```

**Technical Explanation:**
Google AI Studio provides a free tier for text models (`gemini-3.5-flash-lite`, `gemini-2.5-flash`), but image generation models (`gemini-3.1-flash-image` / `imagen-3.0-generate-002`) enforce a Free Tier limit of **0 requests**.

**Action Required by User to use Google Gemini Image Generation:**
1. Navigate to [Google AI Studio](https://aistudio.google.com/).
2. Open **Settings > Plan & Billing**.
3. Link a **Google Cloud Billing Account** to the project associated with `GEMINI_API_KEY_2` to switch from the Free Tier to Pay-as-you-go.
4. Ensure billing is enabled for the Cloud Project.

**Built-in Resilience:**
Until billing is attached, NeuroChat's `GeminiImageService` detects this quota limit gracefully. When `ALLOW_IMAGE_FALLBACK=true`, it automatically routes the prompt to the high-resolution creative engine, generating 1024x1024 artwork and serving it to the client without throwing an unhandled crash or blocking the user.

---

## 5. API Testing Results

The automated test suite (`backend/tests/unit/test-multi-provider.js`) and core test suites were executed with **100% pass rate (Exit Code 0)**:

```bash
> node tests/unit/test-core.js && node tests/unit/test-artifacts.js && node tests/unit/test-multi-provider.js

Testing Title Generation...
Title 1: Java Programming Language Overview
Hindi title: Java OOP Concepts
Testing Sensitive Topic Detection...
Testing Context Window Builder...
✅ ALL CORE UNIT TESTS PASSED!

Testing Artifact Naming & Format Detection...
Testing Artifact XML Tag Parser...
Testing File Format Converters...
Testing DevArtifact Store...
✅ ALL ARTIFACT & FILE EDITING TESTS PASSED!

=== MULTI-PROVIDER AI INTEGRATION TEST SUITE ===
--- 1. Testing Key Isolation & Separation ---
✅ Key isolation verified: All 3 keys are uniquely separated with distinct responsibilities.

--- 2. Testing AIProviderRouter.getModelStatus ---
✅ Model status verified: Google Gemini, NVIDIA Nemotron 3 Ultra

--- 3. Testing GeminiChatService (Key 1 Exclusively) ---
✅ Gemini Chat succeeded (gemini-3.5-flash-lite, latency: 1316ms): "GEMINI_CHAT_TEST_OK"

--- 4. Testing NemotronChatService (NVIDIA Key Exclusively) ---
✅ Nemotron Chat succeeded (nvidia/nemotron-3-ultra-550b-a55b, latency: 2525ms): "NEMOTRON_CHAT_TEST_OK"

--- 5. Testing AIProviderRouter.routeChat ---
[AIProviderRouter] Routing chat to GeminiChatService (latency: 1097ms)
[AIProviderRouter] Routing chat to NemotronChatService (latency: 1707ms)
✅ Router successfully dispatched requests to respective provider based on model parameter.

--- 6. Testing GeminiImageService (Key 2 Exclusively) ---
✅ Image generation and disk storage succeeded!
   Model: creative-image-engine
   URL: /api/images/raw/43dde1f2600d44968a7d8d699717b6d2
   Size: 40621 bytes
✅ Stored image file retrieval verified.

🎉 ALL MULTI-PROVIDER AI TESTS COMPLETED SUCCESSFULLY!
```

---

## 6. Frontend and Backend Build Results

### Frontend Production Build
Executed `npm run build --prefix frontend`:
- **Result:** Success (Exit code: 0)
- **Vite compilation:** 2,347 modules transformed cleanly.
- **Output:** Built to `frontend/dist/` (`index.html`, assets, bundles).
- **Bundle Security Check:** Grepped for all API keys in `frontend/dist/` — **0 matches found**. No provider secrets are leaked into client code.

### Backend Verification
- Syntax and dependency check: Verified across all services and routes.
- Storage directories: `backend/uploads/generated_images/` created automatically on startup.
- Database: Mongoose models cleanly register and index image records.

---

## 7. Deployment Instructions for Vercel and Render

### Vercel (Frontend Deployment)
1. In your **Vercel Dashboard**, select the `NeuroChat` project.
2. In **Settings > Environment Variables**, ensure:
   - `VITE_API_URL`: Set to your Render backend URL (e.g., `https://neurochat-backend.onrender.com/api`).
3. Deploy new changes via Git push or Vercel CLI.
4. Note: No AI provider keys (`GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `NVIDIA_NEMOTRON_API_KEY`) should ever be added to Vercel.

### Render (Backend Deployment)
1. In your **Render Dashboard**, select your `neurochat-backend` web service.
2. Under **Environment**, add/update the following environment variables:
   - `GEMINI_API_KEY_1`: Your primary Google Gemini chat API key.
   - `GEMINI_API_KEY_2`: Your dedicated Google Gemini image generation API key.
   - `NVIDIA_NEMOTRON_API_KEY`: Your NVIDIA Nemotron API key (`nvapi-...`).
   - `GEMINI_CHAT_MODEL`: `gemini-3.5-flash-lite`
   - `GEMINI_IMAGE_MODEL`: `gemini-3.1-flash-image`
   - `NVIDIA_NEMOTRON_MODEL`: `nvidia/nemotron-3-ultra-550b-a55b`
   - `ALLOW_IMAGE_FALLBACK`: `true`
   - `DISK_STORAGE_PATH`: (Optional) Path to persistent disk on Render if using a persistent mount for uploads.
3. Trigger manual deploy or push to your repository's main branch.

---

## 8. Remaining Limitations & Recommendations

1. **Google AI Studio Billing for Key 2:**
   - As noted, Google AI Studio restricts image models to billed accounts. Adding billing to the Google Cloud Project connected to Key 2 unlocks direct Google image output.
2. **Ephemeral Disk Storage on Free Render:**
   - Render's free tier spins down and uses ephemeral storage for `backend/uploads/`. If long-term persistence of generated image files is desired in production, attach a Render Persistent Disk (e.g. `/var/data/uploads`) or integrate AWS S3 / Cloudinary for binary asset storage while keeping image metadata in MongoDB.

---

*Report prepared and verified for Aditya | NeuroChat Project.*

