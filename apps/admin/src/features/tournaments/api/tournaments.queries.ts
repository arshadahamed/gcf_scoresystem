import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/shared/lib/api-client';
import { getAccessToken } from '@/shared/lib/supabase';
import type { TournamentDTO, CreateTournamentDTO } from '@scf/contracts';

export const tournamentKeys = {
  all: ['tournaments'] as const,
  list: () => [...tournamentKeys.all, 'list'] as const,
};

export function useTournaments() {
  return useQuery({
    queryKey: tournamentKeys.list(),
    queryFn: () => apiRequest<TournamentDTO[]>('/v1/tournaments'),
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateTournamentDTO) => {
      const token = await getAccessToken();
      return apiRequest('/v1/tournaments', { method: 'POST', body: dto, ...(token ? { token } : {}) });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: tournamentKeys.all }),
  });
}
