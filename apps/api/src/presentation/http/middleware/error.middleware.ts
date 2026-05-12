import type { ErrorRequestHandler } from 'express';
import { pino } from 'pino';

const logger = pino({ name: 'ErrorHandler' });

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({ err, path: req.path }, 'Unhandled error');
  const status = (err as any).status ?? 500;
  res.status(status).json({
    title:   status === 500 ? 'Internal server error' : err.message,
    status,
    type:    err.name ?? 'Error',
  });
};
