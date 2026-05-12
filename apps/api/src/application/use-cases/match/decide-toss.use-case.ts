import type { IMatchRepository, IEventBus } from '@scf/application';
import { ok, err, type Result } from '@scf/domain';

export class DecideTossUseCase {
  constructor(
    private readonly matches: IMatchRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(cmd: { matchId: string; winnerId: string; decision: 'bat' | 'bowl' }): Promise<Result<void, Error>> {
    const match = await this.matches.findById(cmd.matchId);
    if (!match) return err(new Error(`Match ${cmd.matchId} not found`));
    match.decideToss({ winnerId: cmd.winnerId, decision: cmd.decision });
    await this.matches.save(match);
    await this.events.publishAll(match.pullDomainEvents());
    return ok(undefined);
  }
}
