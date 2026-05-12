import type { ITournamentRepository, IEventBus } from '@scf/application';
import { Tournament, ok, type Result } from '@scf/domain';
import { randomUUID } from 'crypto';

interface CreateTournamentCmd {
  name: string;
  season: string;
  format: 'T10' | 'T20' | 'ODI' | 'Custom';
  organizerId: string;
}

export class CreateTournamentUseCase {
  constructor(
    private readonly tournaments: ITournamentRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(cmd: CreateTournamentCmd): Promise<Result<{ id: string }, Error>> {
    const tournament = Tournament.create({ id: randomUUID(), ...cmd });
    await this.tournaments.save(tournament);
    await this.events.publishAll(tournament.pullDomainEvents());
    return ok({ id: tournament.id });
  }
}
