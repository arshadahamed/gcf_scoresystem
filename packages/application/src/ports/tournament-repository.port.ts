import type { Tournament } from '@scf/domain';

export interface ITournamentRepository {
  findById(id: string): Promise<Tournament | null>;
  save(tournament: Tournament): Promise<void>;
  findAll(): Promise<Tournament[]>;
  findByOrganizer(organizerId: string): Promise<Tournament[]>;
}
