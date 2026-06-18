# Hoop Frontend

Modern sports trivia duel game built with Next.js, Tailwind CSS, and Framer Motion.

## Features

- 🎮 Real-time 2-player trivia duels via Socket.io
- 🏀 AI-generated questions for any sport using LangChain + GROQ
- ✨ Smooth animations with Framer Motion
- 🎨 Modern SaaS-like UI with light theme and cyan accent color
- 📊 Live score tracking and results
- 🔐 JWT-based authentication

## Tech Stack

- **Framework**: Next.js 16
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **API Calls**: Axios
- **Real-time**: Socket.io
- **Authentication**: JWT (localStorage)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Update `NEXT_PUBLIC_BACKEND_URL` to your backend URL

3. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Pages

- **`/`** - Landing page with features and CTAs
- **`/signup`** - User registration
- **`/signin`** - User login
- **`/game`** - Main game interface
  - Create room or join existing room
  - Select sport for trivia
  - Real-time multiplayer gameplay
  - Results and score tracking

## Game Flow

1. Sign up or Sign in
2. Choose a sport
3. Create a room or join existing room
4. Wait for opponent
5. Answer AI-generated questions
6. View results and scores

## Production Deployment

### Environment Variables

For production (e.g., Vercel), update:
```
NEXT_PUBLIC_BACKEND_URL=https://your-hoop-backend.onrender.com
```

### Deploy to Vercel

```bash
git push
# Vercel auto-deploys from GitHub
```

### Or deploy manually

```bash
npm run build
npm run start
```

## Architecture

```
hoop-frontend/
├── app/
│   ├── page.tsx           # Landing page
│   ├── signin/            # Sign in page
│   ├── signup/            # Sign up page
│   ├── game/              # Game interface
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── .env.local             # Local environment
├── tailwind.config.ts     # Tailwind config
└── package.json
```

## Design Principles

✅ **No AI trends** - Clean, minimal design without gradients or purple theme
✅ **Pure Tailwind** - All styling done with Tailwind utility classes
✅ **Modern React** - Functional components with hooks (useState only, no state libraries)
✅ **Recruiter-friendly** - Clean code, proper structure, professional UI
✅ **Light + Cyan** - Calming light theme with cyan accent color

## Notes

- No external state management (Zustand, Redux) - using `useState`
- No CSS files - all styling via Tailwind
- No legacy DOM manipulation - pure React/Next.js
- Socket.io for real-time communication
- JWT tokens stored in localStorage
