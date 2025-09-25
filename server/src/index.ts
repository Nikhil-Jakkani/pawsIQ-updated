import app from './app.js';
import config from './config/config.js';
import dotenv from 'dotenv';
import path from 'path';
import { tokenCleanupService } from './services/tokenCleanup.service.js';

// Load env from multiple possible locations (server and project root)
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env.local'),
  path.resolve(process.cwd(), '../.env'),
];
for (const p of envCandidates) {
  dotenv.config({ path: p, override: false });
}

const port = config.port;
const host = '0.0.0.0';

app.listen(port, host, () => {
  console.log(`PawsIQ Backend listening on http://${host}:${port}`);
  
  // Start token cleanup service
  tokenCleanupService.start();
  console.log('[Server] Token cleanup service started');
});
