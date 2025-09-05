import express from 'express';
import cors from 'cors';
import apiRoutes from './api/routes/index.js';
import { errorConverter, errorHandler } from './api/middlewares/error.js';

const app = express();

// Configure CORS with specific origin and credentials
app.use(cors({
  origin: ['http://localhost:3001', 'https://pawsiq.in', 'https://www.pawsiq.in'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
// Ensure BigInt values from Prisma can be serialized in JSON responses
app.set('json replacer', (key: string, value: any) => (typeof value === 'bigint' ? Number(value) : value));
// Harden: override res.json to always stringify BigInt safely (as string) before sending
app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data: any) => {
    const safe = JSON.parse(
      JSON.stringify(
        data,
        (_k, v) => (typeof v === 'bigint' ? v.toString() : v)
      )
    );
    return originalJson(safe);
  };
  next();
});

app.get('/', (_req, res) => {
  res.send('PawsIQ Backend Server is running!');
});

app.use('/api/v1', apiRoutes);

// Error handling must come after routes
app.use(errorConverter);
app.use(errorHandler);

export default app;
