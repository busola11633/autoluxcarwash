// Vercel serverless entry point. vercel.json sends every /api/* request here.
// The actual routes live in server/app.ts (shared with local `npm run dev`).
import { app } from '../server/app';

export default app;
