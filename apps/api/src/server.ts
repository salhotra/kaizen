import cors from '@fastify/cors';
import { type FastifyTRPCPluginOptions, fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import Fastify from 'fastify';
import { env } from './config/env.js';
import { createContext } from './lib/context.js';
import { type AppRouter, appRouter } from './router.js';

const server = Fastify({
  logger: {
    level: env.LOG_LEVEL,
  },
  maxParamLength: 5000,
});

// Register CORS
await server.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
});

// Register tRPC
await server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      // report to error monitoring
      console.error(`Error in tRPC handler on path '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
});

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await server.listen({ port: env.PORT, host: env.HOST });

    // biome-ignore lint/suspicious/noConsole: Using only for debugging temporarily
    console.log(`
🚀 Server ready at: http://localhost:${env.PORT}
📡 tRPC endpoint: http://localhost:${env.PORT}/trpc
🏥 Health check: http://localhost:${env.PORT}/health
    `);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
