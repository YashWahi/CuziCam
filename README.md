# CuziCam | The Vibe Match for College Students 🎓✨

CuziCam is a real-time anonymous video and text chat platform designed exclusively for verified college students. It combines WebRTC technology with AI-driven matching and moderation to create a safe, engaging social space.

## 🚀 Key Features

*   **Verified Community**: Account verification and onboarding keep the community accountable.
*   **AI Vibe Matching**: Matches based on shared interests, department, and conversation quality.
*   **Real-Time Video**: Low-latency WebRTC streams with Socket.io signaling.
*   **Anonymous Confessions**: A college-specific board for students to share thoughts.
*   **Chaos Window**: A daily, randomized 2-hour event with unique matching rules.
*   **Safety Layer**: Real-time toxicity detection and automated icebreakers.

## 🛠 Tech Stack

*   **Frontend**: Next.js (App Router), Vanilla CSS, Socket.io-client.
*   **Backend**: Node.js (Express), Prisma (PostgreSQL), Redis (Queues & Sessions).
*   **AI Service**: Python (FastAPI), Mocked NLP models (ready for LLM swap).
*   **Infrastructure**: Dockerized PostgreSQL and Redis.

## 📍 Getting Started

### Prerequisites

*   Node.js (v18+)
*   Python (v3.9+)
*   Docker & Docker Compose

### 🏗 Installation

1.  **Infrastructure (Postgres & Redis)**
    ```bash
    docker-compose up -d
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    npx prisma migrate dev --name init
    npm start # Or npm run dev
    ```

3.  **AI Service Setup**
    ```bash
    cd ai-service
    pip install -r requirements.txt
    python -m uvicorn app.main:app --port 8000 --reload
    ```

4.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## ☁️ Render deployment (production)

**Backend** (`cuzicam-backend-a484.onrender.com`):

1. Set `NODE_ENV=production` and `FRONTEND_URL` to your **exact** frontend URL (e.g. `https://cuzicam-frontend.onrender.com`).
2. Redeploy after changing CORS env vars — see [backend/DEPLOY.md](backend/DEPLOY.md).
3. Startup log should include `[CORS] Allowed origins: ...` with your frontend URL.

**Frontend** (Render or Vercel):

```env
NEXT_PUBLIC_BACKEND_URL=https://cuzicam-backend-a484.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://cuzicam-backend-a484.onrender.com
```

## 🛡 Security & Moderation

*   **JWT Authentication**: Secure user sessions with access/refresh tokens.
*   **AI Moderation**: Real-time filtering of toxic messages.
*   **Role-Based Access**: Specialized views for students, moderators, and admins.

---
Built with ❤️ for the student community
