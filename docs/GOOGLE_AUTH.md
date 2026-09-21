# NeuroChat — Google OAuth & Account Linking Architecture

> **Source**: Specification §16  
> **Protocol**: Google Identity Services (GIS) ID-Token OpenID Connect Flow

---

## 1. Flow Overview

```
[User] clicks "Continue with Google"
  │
  ├─► GIS Popup renders Google Account Chooser
  │
  ├─► User grants profile/email consent
  │
  ├─► Browser receives Google-signed ID Token (JWT)
  │
  ├─► Frontend POST /api/auth/google { credential }
  │     │
  │     ├─► google-auth-library verifies ID token signature & audience
  │     ├─► Validates email_verified === true
  │     ├─► Applies Safe Account Linking Rules (§16.6)
  │     ├─► Generates NeuroChat nc_token httpOnly cookie
  │     │
  │     └─► Returns 200 { user, isNewUser }
  │
  └─► Frontend receives session and navigates to /chat
```

---

## 2. Server-Side Verification (`google.service.js`)

The frontend is **never trusted** to tell the server who the user is. The client transmits only the opaque `credential` token. The server verifies:
1. Cryptographic signature against Google's published public certificates.
2. `aud` (audience) matches our configured `GOOGLE_CLIENT_ID` (prevents token reuse across apps).
3. `iss` is `https://accounts.google.com`.
4. Expiration timestamp (`exp`) has not passed.
5. `email_verified` is strictly `true`.

---

## 3. Safe Account Linking Rules (§16.6)

### The Threat: Pre-Hijacking
Because MVP password registration does not force email verification upfront, an attacker could register an account using `victim@gmail.com` with a password known to the attacker. If the real victim later logs in with Google, a naive account linking would give the attacker permanent backdoor access.

### NeuroChat's Mitigation Strategy:
1. **Google Email Verified**: We only link accounts when Google certifies `email_verified: true`.
2. **Discard Unverified Local Passwords**: If linking to an existing local account that has `emailVerified: false`, the backend automatically:
   - Sets `passwordHash = undefined` (purges the unverified password).
   - Increments `tokenVersion` (immediately invalidating any active impostor session).
   - Sets `googleId = sub` and `emailVerified = true`.
3. **Reverse Direction Block**: If an unauthenticated visitor attempts to register via password using an email already owned by a Google user, the API refuses with `409 EMAIL_USES_GOOGLE`.
