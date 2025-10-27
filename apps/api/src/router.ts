import { publicProcedure, router } from './lib/trpc.js';

export const appRouter = router({
  // Add your routers here
  healthCheck: publicProcedure.query(() => {
    return { message: 'API is working!' };
  }),
});

export type AppRouter = typeof appRouter;
