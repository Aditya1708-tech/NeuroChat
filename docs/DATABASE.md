# NeuroChat — Database Design & Schema Documentation

> **Database Engine**: MongoDB (Mongoose ODM)  
> **Database Name**: `neurochat`  
> **Source**: Specification §22

---

## 1. Collections Overview

NeuroChat models data using three referenced collections:
1. **`users`**: User accounts, password hashes, Google identifiers, settings, and session versioning.
2. **`conversations`**: Dialogue metadata, titles, and activity timestamps.
3. **`messages`**: Multi-turn prompts and replies, roles, and AI generation metadata.

Referenced collections are chosen over embedded arrays because conversational logs can scale to thousands of turns, exceeding MongoDB's 16MB document boundary.

---

## 2. Entity Relationship Diagram (ERD)

```
+-----------------------------------+
|               USER                |
+-----------------------------------+
| _id               : ObjectId (PK) |
| name              : String        |
| email             : String (UK)   |
| passwordHash      : String        |
| authProviders     : [String]      |
| googleId          : String (UK)   |
| emailVerified     : Boolean       |
| settings          : Object        |
| tokenVersion      : Number        |
| createdAt         : Date          |
| updatedAt         : Date          |
+-----------------------------------+
         │ 1
         │
         │ owns
         ▼ N
+-----------------------------------+
|           CONVERSATION            |
+-----------------------------------+
| _id               : ObjectId (PK) |
| userId            : ObjectId (FK) |
| title             : String        |
| summary           : String        |
| createdAt         : Date          |
| updatedAt         : Date          |
+-----------------------------------+
         │ 1
         │
         │ contains
         ▼ N
+-----------------------------------+
|              MESSAGE              |
+-----------------------------------+
| _id               : ObjectId (PK) |
| conversationId    : ObjectId (FK) |
| userId            : ObjectId (FK) | <--- (Denormalized owner for fast indexing)
| role              : String        |
| content           : String        |
| metadata          : Object        |
| createdAt         : Date          |
+-----------------------------------+
```

---

## 3. Database Indexes

| Collection | Index Fields | Purpose |
|---|---|---|
| `users` | `{ email: 1 }` (unique) | Fast lookup and race-condition prevention during registration |
| `users` | `{ googleId: 1 }` (unique, sparse) | Instant Google OAuth lookup without duplicate collisions |
| `conversations` | `{ userId: 1, updatedAt: -1, _id: -1 }` | Fast sidebar list and cursor-based pagination |
| `conversations` | `{ userId: 1, title: 1 }` | Title search optimization |
| `messages` | `{ conversationId: 1, _id: 1 }` | Chronological conversation turn loading |
| `messages` | `{ conversationId: 1, createdAt: -1 }` | Fast context building for recent turns |
| `messages` | `{ userId: 1, content: "text" }` | Unicode-safe message content search (`default_language: "none"`) |

---

## 4. Sample Documents

### `users` document:
```json
{
  "_id": "66f0a1b2c3d4e5f60718293a",
  "name": "Aditya Sharma",
  "email": "aditya@example.com",
  "passwordHash": "$2b$12$Kx8s... (60 character bcrypt hash)",
  "authProviders": ["local"],
  "emailVerified": false,
  "settings": {
    "uiLanguage": "en",
    "replyLanguage": "auto",
    "theme": "light",
    "onboardingCompleted": true
  },
  "tokenVersion": 0,
  "createdAt": "2026-09-20T10:00:00.000Z",
  "updatedAt": "2026-09-20T10:00:00.000Z"
}
```

### `conversations` document:
```json
{
  "_id": "66f0a1b2c3d4e5f60718293b",
  "userId": "66f0a1b2c3d4e5f60718293a",
  "title": "What is Java?",
  "createdAt": "2026-09-20T10:05:00.000Z",
  "updatedAt": "2026-09-20T10:06:12.000Z"
}
```

### `messages` document:
```json
{
  "_id": "66f0a1b2c3d4e5f60718293c",
  "conversationId": "66f0a1b2c3d4e5f60718293b",
  "userId": "66f0a1b2c3d4e5f60718293a",
  "role": "assistant",
  "content": "Java is an object-oriented language...",
  "metadata": {
    "model": "gemini-1.5-flash",
    "finishReason": "STOP",
    "latencyMs": 1820,
    "usage": { "promptTokens": 32, "completionTokens": 95 },
    "sensitiveTopic": false,
    "contextTruncated": false
  },
  "createdAt": "2026-09-20T10:05:02.000Z"
}
```

---

## 5. MongoDB Compass Viva Demonstration Guide

In the viva examination, follow these steps to demonstrate database architecture:
1. Connect Compass to `mongodb://localhost:27017` or your Atlas cluster.
2. Select database `neurochat` and point out the 3 collections.
3. Open `users`: show that `passwordHash` is a 60-character bcrypt hash starting with `$2b$12$` and plaintext passwords never exist.
4. Show `conversations`: demonstrate `userId` ownership and automatic title generation.
5. Show `messages`: demonstrate alternating `user` and `assistant` roles, metadata fields, and Unicode Hindi storage.
6. Open the **Indexes** tab: show the compound indexes created to support efficient sorting and search.
7. Delete a conversation in the web app, refresh Compass, and show that all corresponding messages were deleted via cascade.
