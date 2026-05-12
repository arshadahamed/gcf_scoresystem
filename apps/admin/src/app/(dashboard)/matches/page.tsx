'use client';
import { PageHeader } from '@/shared/components/PageHeader';
import { useLiveMatches } from '@/features/matches/api/matches.queries';
import { Badge } from '@/shared/components/ui/badge';
import Link from 'next/link';

export default function LiveMatchesPage() {
  const { data: matches, isLoading } = useLiveMatches();
  const live = (matches ?? []).filter(m => m.status === 'live');

  return (
    <div>
      <PageHeader title="Live Matches" description="Currently active matches" />
      <div className="p-6 space-y-3">
        {isLoading && <p className="text-gray-400">Loading…</p>}
        {!isLoading && live.length === 0 && <p className="text-gray-400">No live matches right now.</p>}
        {live.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <Badge className="bg-green-100 text-green-700">LIVE</Badge>
            <span className="text-sm font-medium">{m.teamAId} vs {m.teamBId}</span>
            <Link href={`/tournaments/${m.tournamentId}/matches/${m.id}`}
              className="ml-auto text-sm text-blue-600 hover:underline">Monitor →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
