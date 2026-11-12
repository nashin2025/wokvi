import Fastify from 'fastify';
import { config } from './config.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';

async function main() {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register plugins
  await registerPlugins(app);

  // Register routes
  await registerRoutes(app);

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`🚀 Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();