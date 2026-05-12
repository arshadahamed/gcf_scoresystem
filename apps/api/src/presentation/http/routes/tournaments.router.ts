import { Router } from 'express';
import { CreateTournamentSchema } from '@scf/contracts';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import type { TournamentController } from '../controllers/tournament.controller';

export function createTournamentsRouter(ctrl: TournamentController): Router {
  const router = Router();
  router.get('/', ctrl.listHandler);
  router.post('/', authenticate, requireRole('organizer'), validateBody(CreateTournamentSchema), ctrl.createHandler);
  return router;
}
