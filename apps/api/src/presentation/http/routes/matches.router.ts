import { Router } from 'express';
import { CreateMatchSchema, TossDecisionSchema } from '@scf/contracts';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import type { MatchController } from '../controllers/match.controller';

export function createMatchesRouter(ctrl: MatchController): Router {
  const router = Router();
  router.get('/', ctrl.listLiveHandler);
  router.post('/', authenticate, requireRole('organizer'), validateBody(CreateMatchSchema), ctrl.createHandler);
  router.post('/:matchId/toss', authenticate, requireRole('organizer'), validateBody(TossDecisionSchema), ctrl.tossHandler);
  router.post('/:matchId/start', authenticate, requireRole('organizer'), ctrl.startHandler);
  router.get('/:matchId/scorecard', ctrl.scorecardHandler);
  return router;
}
