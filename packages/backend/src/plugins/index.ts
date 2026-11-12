import { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
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

  // Redis
  const redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  app.decorate('redis', redis);

  // Graceful shutdown
  const close = async () => {
    await prisma.$disconnect();
    await redis.quit();
    await app.close();
  };

  process.on('SIGTERM', close);
  process.on('SIGINT', close);

  // Auth decorator
  app.decorateRequest('user', null);
  app.addHook('preHandler', async (request) => {
    try {
      await request.jwtVerify();
    } catch {
      // Token invalid or missing - user stays null
    }
  });
}