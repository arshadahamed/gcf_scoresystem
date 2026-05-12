import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import type { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { pino } from 'pino';
import { config } from './config';
import { apiLimiter } from './presentation/http/middleware/rate-limit.middleware';
import { errorHandler } from './presentation/http/middleware/error.middleware';
import type { Express, Request, Response } from 'express';
import type { AppContainer } from './composition-root';

const logger = pino({ name: 'Server' });

export function createApp(container: AppContainer): { app: Express; httpServer: HttpServer; io: SocketServer } {
  const app = express();
  const httpServer = createServer(app);

  const origins = config.CORS_ORIGINS.split(',').map(o => o.trim());

  app.use(helmet());
  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: '50kb' }));
  app.use(apiLimiter);

  app.get('/health', (_req: Request, res: Response) => res.json({ ok: true, ts: new Date().toISOString() }));

  app.use('/v1/tournaments', container.routers.tournaments);
  app.use('/v1/matches',     container.routers.matches);
  app.use('/v1/scoring',     container.routers.scoring);

  app.use(errorHandler);

  const io = new SocketServer(httpServer, {
    cors: { origin: origins },
    transports: ['websocket'],
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');
    socket.on('match:join', ({ matchId }: { matchId: string }) => {
      void socket.join(`match:${matchId}`);
      logger.info({ socketId: socket.id, matchId }, 'Joined match room');
    });
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
    });
  });

  return { app, httpServer, io };
}
