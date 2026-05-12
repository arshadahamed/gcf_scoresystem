'use client';
import { use } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { useLiveMatches } from '@/features/matches/api/matches.queries';
import { MatchCard } from '@/features/matches/components/MatchCard';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';

export default function MatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: matches, isLoading } = useLiveMatches();

  return (
    <div>
      <PageHeader
        title="Matches"
        action={
          <Link href={`/tournaments/${id}/matches/new`}>
            <Button>Schedule match</Button>
          </Link>
        }
      />
      <div className="p-6">
        {isLoading && <p className="text-gray-400">Loading…</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(matches ?? []).map(m => <MatchCard key={m.id} match={m} tournamentId={id} />)}
        </div>
      </div>
    </div>
  );
}
