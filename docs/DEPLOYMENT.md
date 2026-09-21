# NeuroChat — Production Deployment Guide

> **Recommended Stack**: Vercel (Frontend) + Render (Backend API) + MongoDB Atlas (Database)  
> **Source**: Specification §32

---

## 1. Hosting Architecture

```
User (Browser) ──── HTTPS ────► Vercel (Frontend SPA)
                                  │
                                  ├─ /api/* rewrites
                                  ▼
                                Render (Node.js API)
                                  ├── MongoDB Atlas
                                  ├── Google Gemini API
                                  └── Google OAuth Verification
```

---

## 2. Environment Variables Matrix

### Backend (Render Dashboard)
| Variable | Required | Secret? | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | No | `production` (enforces Secure cookies and hides error stacks) |
| `PORT` | Local only | No | Injected automatically by host |
| `CLIENT_URL` | Yes | No | Production frontend URL (e.g. `https://neurochat.vercel.app`) |
| `SERVER_URL` | Optional | No | Production backend URL |
| `TRUST_PROXY` | Yes | No | `1` (enables correct IP resolution behind proxy) |
| `MONGODB_URI` | Yes | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Yes | 32+ character random secret |
| `GOOGLE_CLIENT_ID` | Yes | No | Google Cloud Console OAuth Web Client ID |
| `GEMINI_API_KEY` | Yes | Yes | Google AI Studio API key (Strictly backend only) |
| `GEMINI_MODEL` | Yes | No | `gemini-1.5-flash` |

### Frontend (Vercel Dashboard)
| Variable | Required | Secret? | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | No | `/api` (proxied via `vercel.json`) |
| `VITE_GOOGLE_CLIENT_ID` | Yes | No | Same Google Client ID as backend |

---

## 3. Same-Origin Proxy (`vercel.json`)

To prevent cross-site cookie restrictions on Safari and modern mobile browsers, configure `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-service.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 4. Viva Fallback Strategy (§32.8)

In the academic viva:
1. **Primary**: Live deployment on Vercel + Render.
2. **Pre-Viva Warmup**: Send a ping request to `/api/health` 5 minutes prior to waking up sleeping free-tier containers.
3. **Local Fallback**: Run backend and frontend locally using `npm run dev` in the root workspace.
4. **Offline Recording**: Maintain a pre-recorded backup video demonstrating registration, context follow-ups, and Compass inspection.
