# NeuroChat

**Your Intelligent Conversation Partner**

NeuroChat is a full-stack AI conversational assistant that allows users to create conversations, send messages to an AI assistant powered by Google Gemini, and maintain multi-turn conversations with context.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Database GUI | MongoDB Compass |
| AI Provider | Google Gemini API (`@google/genai`) |
| Authentication | JWT + bcryptjs |

## Project Structure

```
NeuroChat/
├── frontend/          # React + Vite client application
│   ├── src/
│   └── vite.config.js
├── backend/           # Express.js API server
│   ├── config/        # Database connection
│   ├── controllers/   # Route handlers
│   ├── models/        # Mongoose schemas
│   ├── routes/        # API routes
│   ├── middleware/     # Auth & error handling
│   ├── services/      # Business logic (Gemini API)
│   └── server.js      # Entry point
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or later)
- npm
- MongoDB Atlas account (free tier)
- Google Gemini API key

### Backend Setup

```bash
cd backend
npm install
# Create .env file with required variables (see .env.example)
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create a `backend/.env` file with the following:

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ Never commit your `.env` file to version control.

## Architecture

```
Browser → React+Vite (port 5173) → Express API (port 5000) → MongoDB Atlas
                                           ↓
                                     Gemini API (Google)
```

## License

This project is a BCA 5th Semester Field Project.
