# NeuroChat — REST API Specification

> **Base Path**: `/api`  
> **Protocol**: JSON over HTTP/HTTPS  
> **Session Auth**: `nc_token` httpOnly Cookie  
> **Source**: Specification §23

---

## 1. Conventions & Envelopes

### Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable explanation",
    "fields": { "email": "Invalid format" },
    "retryable": false,
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## 2. Endpoint Catalog

### Authentication Endpoints
- **A1 · `POST /api/auth/register`**
  - **Auth**: None
  - **Body**: `{ name, email, password, confirmPassword, rememberMe? }`
  - **Response 201**: `{ success: true, data: { user } }` + `Set-Cookie: nc_token`
- **A2 · `POST /api/auth/login`**
  - **Auth**: None
  - **Body**: `{ email, password, rememberMe? }`
  - **Response 200**: `{ success: true, data: { user } }` + `Set-Cookie: nc_token`
- **A3 · `POST /api/auth/google`**
  - **Auth**: None
  - **Body**: `{ credential, rememberMe? }`
  - **Response 200**: `{ success: true, data: { user, isNewUser } }` + `Set-Cookie: nc_token`
- **A4 · `POST /api/auth/logout`**
  - **Auth**: Optional
  - **Response 204**: No Content + Cookie cleared
- **A5 · `GET /api/auth/me`**
  - **Auth**: Required
  - **Response 200**: `{ success: true, data: { user } }`

---

### Conversation Endpoints
- **C1 · `POST /api/conversations`**
  - **Auth**: Required
  - **Body**: `{ title? }`
  - **Response 201**: `{ success: true, data: { conversation } }`
- **C2 · `GET /api/conversations`**
  - **Auth**: Required
  - **Query**: `limit` (default 20), `cursor`, `search`, `searchIn`
  - **Response 200**: `{ success: true, data: { conversations }, meta: { nextCursor } }`
- **C3 · `GET /api/conversations/:id`**
  - **Auth**: Required
  - **Response 200**: `{ success: true, data: { conversation } }`
- **C4 · `PATCH /api/conversations/:id`**
  - **Auth**: Required
  - **Body**: `{ title }`
  - **Response 200**: `{ success: true, data: { conversation } }`
- **C5 · `DELETE /api/conversations/:id`**
  - **Auth**: Required
  - **Response 204**: No Content (conversation and messages cascade deleted)

---

### Message Endpoints
- **M1 · `GET /api/conversations/:id/messages`**
  - **Auth**: Required
  - **Query**: `limit` (default 50), `before`
  - **Response 200**: `{ success: true, data: { messages }, meta: { hasMore } }`
- **M2 · `POST /api/conversations/:id/messages`**
  - **Auth**: Required (Rate limit: 20/min/user)
  - **Body**: `{ content, language? }`
  - **Response 201**:
    ```json
    {
      "success": true,
      "data": {
        "userMessage": { "id": "...", "role": "user", "content": "..." },
        "assistantMessage": { "id": "...", "role": "assistant", "content": "..." },
        "conversation": { "id": "...", "title": "..." }
      },
      "meta": {
        "contextTruncated": false,
        "sensitiveTopic": false
      }
    }
    ```
- **M3 · `POST /api/conversations/:id/messages/retry`**
  - **Auth**: Required
  - **Response 200**: `{ success: true, data: { assistantMessage, conversation } }`

---

### User & Utility Endpoints
- **U1 · `PATCH /api/users/me`**
  - **Auth**: Required
  - **Body**: `{ name?, settings?: { uiLanguage?, replyLanguage?, theme?, onboardingCompleted? } }`
  - **Response 200**: `{ success: true, data: { user } }`
- **U2 · `PATCH /api/users/me/password`**
  - **Auth**: Required
  - **Body**: `{ currentPassword?, newPassword }`
  - **Response 204**: No Content (increments tokenVersion and re-issues cookie)
- **S1 · `GET /api/health`**
  - **Auth**: None
  - **Response 200 / 503**: `{ status: "ok", db: "up", timestamp: "..." }`
