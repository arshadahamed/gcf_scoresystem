import { apiFetch } from '@/shared/lib/api';
import type { MatchDTO } from '@scf/contracts';

export interface TournamentSummary {
  id: string;
  name: string;
  season: string;
  format: string;
  status: string;
}

export async function fetchTournaments(): Promise<TournamentSummary[]> {
  return apiFetch<TournamentSummary[]>('/v1/tournaments', { tags: ['tournaments'] });
}

export async function fetchTournamentMatches(tournamentId: string): Promise<MatchDTO[]> {
  return apiFetch<MatchDTO[]>(`/v1/matches?tournamentId=${tournamentId}`, {
    tags: [`tournament:${tournamentId}:matches`],
  });
}
