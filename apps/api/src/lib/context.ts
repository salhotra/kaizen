import type { inferAsyncReturnType } from '@trpc/server';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './prisma.js';

export const createContext = async ({ req, res }: { req: FastifyRequest; res: FastifyReply }) => {
  return {
    req,
    res,
    prisma,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
