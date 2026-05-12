import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/shared/lib/api-client';
import { getAccessToken } from '@/shared/lib/supabase';
import type { MatchDTO, CreateMatchDTO, TossDecisionDTO } from '@scf/contracts';

export const matchKeys = {
  all: ['matches'] as const,
  live: () => [...matchKeys.all, 'live'] as const,
  byTournament: (id: string) => ['matches', 'tournament', id] as const,
  detail: (id: string) => ['matches', id] as const,
};

export function useLiveMatches() {
  return useQuery({
    queryKey: matchKeys.live(),
    queryFn: () => apiRequest<MatchDTO[]>('/v1/matches'),
    refetchInterval: 15_000,
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateMatchDTO) => {
      const token = await getAccessToken();
      return apiRequest('/v1/matches', { method: 'POST', body: dto, ...(token ? { token } : {}) });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: matchKeys.all }),
  });
}

export function useDecideToss() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, ...dto }: TossDecisionDTO & { matchId: string }) => {
      const token = await getAccessToken();
      return apiRequest(`/v1/matches/${matchId}/toss`, { method: 'POST', body: dto, ...(token ? { token } : {}) });
    },
    onSuccess: (_data, vars) => void qc.invalidateQueries({ queryKey: matchKeys.detail(vars.matchId) }),
  });
}

export function useStartMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      const token = await getAccessToken();
      return apiRequest(`/v1/matches/${matchId}/start`, { method: 'POST', ...(token ? { token } : {}) });
    },
    onSuccess: (_data, matchId) => void qc.invalidateQueries({ queryKey: matchKeys.detail(matchId) }),
  });
}
