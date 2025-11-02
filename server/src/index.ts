import dotenv from 'dotenv';
import path from 'path';

// Global error handlers to surface errors in logs (especially under concurrently)
process.on('unhandledRejection', (reason: any) => {
  console.error('[Startup] UnhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Startup] UncaughtException:', err);
});

// Load env from multiple possible locations (server and project root)
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env.local'),
  path.resolve(process.cwd(), '../.env'),
];
try {
  for (const p of envCandidates) {
    dotenv.config({ path: p, override: false });
  }

  // Log minimal env presence (no secrets)
  console.log('[Startup] Env loaded. Required keys presence:', {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    JWT_SECRET: !!process.env.JWT_SECRET,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  });

  // After environment is loaded, dynamically import modules that use env/config
  const { createServer } = await import('node:http');
  const { default: config } = await import('./config/config.js');
  const { default: app } = await import('./app.js');
  const { initChatSocket } = await import('./socket/chatSocket.js');
  const { tokenCleanupService } = await import('./services/tokenCleanup.service.js');

  const port = config.port;
  const host = '0.0.0.0';

  const server = createServer(app);

  initChatSocket(server);

  server.listen(port, host, () => {
    console.log(`PawsIQ Backend listening on http://${host}:${port}`);

    // Start token cleanup service
    tokenCleanupService.start();
    console.log('[Server] Token cleanup service started');
  });
} catch (err) {
  console.error('[Startup] Failed to start server:', err);
  process.exit(1);
}
