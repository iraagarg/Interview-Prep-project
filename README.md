# 🧠 InterviewAI - AI-Powered Interview Preparation Platform

🌐 **Live Demo:** [Click Here](https://interview-prep-project-nu.vercel.app)

A full-stack web application for AI-driven mock interviews, resume analysis, and performance tracking.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account for resume uploads
- Groq API key 


### 1. Run the backend
```bash
cd server
cp .env.example .env
# Fill in your MongoDB URI, Cloudinary credentials, and GROQ_API_KEY in server/.env
npm install
npm run dev
```

### 2. Run the frontend
```bash
cd client
npm install
npm run dev
```

### 3. Open the app
- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5001/api/health`

## 🔧 Environment Variables (server/.env)

```env
PORT=5001
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=30d
GROQ_API_KEY=your_groq_api_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 📁 Project Structure

```
interview-prep-project/
├── server/                    # Express.js backend
│   ├── controllers/           # Route handlers
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routes
│   ├── middlewares/           # Auth & file upload middleware
│   ├── services/              # AI + resume parsing services
│   └── index.js               # Server entry point
└── client/                    # React.js frontend
    └── src/
        ├── components/        # Reusable UI components
        ├── pages/             # Page views
        ├── context/           # Auth context
        └── utils/             # API client + auth helpers
```

## ✨ Features
- 🔐 JWT-based authentication with secure password handling
- 📄 Resume upload and AI-powered review
- 🤖 Mock interview flows with AI-driven follow-up questions
- 📊 Analytics dashboard and performance history
- 📜 Interview session tracking and chat history
- 👤 Profile management and user settings

## 🛠️ Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| AI | Groq AI (llama models) |
| Auth | JWT + bcryptjs |
| File upload | Multer + Cloudinary |

## 📡 API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Authenticate user |
| GET | /api/auth/me | Get current user profile |
| PUT | /api/auth/profile | Update user profile |
| PUT | /api/auth/password | Change password |
| POST | /api/resume/upload | Upload resume PDF |
| GET | /api/resume | Get latest resume summary |
| GET | /api/resume/all | List all uploaded resumes |
| DELETE | /api/resume/:id | Delete a resume |
| POST | /api/resume/:id/analyze | Reanalyze a specific resume |
| POST | /api/interview | Create interview session |
| GET | /api/interview | List interview sessions |
| GET | /api/interview/:id | Get interview details |
| PUT | /api/interview/:id/complete | Mark interview complete |
| DELETE | /api/interview/:id | Delete interview session |
| POST | /api/chat/start/:interviewId | Start interview chat |
| POST | /api/chat/message/:interviewId | Send chat message |
| POST | /api/chat/end/:interviewId | End chat session |
| GET | /api/chat/messages/:interviewId | Fetch chat history |
| GET | /api/analytics/overview | Overview analytics |
| GET | /api/analytics/skills | Skill analytics |
| GET | /api/analytics/progress | Progress over time |

