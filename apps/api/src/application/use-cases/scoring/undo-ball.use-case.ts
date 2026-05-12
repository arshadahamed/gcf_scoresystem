import type { IMatchRepository, IEventBus, IUnitOfWork } from '@scf/application';
import { ok, err, type Result } from '@scf/domain';

export class UndoBallUseCase {
  constructor(
    private readonly matches: IMatchRepository,
    private readonly events: IEventBus,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(cmd: { inningsId: string; actorId: string }): Promise<Result<void, Error>> {
    return this.uow.run(async () => {
      const innings = await this.matches.loadInnings(cmd.inningsId);
      if (!innings) return err(new Error(`Innings ${cmd.inningsId} not found`));

      // Capture seq of ball that will be undone (currentSeq - 1 after undo, so capture before)
      const seqToVoid = innings.currentSeq - 1;

      const result = innings.undoLastBall({ actorId: cmd.actorId });
      if (result.isErr()) return err(result.error);

      // Void the ball_event record in DB (append-only log — mark as voided)
      if (seqToVoid >= 0) {
        await this.matches.voidBallEvent(cmd.inningsId, seqToVoid, cmd.actorId);
      }

      await this.matches.saveInnings(innings);
      await this.events.publishAll(innings.pullDomainEvents());
      return ok(undefined);
    });
  }
}
