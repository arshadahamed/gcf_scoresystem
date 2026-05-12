import { Router } from 'express';
import { RecordBallSchema } from '@scf/contracts';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { scoreLimiter } from '../middleware/rate-limit.middleware';
import type { ScoringController } from '../controllers/scoring.controller';

export function createScoringRouter(ctrl: ScoringController): Router {
  const router = Router();
  router.use(authenticate);
  router.use(requireRole('scorer'));

  router.post('/balls',
    scoreLimiter,
    validateBody(RecordBallSchema),
    ctrl.recordBallHandler,
  );

  router.delete('/innings/:inningsId/balls/last',
    ctrl.undoBallHandler,
  );

  return router;
}
