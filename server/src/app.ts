import express from 'express';
import cors from 'cors';
import compression from 'compression';
import apiRoutes from './api/routes/index.js';
import { errorConverter, errorHandler } from './api/middlewares/error.js';

const app = express();

app.use(cors({
  origin: ['http://localhost:3001', 'https://pawsiq.in', 'https://www.pawsiq.in'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use((req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});
app.use(compression());
app.use(express.json());
app.set('json replacer', (key: string, value: any) => (typeof value === 'bigint' ? Number(value) : value));
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

app.use(errorConverter);
app.use(errorHandler);

export default app;
