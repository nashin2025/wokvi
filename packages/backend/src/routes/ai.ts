import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getAuthUser } from '../utils/auth';
import { createAIProvider } from '../services/ai';

export async function aiRoutes(app: FastifyInstance) {
  const aiProvider = createAIProvider();

  // Generate project from prompt
  app.post('/generate', { preHandler: [app.authenticate] }, async (request, reply) => {
    const schema = z.object({
      prompt: z.string().min(10).max(2000),
      board: z.enum(['ARDUINO_UNO', 'ARDUINO_NANO', 'ESP32_DEVKIT', 'ESP32_S3', 'RASPBERRY_PI_PICO', 'STM32_NUCLEO', 'CUSTOM']).default('ESP32_DEVKIT'),
      constraints: z.array(z.string()).default([]),
    });
    const data = schema.parse(request.body);

    if (!aiProvider) {
      return reply.code(503).send({ 
        error: 'AI service not configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.' 
      });
    }

    try {
      // Get available components from database
      const components = await app.prisma.component.findMany({
        select: { id: true, name: true, category: true, pins: true, metadata: true }
      });

      const componentInfos = components.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        pins: JSON.parse(c.pins) as any[],
        metadata: JSON.parse(c.metadata) as Record<string, unknown>
      }));

      const result = await aiProvider.generateProject(data.prompt, data.board, componentInfos);
      
      // Save project to database
      const user = getAuthUser(request);
      const project = await app.prisma.project.create({
        data: {
          name: result.project.name,
          description: result.project.description,
          mode: 'MAGIC',
          board: result.project.board,
          components: JSON.stringify(result.project.components),
          wires: JSON.stringify(result.project.wires),
          code: result.project.code,
          simulationConfig: JSON.stringify(result.project.simulationConfig),
          ownerId: user.userId,
        },
      });

      return reply.send({
        project: { ...result.project, id: project.id },
        explanation: result.explanation,
        warnings: result.warnings,
        suggestions: result.suggestions,
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ error: 'Failed to generate project' });
    }
  });

  // AI Chat / Debugging assistant
  app.post('/chat', { preHandler: [app.authenticate] }, async (request, reply) => {
    const schema = z.object({
      message: z.string().min(1).max(4000),
      projectId: z.string().cuid().optional(),
      context: z.object({
        schematic: z.any().optional(),
        code: z.string().optional(),
        simulationState: z.any().optional(),
      }).optional(),
    });
    const data = schema.parse(request.body);

    if (!aiProvider) {
      return reply.code(503).send({ 
        error: 'AI service not configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.' 
      });
    }

    try {
      let context: any = data.context;
      
      // Load project context if provided
      if (data.projectId) {
        const project = await app.prisma.project.findFirst({
          where: { id: data.projectId },
        });
        if (project) {
          context = {
            ...context,
            schematic: {
              components: JSON.parse(project.components as string),
              wires: JSON.parse(project.wires as string),
            },
            code: project.code,
            simulationConfig: JSON.parse(project.simulationConfig as string),
          };
        }
      }

      const response = await aiProvider.chat(
        [{ role: 'user', content: data.message }],
        context
      );

      return reply.send({ response });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ error: 'Failed to process chat' });
    }
  });

  // Analyze schematic for issues
  app.post('/analyze/schematic', { preHandler: [app.authenticate] }, async (request, reply) => {
    const schema = z.object({
      components: z.array(z.any()),
      wires: z.array(z.any()),
    });
    const data = schema.parse(request.body);

    if (!aiProvider) {
      return reply.code(503).send({ 
        error: 'AI service not configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.' 
      });
    }

    try {
      const result = await aiProvider.analyzeSchematic(data.components, data.wires);
      return reply.send(result);
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ error: 'Failed to analyze schematic' });
    }
  });

  // Suggest component alternatives
  app.post('/suggest/components', { preHandler: [app.authenticate] }, async (request, reply) => {
    const schema = z.object({
      requirements: z.string(),
      currentComponents: z.array(z.string()).optional(),
      budget: z.number().optional(),
    });
    const data = schema.parse(request.body);

    if (!aiProvider) {
      return reply.code(503).send({ 
        error: 'AI service not configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.' 
      });
    }

    try {
      const suggestions = await aiProvider.suggestComponents(
        data.requirements,
        data.currentComponents || [],
        data.budget
      );
      return reply.send({ suggestions });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ error: 'Failed to suggest components' });
    }
  });
}