import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '../utils/auth';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post('/register', async (request, reply) => {
    const data = registerSchema.parse(request.body);
    
    const existingUser = await app.prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      return reply.code(409).send({ error: 'Email already registered' });
    }
    
    const passwordHash = await bcrypt.hash(data.password, 12);
    
    const user = await app.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    
    const token = app.jwt.sign({ userId: user.id, email: user.email, role: user.role });
    
    return reply.send({ user, token });
  });

  // Login
  app.post('/login', async (request, reply) => {
    const data = loginSchema.parse(request.body);
    
    const user = await app.prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }
    
    const token = app.jwt.sign({ userId: user.id, email: user.email, role: user.role });
    
    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });
  });

  // Get current user
  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const authUser = getAuthUser(request);
    const user = await app.prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, email: true, name: true, role: true, preferences: true, createdAt: true },
    });
    
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    
    return reply.send({ user });
  });

  // Update preferences
  app.patch('/preferences', { preHandler: [app.authenticate] }, async (request, reply) => {
    const authUser = getAuthUser(request);
    const schema = z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      mode: z.enum(['MAGIC', 'GUIDED', 'PRO']).optional(),
      autoSave: z.boolean().optional(),
      showTips: z.boolean().optional(),
      keyboardShortcuts: z.boolean().optional(),
    });
    
    const data = schema.parse(request.body);
    
    const user = await app.prisma.user.update({
      where: { id: authUser.userId },
      data: {
        preferences: {
          ...(authUser.preferences as object),
          ...data,
        },
      },
      select: { id: true, email: true, name: true, role: true, preferences: true },
    });
    
    return reply.send({ user });
  });
}