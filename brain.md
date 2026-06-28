# CuziCam — Project Brain

Last updated: June 28, 2026

## What This Project Is
CuziCam is a real-time, anonymous video and text chat platform designed exclusively for verified college students. The platform secures college communities by verifying student email domains (e.g., `.edu` or Indian institution domains like `iitd.ac.in`, `bits-pilani.ac.in`) before granting access to matchmaking, confessions, and connections. It combines low-latency WebRTC streams with Socket.io signaling and AI-driven moderation to create a safe, engaging social space.

## Tech Stack
- **Frontend**: Next.js (App Router, v16.2.2), React (v19.2.4), Framer Motion (v12.38.0), Lucide React (v1.8.0), Socket.io-client (v4.8.3), js-cookie (v3.0.5), tailwind-merge (v3.5.0), clsx (v2.1.1), TypeScript (v5). Styled using CSS Modules and global CSS custom variables (Vanilla CSS).
- **Backend**: Node.js (v18+), TypeScript (v5.9.3), Express (v4.22.1), Prisma client (v5.12.0), socket.io (v4.8.3), bcryptjs (v3.0.3), jsonwebtoken (v9.0.3), nodemailer (v6.10.1), node-cron (v4.2.1), ioredis-mock (v8.13.1), and Redis.
- **Database**: SQLite (for local development via `dev.db`) with Prisma ORM. PostgreSQL is ready for production infrastructure.
- **Real-time**: Socket.io for server-client signaling, matchmaking queue pools, WebRTC SDP negotiation (offers/answers), ICE candidate exchange, in-session live text chat, session end, and disconnections.
- **AI Service**: Python (FastAPI v0.109.2, Uvicorn v0.27.1, Pydantic v2.6.1). Currently mocks NLP toxicity detection (checks for hate, kill, stupid, ugly, die, bitch) and icebreaker generation (checks shared interests) using Python scripts instead of real LLMs or transformers.

## Folder Structure
```text
CuziCam/
├── ai-service/
│   └── app/
│       ├── main.py
│       └── __pycache__/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── dev.db
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/ (empty)
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── chaos.controller.ts
│   │   │   ├── confession.controller.ts
│   │   │   ├── moderation.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── lib/
│   │   │   ├── jwt.ts
│   │   │   ├── prisma.ts
│   │   │   └── redis.ts
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── chaos.routes.ts
│   │   │   ├── confession.routes.ts
│   │   │   ├── moderation.routes.ts
│   │   │   └── user.routes.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── matchmaking.service.ts
│   │   │   └── user.service.ts
│   │   ├── sockets/
│   │   │   └── chat.socket.ts
│   │   ├── utils/
│   │   │   ├── campusPulse.scheduler.ts
│   │   │   └── chaosWindow.scheduler.ts
│   │   └── index.ts
│   ├── scratch/
│   │   ├── check_users.ts
│   │   ├── fix_verification_state.ts
│   │   └── reset_verification.ts
│   ├── .env
│   ├── .env.example
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── chat/
│   │   │   │   ├── [sessionId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.module.css
│   │   │   ├── confessions/
│   │   │   │   ├── confessions.css
│   │   │   │   ├── page.module.css
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── page.module.css
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── onboarding/
│   │   │   │   ├── page.module.css
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   ├── page.module.css
│   │   │   │   └── page.tsx
│   │   │   ├── queue/
│   │   │   │   ├── page.module.css
│   │   │   │   └── page.tsx
│   │   │   ├── signin/
│   │   │   │   ├── page.module.css
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   ├── verify-email/
│   │   │   │   ├── page.module.css
│   │   │   │   └── page.tsx
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── page.module.css
│   │   │   ├── page.tsx
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── Avatar.module.css / Avatar.tsx
│   │   │   ├── Badge.module.css / Badge.tsx
│   │   │   ├── Button.module.css / Button.tsx
│   │   │   ├── Card.module.css / Card.tsx
│   │   │   ├── Input.module.css / Input.tsx
│   │   │   ├── Modal.module.css / Modal.tsx
│   │   │   ├── Sidebar.module.css / Sidebar.tsx
│   │   │   ├── Tag.module.css / Tag.tsx
│   │   │   └── VideoPlayer.css / VideoPlayer.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   └── lib/
│   │       └── api.ts
│   ├── .env.local
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Database Schema Summary
Every model in [schema.prisma](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/prisma/schema.prisma):
- `College`: Stores details of colleges/universities authorized for student access.
- `User`: Stores user account data, credentials, profiles, reputation (vibe) scores, and status flags.
- `MatchSession`: Stores metadata about individual video/text matchmaking sessions (without recording media).
- `Star`: Stores end-of-session positive feedback ratings (stars) given from one user to another.
- `Connection`: Stores established connections formed when two matched users star each other mutually.
- `Confession`: Stores anonymous confessions posted by students to their college's local bulletin board.
- `Report`: Stores safety violation reports submitted by users against other users in a session.
- `Block`: Stores blocking relationships between users to prevent them from matching or seeing each other.

## Environment Setup
Follow these steps to run the project locally from a fresh clone:

### 1. Run Infrastructure Services (Postgres & Redis)
Ensure Docker is installed and running on your machine.
```powershell
docker-compose up -d
```

### 2. Backend Setup
Navigate to the backend, install dependencies, run migrations for local SQLite development database, seed colleges, and launch node-dev server:
```powershell
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

### 3. AI Service Setup
Initialize and activate python virtual environment, install requirements, and run the FastAPI server:
```powershell
# Create virtual environment if it does not exist
python -m venv cuzy
# Activate virtual environment
# On Windows (PowerShell):
.\cuzy\Scripts\Activate.ps1
# On macOS/Linux:
source cuzy/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

### 4. Frontend Setup
Navigate to the frontend, install packages, and start Next.js:
```powershell
cd frontend
npm install
npm run dev
```

The frontend runs on [http://localhost:3000](http://localhost:3000) and backend API on [http://localhost:4000](http://localhost:4000).

## ✅ COMPLETED FEATURES
All features below are implemented, tested, and confirmed working end-to-end:
- **College Domain Lock**: Checks user emails against registered college domains at signup (enforced in [auth.service.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/services/auth.service.ts)).
- **Email OTP Simulation**: Generates a 6-digit code on registration, saves to Redis, and outputs verification OTP to the server console ([email.service.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/services/email.service.ts#L14-L25)).
- **Onboarding Form**: Saves biographical profiles, select interest list, and matching defaults ([user.controller.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/controllers/user.controller.ts#L50-L60)).
- **Websocket-Based Matchmaking Queue**: Implements Redis sorted sets to match users on shared interests, college, and year, automatically scaling down matching score threshold every 15s ([matchmaking.service.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/services/matchmaking.service.ts)).
- **WebRTC Signaling Relay**: Socket-based offer/answer and ICE candidate message forwarding to set up WebRTC media streams ([chat.socket.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/sockets/chat.socket.ts#L113-L133)).
- **Live Text Chat**: Real-time messaging relayed through Socket.io during active sessions ([chat.socket.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/sockets/chat.socket.ts#L135-L152)).
- **Toxicity Moderation Filter**: Pre-scans text chat messages against FastAPI toxicity endpoint, blocking offending messages if score is > 0.8 ([chat.socket.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/sockets/chat.socket.ts#L140-L143)).
- **Icebreakers Generator**: Returns interest-based prompts on match start ([ai-service/app/main.py](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/ai-service/app/main.py#L34-L53)).
- **Star & Connection System**: Permits matched users to rate each other. If mutual, saves a Connection relation ([chat.socket.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/sockets/chat.socket.ts#L186-L220)).
- **Vibe score scaling**: Increments profile `vibeScore` by 1–5 points based on session duration at exit ([chat.socket.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/sockets/chat.socket.ts#L164-L172)).
- **Anonymous College Confessions**: Getting and creating anonymous confessions within a student's college, upvoting/liking posts ([confession.controller.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/controllers/confession.controller.ts)).
- **Campus Pulse & Chaos Window Automation**: Daily Chaos Window events and weekly Campus Pulse email notification jobs run in the background ([chaosWindow.scheduler.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/utils/chaosWindow.scheduler.ts) and [campusPulse.scheduler.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/utils/campusPulse.scheduler.ts)).

## 🔴 KNOWN BUGS
- **Missing Avatar Upload Route on Backend**: The frontend API client calls `POST /users/avatar` (see [api.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/frontend/src/lib/api.ts#L131-L136)) to upload profile images, but no route listener or storage handler is defined on the backend in [user.routes.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/routes/user.routes.ts), causing a 404 error during local avatar uploads.
- **Missing Confession Report Route on Backend**: The frontend client specifies a confession reporting handler `confessionsApi.report` calling `POST /confessions/:id/report` (see [api.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/frontend/src/lib/api.ts#L148)), but the route is not registered on the backend in [confession.routes.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/routes/confession.routes.ts), resulting in a 404 if a user reports a confession.
- **Unimplemented REST Matchmaking Handlers on Frontend**: The frontend defines placeholder methods in `matchApi` (like `findMatch`, `acceptMatch`, etc. in [api.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/frontend/src/lib/api.ts#L158-L163)) which are completely dead/unused code. All matchmaking operations are actually done via WebSockets in [chat.socket.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/sockets/chat.socket.ts).

## 🟡 NOT YET BUILT
- **Real AI Models & LLM Integration**: The FastAPI app is built on mock filters. Toxicity checks are simple word presence tests, and icebreakers use randomized template queries. No actual deep learning models (e.g. HuggingFace unitary/toxic-bert) are integrated.
- **SMTP Email Dispatch**: The verification OTP and reset link emails are only logged to the console via [email.service.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/services/email.service.ts). The SMTP sender logic is commented out and needs app-specific SMTP parameters.
- **Google OAuth API Verification**: The oauth register handler in [auth.service.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/services/auth.service.ts#L124) accepts credentials from the frontend without doing backend verification of Google OAuth tokens.
- **Production Admin & Moderator View UI**: Admin/Moderator capabilities (reports view, manual ban toggles, stats dashboards) are defined in backend controllers ([moderation.controller.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/controllers/moderation.controller.ts)) but lack a corresponding user interface on the frontend.
- **Confession Report Toggles**: No report option is rendered on the anonymous confessions page ([page.tsx](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/frontend/src/app/confessions/page.tsx)) for users to trigger the confessions report API.

## Key Decisions & Gotchas
- **SQLite Database Adaptations**: SQLite is used for development instead of PostgreSQL. Because SQLite does not support standard PostgreSQL arrays or enums:
  - The `interests` list is stored as a stringified JSON string (`default("[]")`). Developers must use `JSON.parse` when loading profile interests and `JSON.stringify` when writing updates.
  - The `Gender` and `Role` fields are defined as raw Strings in [schema.prisma](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/prisma/schema.prisma) instead of custom enums.
  - Transition to Postgres for production is achieved by changing a single line (the `datasource db` block provider) in [schema.prisma](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/prisma/schema.prisma).
- **JWT Cookies**: Session authorization relies on cookies named `accessToken` and `refreshToken` set by the backend server.
- **Chaos Window Override**: Everyday, a randomized 2-hour event disables gender preferences during match searches to maximize matchmaking pool size. Students can opt-out by enabling `strictPreference` on their profiles.
- **Redis Session Lifespan**: Active match sessions are stored in Redis with a 2-hour expiration time (TTL) to prevent orphaned/dangling connections.

## How to Test the Core Flow
Test the signup-to-chat flow locally with these steps:

1. **Launch Services**: Ensure backend, frontend, and AI service are running.
2. **First User Registration**:
   - Go to [http://localhost:3000/signup](http://localhost:3000/signup).
   - Register a user with email `test@mit.edu` (MIT domain is seeded by default).
   - Check the terminal logs of the running backend process. Find the line:
     `[EMAIL STUB] OTP for test@mit.edu: <6-digit-code>`
   - Input the code on the verification screen to verify.
   - Complete onboarding (select interests, gender, name).
3. **Second User Registration**:
   - Open an incognito browser window and go to [http://localhost:3000/signup](http://localhost:3000/signup).
   - Register a second user with email `test2@mit.edu`.
   - Find the OTP code in backend terminal:
     `[EMAIL STUB] OTP for test2@mit.edu: <6-digit-code>`
   - Verify and complete onboarding for this second user.
4. **Queue for Matchmaking**:
   - On both browser windows, navigate to the Dashboard and click **Match** (or go to [http://localhost:3000/queue](http://localhost:3000/queue)).
   - Set filters if desired, and wait. The socket server will match the two users.
5. **Video & Text Chat**:
   - Both users will be redirected to `/chat/[sessionId]`.
   - Allow camera and microphone access on both browsers.
   - Send messages to test chat transmission and click **Star** on both screens to trigger a mutual connection.
   - Click **Skip** or close the connection to end the session and verify vibe score gains.

## Next Priorities
1. **Fix Backend Avatar Upload Endpoint**: Create a file upload controller using `multer` to handle `POST /users/avatar` requests on the backend.
2. **Add Confessions Report Route**: Implement `POST /confessions/:id/report` in the backend confessions controller/router to process anonymous post reports.
3. **Migrate to PostgreSQL**: Transition the local development datasource in [schema.prisma](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/prisma/schema.prisma) to PostgreSQL and verify compatibility.
4. **Setup Real SMTP**: Configure a valid mail transport (e.g., SMTP or Resend) in [email.service.ts](file:///C:/Users/Keerti%20Wahi/OneDrive/Desktop/CuziCam/backend/src/services/email.service.ts).
5. **Integrate Real AI Models**: Replace FastAPI mock endpoints with real HuggingFace toxicity classifier models and LLM API for dynamic icebreakers.
6. **Implement Admin Panel Interface**: Build a moderator interface on the frontend showing reported logs, user vibe histories, and action controls.
