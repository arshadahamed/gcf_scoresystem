import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/lib/api-client';
import type { MatchDTO } from '@scf/contracts';

export function useLiveMatches() {
  return useQuery({
    queryKey: ['matches', 'live'],
    queryFn: () => apiRequest<MatchDTO[]>('/v1/matches?status=live'),
    refetchInterval: 10_000,
  });
}
