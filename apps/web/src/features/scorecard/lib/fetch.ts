import { apiFetch } from '@/shared/lib/api';
import type { InningsDTO, MatchDTO } from '@scf/contracts';

export async function fetchMatch(matchId: string): Promise<MatchDTO> {
  return apiFetch<MatchDTO>(`/v1/matches/${matchId}`, { tags: [`match:${matchId}`] });
}

export async function fetchScorecard(matchId: string): Promise<InningsDTO[]> {
  return apiFetch<InningsDTO[]>(`/v1/matches/${matchId}/scorecard`, {
    tags: [`match:${matchId}:scorecard`],
  });
}
