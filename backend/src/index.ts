import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/prisma';
import { registerSocketHandlers } from './sockets/chat.socket';
import { startChaosWindowScheduler } from './utils/chaosWindow.scheduler';
import { startCampusPulseScheduler } from './utils/campusPulse.scheduler';
import { connectRedis } from './lib/redis';

// Routes
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/user.routes';
import confessionRoutes from './routes/confession.routes';
import moderationRoutes from './routes/moderation.routes';
import chaosRoutes from './routes/chaos.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001', // Secondary local dev
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Middleware
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Main Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'CuziCam Backend', 
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', profileRoutes);
app.use('/api/confessions', confessionRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/chaos', chaosRoutes);

// Initialize Services
const initialize = async () => {
  try {
    // 1. Database
    await prisma.$connect();
    console.log('[Prisma] Connected to database');

    // 2. Redis
    await connectRedis();
    console.log('[Redis] Initialized successfully');

    // 3. Handlers & Schedulers
    registerSocketHandlers(io);
    startChaosWindowScheduler();
    startCampusPulseScheduler();

    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`[Server] Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Initialization failed:', error);
    process.exit(1);
  }
};

initialize();
