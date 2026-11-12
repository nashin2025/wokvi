import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function simulationRoutes(app: FastifyInstance) {
  // Start simulation session
  app.post('/sessions', { preHandler: [app.authenticate] }, async (request, reply) => {
    const schema = z.object({
      projectId: z.string().cuid(),
      config: z.object({
        board: z.string(),
        frequency: z.number().positive(),
        peripherals: z.array(z.any()),
        virtualSensors: z.array(z.any()),
      }),
    });
    const data = schema.parse(request.body);

    // Verify project access
    const project = await app.prisma.project.findFirst({
      where: {
        id: data.projectId,
        OR: [
          { ownerId: request.user.userId },
          { collaborators: { some: { userId: request.user.userId } } },
        ],
      },
    });

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    const session = await app.prisma.simulationSession.create({
      data: {
        projectId: data.projectId,
        userId: request.user.userId,
        status: 'RUNNING',
        config: data.config,
      },
    });

    // TODO: Start WASM simulation worker
    // This would connect to a simulation worker service

    return reply.code(201).send({ session });
  });

  // Get simulation session
  app.get('/sessions/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    const session = await app.prisma.simulationSession.findFirst({
      where: {
        id,
        userId: request.user.userId,
      },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Session not found' });
    }

    return reply.send({ session });
  });

  // Update simulation session (logs, status)
  app.patch('/sessions/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const schema = z.object({
      status: z.enum(['STOPPED', 'RUNNING', 'PAUSED', 'ERROR', 'COMPLETED']).optional(),
      logs: z.array(z.any()).optional(),
    });
    const data = schema.parse(request.body);

    const session = await app.prisma.simulationSession.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!session) {
      return reply.code(404).send({ error: 'Session not found' });
    }

    const updated = await app.prisma.simulationSession.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });

    return reply.send({ session: updated });
  });

  // WebSocket for real-time simulation
  app.get('/ws', { websocket: true }, (connection, request) => {
    connection.socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle simulation commands
        handleSimulationMessage(connection, data);
      } catch (err) {
        connection.socket.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    connection.socket.on('close', () => {
      // Cleanup
    });
  });

  function handleSimulationMessage(connection: any, data: any) {
    switch (data.type) {
      case 'START':
        // Start simulation
        connection.socket.send(JSON.stringify({ type: 'STARTED', sessionId: data.sessionId }));
        break;
      case 'STEP':
        // Single step
        connection.socket.send(JSON.stringify({ type: 'STEPPED', state: {} }));
        break;
      case 'PAUSE':
        connection.socket.send(JSON.stringify({ type: 'PAUSED' }));
        break;
      case 'RESUME':
        connection.socket.send(JSON.stringify({ type: 'RESUMED' }));
        break;
      case 'STOP':
        connection.socket.send(JSON.stringify({ type: 'STOPPED' }));
        break;
      default:
        connection.socket.send(JSON.stringify({ error: 'Unknown command' }));
    }
  }
}