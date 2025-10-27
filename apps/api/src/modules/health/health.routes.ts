/**
 * Health Module - Routes
 *
 * HTTP route handlers for health check endpoints
 */

import type { FastifyInstance } from 'fastify';

/**
 * Register health check routes
 *
 * @param server - Fastify instance
 */
export async function registerHealthRoutes(server: FastifyInstance): Promise<void> {
  /**
   * GET /health
   *
   * Health check endpoint to verify the API is running
   */
  server.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });
}
