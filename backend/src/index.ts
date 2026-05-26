import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/prisma';
import { registerSocketHandlers } from './sockets/chat.socket';
import { startChaosWindowScheduler } from './utils/chaosWindow.scheduler';
import { connectRedis } from './lib/redis';
import { getAllowedOrigins, isOriginAllowed } from './lib/cors-origins';

// Routes
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/user.routes';
import confessionRoutes from './routes/confession.routes';
import moderationRoutes from './routes/moderation.routes';
import chaosRoutes from './routes/chaos.routes';
import adminRoutes from './routes/admin.routes';
import * as authController from './controllers/auth.controller';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Render terminates TLS at the edge; required for secure cookies + correct client IP
app.set('trust proxy', 1);

const allowedOrigins = getAllowedOrigins();

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  console.warn(
    '[CORS] No FRONTEND_URL or CORS_ORIGINS set — browser requests from your deployed frontend will be blocked.',
  );
} else {
  console.log('[CORS] Allowed origins:', allowedOrigins.join(', '));
}

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      console.warn(
        `[CORS] Blocked origin: ${origin ?? '(none)'}. Allowed: ${allowedOrigins.join(', ') || '(none configured)'}`,
      );
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  },
});
app.set('io', io);

// Middleware
app.use(cookieParser());
app.use(express.json());

// Main Routes
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'CuziCam Backend', 
    timestamp: new Date().toISOString() 
  });
});

// API Routes with v1 prefix
const apiV1 = express.Router();
apiV1.use('/auth', authRoutes);
apiV1.get('/colleges', authController.getColleges);
apiV1.use('/users', profileRoutes);
apiV1.use('/confessions', confessionRoutes);
apiV1.use('/moderation', moderationRoutes);
apiV1.use('/chaos', chaosRoutes);
apiV1.use('/matchmaking', chaosRoutes);
apiV1.use('/admin', adminRoutes);

app.use('/api/v1', apiV1);

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

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`[Server] Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Initialization failed:', error);
    process.exit(1);
  }
};

initialize();
