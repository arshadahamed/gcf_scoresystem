import type { IMatchRepository, IEventBus } from '@scf/application';
import { ok, err, type Result } from '@scf/domain';

export class StartMatchUseCase {
  constructor(
    private readonly matches: IMatchRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(cmd: { matchId: string }): Promise<Result<void, Error>> {
    const match = await this.matches.findById(cmd.matchId);
    if (!match) return err(new Error(`Match ${cmd.matchId} not found`));
    const result = match.start();
    if (result.isErr()) return err(result.error);
    await this.matches.save(match);
    await this.events.publishAll(match.pullDomainEvents());
    return ok(undefined);
  }
}
