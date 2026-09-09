import './loadEnv';
import express from 'express';
import cors from 'cors';
import travelRoutes from './routes/travelRoutes';

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// CORS setup to restrict access strictly to specified frontend origin
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Mount API routes
app.use('/api', travelRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Exception]', err);
  res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred on the server.'
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Travel Advisor API running on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('[Server] GEMINI_API_KEY is missing. Add it to api/.env before requesting travel advice.');
  }
});