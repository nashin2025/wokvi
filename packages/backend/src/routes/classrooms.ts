import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function classroomRoutes(app: FastifyInstance) {
  // Get user's classrooms
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const classrooms = await app.prisma.classroom.findMany({
      where: {
        OR: [
          { teacherId: request.user.userId },
          { students: { some: { userId: request.user.userId } } },
        ],
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        students: { include: { user: { select: { id: true, name: true, email: true } } } },
        assignments: { select: { id: true, title: true, dueDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ classrooms });
  });

  // Create classroom
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'EDUCATOR' && request.user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Only educators can create classrooms' });
    }

    const schema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
    });
    const data = schema.parse(request.body);

    const classroom = await app.prisma.classroom.create({
      data: {
        ...data,
        teacherId: request.user.userId,
      },
      include: { teacher: { select: { id: true, name: true } } },
    });

    return reply.code(201).send({ classroom });
  });

  // Get classroom details
  app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    const classroom = await app.prisma.classroom.findFirst({
      where: {
        id,
        OR: [
          { teacherId: request.user.userId },
          { students: { some: { userId: request.user.userId } } },
        ],
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        students: { include: { user: { select: { id: true, name: true, email: true } } } },
        assignments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!classroom) {
      return reply.code(404).send({ error: 'Classroom not found' });
    }

    return reply.send({ classroom });
  });

  // Join classroom (student)
  app.post('/:id/join', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    const classroom = await app.prisma.classroom.findUnique({ where: { id } });
    if (!classroom) {
      return reply.code(404).send({ error: 'Classroom not found' });
    }

    const existing = await app.prisma.classroomStudent.findUnique({
      where: { classroomId_userId: { classroomId: id, userId: request.user.userId } },
    });

    if (existing) {
      return reply.code(409).send({ error: 'Already enrolled' });
    }

    const enrollment = await app.prisma.classroomStudent.create({
      data: { classroomId: id, userId: request.user.userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return reply.code(201).send({ enrollment });
  });

  // Assignments
  app.get('/:id/assignments', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    const assignments = await app.prisma.assignment.findMany({
      where: { classroomId: id },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ assignments });
  });

  app.post('/:id/assignments', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    const classroom = await app.prisma.classroom.findFirst({
      where: { id, teacherId: request.user.userId },
    });

    if (!classroom) {
      return reply.code(403).send({ error: 'Not authorized' });
    }

    const schema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      starterProjectId: z.string().cuid().optional(),
      expectedBehavior: z.array(z.object({
        id: z.string(),
        description: z.string(),
        checkType: z.enum(['SERIAL_OUTPUT', 'GPIO_STATE', 'VARIABLE_VALUE', 'TIMING']),
        expectedValue: z.unknown(),
        tolerance: z.number().optional(),
      })).default([]),
      dueDate: z.string().datetime().optional(),
      maxScore: z.number().positive().default(100),
    });
    const data = schema.parse(request.body);

    const assignment = await app.prisma.assignment.create({
      data: { ...data, classroomId: id, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
    });

    return reply.code(201).send({ assignment });
  });
}