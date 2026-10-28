import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { config } from './config/env';
import { connectDB } from './config/db';

const app: Express = express();

// Trust the immediate reverse-proxy hop (e.g. Hostinger Nginx / LiteSpeed reverse proxy)
app.set('trust proxy', 1);

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, mobile apps, curl)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, '');
      const allowedOrigins = (config.clientUrls || ['http://localhost:3000']).map((url) =>
        url.replace(/\/+$/, '')
      );

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from public/uploads directory at /uploads
const uploadsPath = path.resolve(__dirname, '../public/uploads');
app.use('/uploads', express.static(uploadsPath));

// Ensure MongoDB is connected before handling API requests
app.use(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err: any) {
    console.error('[Database Middleware] Connection error:', err?.message || err);
    res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MongoDB is reachable.',
      error: config.nodeMode === 'development' ? err?.message : undefined,
    });
  }
});

// API Routes
app.use('/api', routes);

// 404 Handler for undefined routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
