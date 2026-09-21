# NeuroChat — Testing Strategy & Test Case Matrix

> **Source**: Specification §31

---

## 1. Authentication Test Cases

| Test ID | Scenario | Input / Action | Expected Result | Status |
|---|---|---|---|---|
| **T-AUTH-01** | Valid registration | Name, new email, strong password | 201 Created, Set-Cookie `nc_token`, user created | Pass |
| **T-AUTH-02** | Duplicate email | Re-register existing email (case-insensitive) | 409 EMAIL_IN_USE, friendly error message | Pass |
| **T-AUTH-03** | Invalid email format | `user@` | 400 VALIDATION_ERROR under Email field | Pass |
| **T-AUTH-04** | Weak password | `< 8` chars or missing number | 400 VALIDATION_ERROR with specific hint | Pass |
| **T-AUTH-05** | Confirm mismatch | Non-matching confirm password | Validation message, form submit blocked | Pass |
| **T-AUTH-06** | Valid login | Correct email and password | 200 OK, cookie set, redirected to /chat | Pass |
| **T-AUTH-07** | Invalid credentials | Non-existent email or wrong password | 401 INVALID_CREDENTIALS, uniform timing | Pass |
| **T-AUTH-08** | Google login | Valid Google ID token payload | 200 OK, account matched or created | Pass |
| **T-AUTH-09** | Safe account linking | Google sign-in with matching local email | Unverified local password dropped, account linked | Pass |
| **T-AUTH-10** | Logout | Click logout button | 204 No Content, cookie cleared, state reset | Pass |

---

## 2. Chat & Multi-Turn Context Test Cases

| Test ID | Scenario | Input / Action | Expected Result | Status |
|---|---|---|---|---|
| **T-CHAT-01** | Normal message | "What is Java?" | User bubble shows immediately; AI answer appears | Pass |
| **T-CHAT-02** | Empty / whitespace message | Empty string or `"   "` | Send button disabled; request blocked | Pass |
| **T-CHAT-03** | Multi-turn context | Ask "What is Java?", then "What are its advantages?" | Model recognizes "its" refers to Java | Pass |
| **T-CHAT-04** | Context limit | Long dialog exceeding 20 msgs | Bounded sliding window truncates oldest; note shown | Pass |
| **T-CHAT-05** | Sensitive topic nudge | "What dose of paracetamol is safe?" | Verification warning note rendered below answer | Pass |
| **T-CHAT-06** | Transient AI error | Upstream timeout / 503 error | Friendly error banner shown; Retry button available | Pass |
| **T-CHAT-07** | Retry last message | Click Retry on failed/last message | Generates answer without duplicating user prompt | Pass |
| **T-CHAT-08** | Code block copy | Click Copy on code block | Raw code written to clipboard; "Copied" shown | Pass |

---

## 3. Security Test Cases

| Test ID | Scenario | Input / Action | Expected Result | Status |
|---|---|---|---|---|
| **T-SEC-01** | Protected route without token | Access `/api/conversations` without cookie | 401 UNAUTHENTICATED | Pass |
| **T-SEC-02** | IDOR conversation access | User A accesses User B's conversation ID | 404 NOT_FOUND (never reveals existence) | Pass |
| **T-SEC-03** | NoSQL injection in login | `{"email": {"$gt": ""}, "password": "x"}` | 400 VALIDATION_ERROR | Pass |
| **T-SEC-04** | XSS sanitization | Send `<script>alert(1)</script>` | Neutralized and rendered safely as text | Pass |
| **T-SEC-05** | Secret exposure scan | Grep build output in `frontend/dist` | 0 secrets found | Pass |
| **T-SEC-06** | CSRF origin check | Send POST with foreign `Origin` header | 403 FORBIDDEN_ORIGIN | Pass |
