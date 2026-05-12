import type { Request, Response, NextFunction } from 'express';
import type { CreateTournamentUseCase } from '../../../application/use-cases/tournament/create-tournament.use-case';
import type { ITournamentRepository } from '@scf/application';

export class TournamentController {
  constructor(
    private readonly create: CreateTournamentUseCase,
    private readonly repo: ITournamentRepository,
  ) {}

  createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.create.execute({ ...req.body, organizerId: req.user.id });
    if (result.isErr()) { next(result.error); return; }
    res.status(201).json({ data: result.value });
  };

  listHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tournaments = await this.repo.findAll();
      res.json({ data: tournaments });
    } catch (e) { next(e); }
  };
}
