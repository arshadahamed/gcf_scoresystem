import type { Request, Response, NextFunction } from 'express';
import type { CreateMatchUseCase } from '../../../application/use-cases/match/create-match.use-case';
import type { StartMatchUseCase } from '../../../application/use-cases/match/start-match.use-case';
import type { DecideTossUseCase } from '../../../application/use-cases/match/decide-toss.use-case';
import type { IMatchRepository } from '@scf/application';

export class MatchController {
  constructor(
    private readonly createMatch: CreateMatchUseCase,
    private readonly startMatch: StartMatchUseCase,
    private readonly decideToss: DecideTossUseCase,
    private readonly matchRepo: IMatchRepository,
  ) {}

  createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.createMatch.execute(req.body);
    if (result.isErr()) { next(result.error); return; }
    res.status(201).json({ data: result.value });
  };

  tossHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const matchId = req.params['matchId'] as string;
    const result = await this.decideToss.execute({ matchId, ...req.body });
    if (result.isErr()) { next(result.error); return; }
    res.json({ data: { message: 'Toss recorded' } });
  };

  startHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const matchId = req.params['matchId'] as string;
    const result = await this.startMatch.execute({ matchId });
    if (result.isErr()) { next(result.error); return; }
    res.json({ data: { message: 'Match started' } });
  };

  listLiveHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const matches = await this.matchRepo.findLive();
      res.json({ data: matches });
    } catch (e) { next(e); }
  };

  scorecardHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const matchId = req.params['matchId'] as string;
      const innings = await this.matchRepo.findInningsByMatch(matchId);
      res.json({ data: innings });
    } catch (e) { next(e); }
  };
}
