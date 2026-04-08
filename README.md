# CuziCam | The Vibe Match for College Students 🎓✨

CuziCam is a real-time anonymous video and text chat platform designed exclusively for verified college students. It combines WebRTC technology with AI-driven matching and moderation to create a safe, engaging social space.

## 🚀 Key Features

*   **Verified Community**: Only `.edu` email holders can join.
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
    uvicorn app.main:app --port 8000 --reload
    ```

4.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## 🛡 Security & Moderation

*   **JWT Authentication**: Secure user sessions with access/refresh tokens.
*   **AI Moderation**: Real-time filtering of toxic messages.
*   **Role-Based Access**: Specialized views for students, moderators, and admins.

---
Built with ❤️ for the student community.