import type { IMatchRepository, IEventBus } from '@scf/application';
import { Match, ok, type Result } from '@scf/domain';
import { randomUUID } from 'crypto';

interface CreateMatchCmd {
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  scheduledAt: string;
  oversPerInnings: number;
}

export class CreateMatchUseCase {
  constructor(
    private readonly matches: IMatchRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(cmd: CreateMatchCmd): Promise<Result<{ id: string }, Error>> {
    const match = Match.create({
      id:              randomUUID(),
      tournamentId:    cmd.tournamentId,
      teamAId:         cmd.teamAId,
      teamBId:         cmd.teamBId,
      oversPerInnings: cmd.oversPerInnings,
      scheduledAt:     new Date(cmd.scheduledAt),
    });
    await this.matches.save(match);
    await this.events.publishAll(match.pullDomainEvents());
    return ok({ id: match.id });
  }
}
