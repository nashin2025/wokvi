import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getAuthUser } from '../utils/auth';

export async function componentRoutes(app: FastifyInstance) {
  // Get all components with filtering
  app.get('/', async (request, reply) => {
    const query = z.object({
      category: z.enum(['MICROCONTROLLER', 'SENSOR', 'ACTUATOR', 'DISPLAY', 'COMMUNICATION', 'POWER', 'PASSIVE', 'OTHER']).optional(),
      search: z.string().optional(),
      board: z.string().optional(),
      page: z.coerce.number().positive().default(1),
      limit: z.coerce.number().positive().max(100).default(50),
    }).parse(request.query);

    const where: any = {};
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { type: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [components, total] = await Promise.all([
      app.prisma.component.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      app.prisma.component.count({ where }),
    ]);

    return reply.send({
      components,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  });

  // Get single component
  app.get('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);

    const component = await app.prisma.component.findUnique({ where: { id } });
    if (!component) {
      return reply.code(404).send({ error: 'Component not found' });
    }

    return reply.send({ component });
  });

  // Create component (admin only)
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = getAuthUser(request);
    if (user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin only' });
    }

    const schema = z.object({
      type: z.string(),
      name: z.string(),
      category: z.enum(['MICROCONTROLLER', 'SENSOR', 'ACTUATOR', 'DISPLAY', 'COMMUNICATION', 'POWER', 'PASSIVE', 'OTHER']),
      pins: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['POWER', 'GROUND', 'GPIO', 'ANALOG', 'PWM', 'I2C', 'SPI', 'UART', 'OTHER']),
        position: z.object({ x: z.number(), y: z.number() }),
      })),
      footprint: z.object({
        type: z.enum(['DIP', 'SOIC', 'QFN', 'BGA', 'THROUGH_HOLE', 'SMD', 'MODULE']),
        width: z.number(),
        height: z.number(),
        pinSpacing: z.number(),
        pins: z.number(),
      }),
      simulationModel: z.object({
        type: z.enum(['BEHAVIORAL', 'SPICE', 'FUNCTIONAL']),
        model: z.string().optional(),
        parameters: z.record(z.unknown()).optional(),
      }).optional(),
      metadata: z.object({
        manufacturer: z.string().optional(),
        partNumber: z.string().optional(),
        description: z.string().optional(),
        datasheetUrl: z.string().url().optional(),
        voltage: z.object({ min: z.number(), max: z.number(), typical: z.number() }).optional(),
        current: z.object({ typical: z.number(), max: z.number() }).optional(),
        price: z.number().optional(),
      }).default({}),
    });

    const data = schema.parse(request.body);
    const component = await app.prisma.component.create({ data });

    return reply.code(201).send({ component });
  });
}