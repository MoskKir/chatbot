# Chatbot

Real-time AI chatbot with streaming responses, file uploads, and multi-model support.

- **Backend:** NestJS, Prisma, PostgreSQL, Socket.IO, OpenRouter API
- **Frontend:** React, Vite, Tailwind CSS, React Query, Socket.IO

## Prerequisites

- Node.js 18+
- PostgreSQL database
- [OpenRouter](https://openrouter.ai/) API key
- Supabase project (for auth and file storage)

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values
```

Create `backend/.env` with:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/chatbot
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini
ALLOWED_MODELS=openai/gpt-4o-mini,anthropic/claude-sonnet-4
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CORS_ORIGINS=http://localhost:5173
PORT=3001
```

Run database migrations and start:

```bash
npx prisma migrate dev
npm run start:dev
```

Backend runs on `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Production Build

```bash
# Backend
cd backend && npm run build && npm run start:prod

# Frontend
cd frontend && npm run build && npm run preview
```
