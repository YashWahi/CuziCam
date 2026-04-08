import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerSocketHandlers } from './sockets/chat.socket';
import { startChaosWindowScheduler } from './utils/chaosWindow.scheduler';
import { startCampusPulseScheduler } from './utils/campusPulse.scheduler';
import { connectRedis } from './lib/redis';

// Routes (to be implemented)
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/user.routes';
import confessionRoutes from './routes/confession.routes';
import moderationRoutes from './routes/moderation.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Main Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CuziCam Backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', profileRoutes);
app.use('/api/confessions', confessionRoutes);
app.use('/api/moderation', moderationRoutes);

// Initialize Services
const initialize = async () => {
  try {
    await connectRedis();
    console.log('[Redis] Initialized successfully');

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
