import type { Request, Response, NextFunction } from 'express';
import type { RecordBallUseCase } from '../../../application/use-cases/scoring/record-ball.use-case';
import type { UndoBallUseCase } from '../../../application/use-cases/scoring/undo-ball.use-case';

export class ScoringController {
  constructor(
    private readonly recordBall: RecordBallUseCase,
    private readonly undoBall: UndoBallUseCase,
  ) {}

  recordBallHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.recordBall.execute({ ...req.body, actorId: req.user.id });
    if (result.isErr()) { next(result.error); return; }
    res.status(202).json({ data: result.value });
  };

  undoBallHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const inningsId = req.params['inningsId'] as string;
    const result = await this.undoBall.execute({ inningsId, actorId: req.user.id });
    if (result.isErr()) { next(result.error); return; }
    res.status(200).json({ data: { message: 'Ball undone' } });
  };
}
