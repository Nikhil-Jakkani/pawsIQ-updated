import { tokenService } from '../api/services/user/token.service.js';

class TokenCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Start the token cleanup service
   */
  start() {
    if (this.cleanupInterval) {
      console.log('[Token Cleanup] Service already running');
      return;
    }

    console.log('[Token Cleanup] Starting token cleanup service');
    
    // Run cleanup immediately on start
    this.runCleanup();
    
    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Stop the token cleanup service
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('[Token Cleanup] Service stopped');
    }
  }

  /**
   * Run token cleanup
   */
  private async runCleanup() {
    try {
      console.log('[Token Cleanup] Running expired token cleanup...');
      await tokenService.cleanupExpiredTokens();
      console.log('[Token Cleanup] Cleanup completed successfully');
    } catch (error) {
      console.error('[Token Cleanup] Cleanup failed:', error);
    }
  }

  /**
   * Manual cleanup trigger
   */
  async manualCleanup() {
    await this.runCleanup();
  }
}

export const tokenCleanupService = new TokenCleanupService();
