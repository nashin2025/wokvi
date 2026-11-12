import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { projectRoutes } from './projects.js';
import { componentRoutes } from './components.js';
import { classroomRoutes } from './classrooms.js';
import { simulationRoutes } from './simulation.js';
import { aiRoutes } from './ai.js';

export async function registerRoutes(app: FastifyInstance) {
  // API prefix
  await app.register(async function (api) {
    api.register(authRoutes, { prefix: '/auth' });
    api.register(projectRoutes, { prefix: '/projects' });
    api.register(componentRoutes, { prefix: '/components' });
    api.register(classroomRoutes, { prefix: '/classrooms' });
    api.register(simulationRoutes, { prefix: '/simulation' });
    api.register(aiRoutes, { prefix: '/ai' });
  }, { prefix: '/api/v1' });
}