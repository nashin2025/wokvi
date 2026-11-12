import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// JWT payload type
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  preferences?: Record<string, unknown>;
}

// Redis client type (real or mock)
type RedisClient = InstanceType<typeof Redis> | { 
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode?: string, ttlMs?: number) => Promise<'OK'>;
  del: (key: string) => Promise<number>;
  quit: () => Promise<'OK'>;
  on: (event: string, listener: (...args: unknown[]) => void) => RedisClient;
};

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: RedisClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: JwtPayload | null;
  }
}

export async function registerPlugins(app: FastifyInstance) {
  // CORS
  await app.register(cors, {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
  });

  // WebSocket support
  await app.register(websocket);

  // JWT
  await app.register(jwt, {
    secret: config.jwt.secret,
    sign: { expiresIn: config.jwt.expiresIn },
  });

  // Prisma
  const prisma = new PrismaClient({
    log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  app.decorate('prisma', prisma);

  // Redis - use mock in development, real Redis in production
  let redis: RedisClient;
  
  if (config.redis.url === 'mock://' || config.nodeEnv === 'development') {
    // Use in-memory mock for development
    const store = new Map<string, { value: string; expiry?: number }>();
    redis = {
      async get(key) {
        const entry = store.get(key);
        if (!entry) return null;
        if (entry.expiry && Date.now() > entry.expiry) {
          store.delete(key);
          return null;
        }
        return entry.value;
      },
      async set(key, value, mode, ttlMs) {
        if (mode === 'NX' && store.has(key)) return null;
        const expiry = ttlMs ? Date.now() + ttlMs : undefined;
        store.set(key, { value, expiry });
        return 'OK';
      },
      async del(key) {
        return store.delete(key) ? 1 : 0;
      },
      async quit() {
        store.clear();
        return 'OK';
      },
      on(event, listener) {
        return this;
      },
    } as RedisClient;
    app.log.info('Using in-memory Redis mock for development');
  } else {
    // Real Redis for production
    const realRedis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });
    redis = realRedis;
    app.log.info('Connected to Redis');
  }
  
  app.decorate('redis', redis);

  // Graceful shutdown
  const close = async () => {
    await prisma.$disconnect();
    await redis.quit();
    await app.close();
  };

  process.on('SIGTERM', close);
  process.on('SIGINT', close);

  // JWT verification hook - runs on every request
  app.addHook('preHandler', async (request) => {
    try {
      const payload = await request.jwtVerify<JwtPayload>();
      request.user = payload;
    } catch {
      // Token invalid or missing - user stays null
      request.user = null;
    }
  });

  // Authenticate hook for protected routes
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify<JwtPayload>();
    } catch {
      return reply.code(401).send({ error: 'Authentication required' });
    }
  });
}