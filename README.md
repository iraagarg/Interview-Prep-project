# 🧠 InterviewAI - AI-Powered Interview Preparation Platform

🌐 **Live Demo:** [Click Here](https://interview-prep-project-nu.vercel.app)

A full-stack web application for AI-driven mock interviews, resume analysis, and performance tracking.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- OpenAI API key

### 1. Clone & Setup Environment

**Backend:**
```bash
cd server
cp .env.example .env
# Fill in your MongoDB URI and OpenAI API key in .env
npm install
npm run dev
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

### 2. Environment Variables (server/.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/interview-prep
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
OPENAI_API_KEY=sk-...
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## 📂 Project Structure

```
interview-prep-platform/
├── server/                    # Express.js backend
│   ├── controllers/           # Route handlers
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routes
│   ├── middlewares/           # Auth & upload middleware
│   ├── services/              # OpenAI & PDF services
│   └── index.js               # Server entry point
│
└── client/                    # React.js frontend
    └── src/
        ├── components/        # Reusable UI components
        ├── pages/             # Page components
        ├── context/           # Auth context
        └── utils/             # API client & auth helpers
```

## ✨ Features

- 🔐 **JWT Authentication** - Secure register/login with bcrypt
- 📄 **Resume Analysis** - PDF upload + AI-powered insights
- 🤖 **Mock Interviews** - Real-time AI chat-based interviews
- 📊 **Analytics Dashboard** - Scores, trends, and radar charts
- 📜 **Interview History** - Past sessions with detailed reports
- 👤 **Profile Management** - Skills, experience, target role

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| AI | OpenAI GPT-3.5 Turbo |
| Auth | JWT + bcrypt |
| PDF | pdf-parse + Multer |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get profile |
| POST | /api/resume/upload | Upload PDF resume |
| GET | /api/resume | Get latest resume |
| POST | /api/interview | Create session |
| POST | /api/chat/start/:id | Start AI interview |
| POST | /api/chat/message/:id | Send message |
| POST | /api/chat/end/:id | End & get feedback |
| GET | /api/analytics/overview | Overall stats |
| GET | /api/analytics/progress | Score over time |

## 🚀 Deployment

- **Frontend**: Vercel (`npm run build` → deploy `dist/`)
- **Backend**: Render/Railway (set env vars in dashboard)
- **Database**: MongoDB Atlas
