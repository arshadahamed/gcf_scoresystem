import 'dotenv/config';
import { pino } from 'pino';
import { buildContainer } from './composition-root';
import { createApp } from './server';
import { config } from './config';

const logger = pino({ name: 'Bootstrap' });

const container = buildContainer();
const { httpServer } = createApp(container);

httpServer.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'API server started');
});
