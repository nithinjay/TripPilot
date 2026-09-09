import path from 'path';
import dotenv from 'dotenv';

// Load api/.env first, then the repo-root .env as a fallback.
// Existing process env values are not overwritten.
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
