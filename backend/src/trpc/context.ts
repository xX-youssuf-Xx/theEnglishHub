import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { verifyToken } from '../utils/auth';
import { logger } from '../utils/logger';
import type { User } from '../types';

export interface Context {
  user: User | null;
}

// Cache for user data to avoid DB queries on every request
const userCache = new Map<string, { user: User; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function createContext({ req }: CreateExpressContextOptions): Promise<Context> {
  const startTime = Date.now();
  
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return { user: null };
    }

    // Check cache first
    const cached = userCache.get(token);
    if (cached && cached.expires > Date.now()) {
      logger.debug(`User context served from cache in ${Date.now() - startTime}ms`);
      return { user: cached.user };
    }

    const decoded = verifyToken(token) as any;
    
    // Use decoded token data directly - avoid DB query
    // Token is trusted since it's signed
    const user: User = {
      id: decoded.id,
      publicId: decoded.publicId,
      username: decoded.username,
      role: decoded.role,
      isActive: decoded.isActive,
      lastLogin: decoded.lastLogin,
      createdAt: decoded.createdAt,
      updatedAt: decoded.updatedAt,
    };

    // Cache the user
    userCache.set(token, {
      user,
      expires: Date.now() + CACHE_TTL,
    });

    const duration = Date.now() - startTime;
    if (duration > 100) {
      logger.warn(`Slow context creation: ${duration}ms`);
    }

    return { user };
  } catch (error) {
    logger.debug('Context creation error:', error);
    return { user: null };
  }
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Auth middleware
const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Admin middleware
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);
export const adminProcedure = t.procedure.use(isAdmin);
