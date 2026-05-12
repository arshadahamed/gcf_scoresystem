import type { IMatchRepository, IEventBus, IUnitOfWork } from '@scf/application';
import { ok, err, type Result } from '@scf/domain';
import type { ScoringError } from '@scf/domain';

interface RecordBallCommand {
  inningsId: string;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  extras: { wide?: number; noBall?: number; bye?: number; legBye?: number };
  wicket: { kind: string; dismissedPlayerId: string; fielderId: string | null; bowlerId: string | null } | null;
  expectedSeq: number;
  actorId: string;
}

interface BallResult {
  id: string;
  seq: number;
  runsOffBat: number;
  extras: { wide: number; noBall: number; bye: number; legBye: number };
  isWicket: boolean;
}

type AppError = ScoringError | Error;

export class RecordBallUseCase {
  constructor(
    private readonly matches: IMatchRepository,
    private readonly events: IEventBus,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(cmd: RecordBallCommand): Promise<Result<BallResult, AppError>> {
    return this.uow.run(async () => {
      const innings = await this.matches.loadInnings(cmd.inningsId);
      if (!innings) return err(new Error(`Innings ${cmd.inningsId} not found`));

      const result = innings.recordBall({
        strikerId:    cmd.strikerId,
        nonStrikerId: cmd.nonStrikerId,
        bowlerId:     cmd.bowlerId,
        runs:         cmd.runs,
        extras:       cmd.extras,
        wicket:       cmd.wicket,
        expectedSeq:  cmd.expectedSeq,
      });

      if (result.isErr()) return err(result.error);

      await this.matches.saveInnings(innings);

      // result.value is BallRecordedEvent which has a .ball property
      const ball = result.value.ball;
      await this.matches.persistBallEvent({
        id:           ball.id,
        inningsId:    cmd.inningsId,
        seq:          ball.seq,
        overNumber:   ball.overNumber,
        ballInOver:   ball.ballInOver,
        strikerId:    cmd.strikerId,
        nonStrikerId: cmd.nonStrikerId,
        bowlerId:     cmd.bowlerId,
        runsOffBat:   ball.runsOffBat,
        extras:       ball.extras,
        wicket:       cmd.wicket,
        recordedBy:   cmd.actorId,
      });

      await this.events.publishAll(innings.pullDomainEvents());

      return ok({
        id:         ball.id,
        seq:        ball.seq,
        runsOffBat: ball.runsOffBat,
        extras:     ball.extras,
        isWicket:   ball.isWicket,
      });
    });
  }
}
