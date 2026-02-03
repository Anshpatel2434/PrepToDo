// =============================================================================
// Backend Server - Main Entry Point
// =============================================================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './common/middleware/errorHandler.js';
import { generalRateLimiter } from './common/middleware/rateLimiter.js';
import { authRouter, cleanupExpired, verifyEmailConnection } from './features/auth/index.js';
import dashboardRouter from './features/dashboard/dashboard.routes.js';
import { logger, httpLogger } from './common/utils/logger.js';
import pinoHttp from 'pino-http';

// =============================================================================
// Express App Setup
// =============================================================================
const app = express();

// Trust proxy (required for correct IP behind proxies/load balancers)
app.set('trust proxy', 1);

// =============================================================================
// Security Middleware
// =============================================================================
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// =============================================================================
// CORS Configuration
// =============================================================================
app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// =============================================================================
// Request Parsing
// =============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// =============================================================================
// Rate Limiting (General)
// =============================================================================
app.use('/api', generalRateLimiter);

// =============================================================================
// HTTP Request Logging
// =============================================================================
app.use(pinoHttp({
    logger: httpLogger,
    autoLogging: {
        ignore: (req) => req.url === '/health',
    },
    // Reduce verbosity - only log essential request info
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },
    customLogLevel: (_req, res) => {
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${req.url} failed with ${res.statusCode}`,
}));

// =============================================================================
// Health Check
// =============================================================================
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =============================================================================
// API Routes
// =============================================================================
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);

// Future feature routes will be mounted here:
// app.use('/api/exams', examsRouter);

// =============================================================================
// Error Handling
// =============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// Server Startup
// =============================================================================
const PORT = config.port;

async function startServer() {
    // Verify email service connection
    await verifyEmailConnection();

    // Start cleanup job (runs every hour)
    setInterval(() => {
        cleanupExpired().catch(err => {
            logger.warn({ error: err.message }, 'Scheduled cleanup failed');
        });
    }, 60 * 60 * 1000);

    // Initial cleanup on startup (non-blocking)
    cleanupExpired().catch(err => {
        logger.warn({ error: err.message }, 'Initial cleanup skipped - tables may not exist yet');
    });

    app.listen(PORT, () => {
        logger.info({
            port: PORT,
            mode: config.isProduction ? 'production' : 'development',
            frontend: config.frontendUrl,
        }, '🚀 PrepToDo Backend API started');
    });
}

startServer().catch(err => logger.error(err, 'Failed to start server'));

export { app };
