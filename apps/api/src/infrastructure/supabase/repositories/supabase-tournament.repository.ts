import type { SupabaseClient } from '@supabase/supabase-js';
import type { ITournamentRepository } from '@scf/application';
import { Tournament } from '@scf/domain';

export class SupabaseTournamentRepository implements ITournamentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Tournament | null> {
    const { data } = await this.client.from('tournaments').select('*').eq('id', id).single();
    if (!data) return null;
    return this.toTournament(data);
  }

  async save(tournament: Tournament): Promise<void> {
    const { error } = await this.client.from('tournaments').upsert({
      id:           tournament.id,
      name:         tournament.name,
      season:       tournament.season,
      format:       tournament.format,
      status:       tournament.status,
      organizer_id: tournament.organizerId,
    });
    if (error) throw new Error(error.message);
  }

  async findAll(): Promise<Tournament[]> {
    const { data, error } = await this.client
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => this.toTournament(r));
  }

  async findByOrganizer(organizerId: string): Promise<Tournament[]> {
    const { data, error } = await this.client
      .from('tournaments')
      .select('*')
      .eq('organizer_id', organizerId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => this.toTournament(r));
  }

  private toTournament(row: any): Tournament {
    const t = Tournament.create({
      id:          row.id,
      name:        row.name,
      season:      row.season,
      format:      row.format,
      organizerId: row.organizer_id,
    });
    if (row.status && row.status !== 'draft') {
      Object.assign(t, { _status: row.status });
    }
    t.pullDomainEvents();
    return t;
  }
}
