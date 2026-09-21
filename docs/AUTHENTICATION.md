# NeuroChat — Authentication & Session Architecture

> **Source**: Specification §15

---

## 1. Authentication Strategy Comparison

| Approach | Security Mechanism | Trade-offs | Verdict |
|---|---|---|---|
| **JWT in localStorage** | Token stored in browser storage, sent via `Authorization` header | Vulnerable to XSS token theft | **Rejected** |
| **Server Sessions (express-session)** | Session ID cookie pointing to Mongo store | Requires separate session store; stateful | **Alternative** |
| **JWT in httpOnly Cookie** | Stateless JWT stored in browser cookie inaccessible to JavaScript | Protected from XSS; requires CSRF defense | **Chosen (D2)** |

---

## 2. Token & Cookie Design

- **Cookie Name**: `nc_token`
- **Algorithm**: HMAC SHA-256 (`HS256`)
- **Claims**:
  - `sub`: User ObjectId string
  - `tv`: `tokenVersion` counter for instant token revocation
  - `iat`, `exp`: Token timestamps
- **Cookie Security Flags**:
  - `HttpOnly`: True (blocks JavaScript access via `document.cookie`)
  - `SameSite`: `Lax` (defends against cross-site request forgery)
  - `Secure`: True in production (HTTPS-only transmission)
  - `Path`: `/`
- **Lifetimes**:
  - Default: Session cookie (expires on browser close), JWT expiration 24 hours.
  - "Remember me" enabled: `Max-Age` 30 days, JWT expiration 30 days.

---

## 3. Instant JWT Invalidation via `tokenVersion`

**Viva Question**: *"How do you invalidate a stateless JWT before it expires?"*  
**Answer**: *"Tokens carry a version number (`tv`). Each user document in MongoDB stores a `tokenVersion` integer. Our authentication middleware compares the token's `tv` claim with the user's database `tokenVersion`. Incrementing `tokenVersion` (e.g. during a password change or remote logout) instantly renders all previously issued tokens invalid."*

---

## 4. Multi-Layered CSRF Defense (SEC-012)

1. **SameSite=Lax Cookies**: Modern browsers withhold `SameSite=Lax` cookies on cross-origin POST requests.
2. **Origin & Referer Inspection**: The custom `originCheck` middleware inspects incoming mutation requests (POST/PATCH/DELETE) and rejects any request where `Origin` doesn't match `CLIENT_URL` with a `403 FORBIDDEN_ORIGIN`.
3. **Strict JSON Bodies**: All mutations require `Content-Type: application/json`. Standard HTML form attacks cannot send arbitrary JSON payloads.
