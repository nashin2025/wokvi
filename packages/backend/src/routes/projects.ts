import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getAuthUser } from '../utils/auth';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  mode: z.enum(['MAGIC', 'GUIDED', 'PRO']).default('MAGIC'),
  board: z.enum(['ARDUINO_UNO', 'ARDUINO_NANO', 'ESP32_DEVKIT', 'ESP32_S3', 'RASPBERRY_PI_PICO', 'STM32_NUCLEO', 'CUSTOM']).default('ESP32_DEVKIT'),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

const updateProjectSchema = createProjectSchema.partial();

export async function projectRoutes(app: FastifyInstance) {
  // Get all projects (with pagination)
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = getAuthUser(request);
    const query = z.object({
      page: z.coerce.number().positive().default(1),
      limit: z.coerce.number().positive().max(100).default(20),
      mode: z.enum(['MAGIC', 'GUIDED', 'PRO']).optional(),
      search: z.string().optional(),
    }).parse(request.query);

    const where: any = {
      OR: [
        { ownerId: user.userId },
        { collaborators: { some: { userId: user.userId } } },
      ],
    };

    if (query.mode) where.mode = query.mode;
    if (query.search) {
      where.AND = [
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      app.prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          collaborators: { select: { userId: true, role: true } },
        },
      }),
      app.prisma.project.count({ where }),
    ]);

    return reply.send({
      projects,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  });

  // Create project
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = getAuthUser(request);
    const data = createProjectSchema.parse(request.body);

    const project = await app.prisma.project.create({
      data: {
        ...data,
        ownerId: user.userId,
        simulationConfig: {
          board: data.board,
          frequency: 240_000_000,
          peripherals: [],
          virtualSensors: [],
        },
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    return reply.code(201).send({ project });
  });

  // Get single project
  app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = getAuthUser(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    const project = await app.prisma.project.findFirst({
      where: {
        id,
        OR: [
          { ownerId: user.userId },
          { collaborators: { some: { userId: user.userId } } },
          { isPublic: true },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        collaborators: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    return reply.send({ project });
  });

  // Update project
  app.patch('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = getAuthUser(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const data = updateProjectSchema.parse(request.body);

    // Check ownership
    const project = await app.prisma.project.findFirst({
      where: { id, ownerId: user.userId },
    });

    if (!project) {
      return reply.code(403).send({ error: 'Not authorized to update this project' });
    }

    const updated = await app.prisma.project.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });

    // Create version
    await app.prisma.projectVersion.create({
      data: {
        projectId: id,
        version: (await app.prisma.projectVersion.count({ where: { projectId: id } })) + 1,
        data: updated as any,
        message: 'Auto-save',
      },
    });

    return reply.send({ project: updated });
  });

  // Delete project
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = getAuthUser(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    const project = await app.prisma.project.findFirst({
      where: { id, ownerId: user.userId },
    });

    if (!project) {
      return reply.code(403).send({ error: 'Not authorized to delete this project' });
    }

    await app.prisma.project.delete({ where: { id } });

    return reply.send({ success: true });
  });

  // Fork project
  app.post('/:id/fork', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = getAuthUser(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    const original = await app.prisma.project.findFirst({
      where: {
        id,
        OR: [{ ownerId: user.userId }, { isPublic: true }],
      },
    });

    if (!original) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    const forked = await app.prisma.project.create({
      data: {
        name: `${original.name} (fork)`,
        description: original.description,
        mode: original.mode,
        board: original.board,
        components: original.components,
        wires: original.wires,
        code: original.code,
        simulationConfig: original.simulationConfig,
        isPublic: false,
        tags: [...original.tags, 'fork'],
        ownerId: user.userId,
      },
    });

    return reply.code(201).send({ project: forked });
  });

  // Collaborators
  app.get('/:id/collaborators', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = getAuthUser(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    const project = await app.prisma.project.findFirst({
      where: { id, ownerId: user.userId },
      include: {
        collaborators: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!project) {
      return reply.code(403).send({ error: 'Not authorized' });
    }

    return reply.send({ collaborators: project.collaborators });
  });

  app.post('/:id/collaborators', { preHandler: [app.authenticate] }, async (request, reply) => {
    const authUser = getAuthUser(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const schema = z.object({
      email: z.string().email(),
      role: z.enum(['EDITOR', 'VIEWER']).default('EDITOR'),
    });
    const data = schema.parse(request.body);

    const project = await app.prisma.project.findFirst({
      where: { id, ownerId: authUser.userId },
    });

    if (!project) {
      return reply.code(403).send({ error: 'Not authorized' });
    }

    const collaboratorUser = await app.prisma.user.findUnique({ where: { email: data.email } });
    if (!collaboratorUser) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const collaborator = await app.prisma.collaboration.upsert({
      where: { projectId_userId: { projectId: id, userId: collaboratorUser.id } },
      create: { projectId: id, userId: collaboratorUser.id, role: data.role },
      update: { role: data.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return reply.code(201).send({ collaborator });
  });

  app.delete('/:id/collaborators/:userId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = getAuthUser(request);
    const { id, userId } = z.object({ id: z.string().cuid(), userId: z.string().cuid() }).parse(request.params);

    const project = await app.prisma.project.findFirst({
      where: { id, ownerId: user.userId },
    });

    if (!project) {
      return reply.code(403).send({ error: 'Not authorized' });
    }

    await app.prisma.collaboration.delete({
      where: { projectId_userId: { projectId: id, userId } },
    });

    return reply.send({ success: true });
  });
}