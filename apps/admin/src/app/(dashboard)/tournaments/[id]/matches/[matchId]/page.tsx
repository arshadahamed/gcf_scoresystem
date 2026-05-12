'use client';
import { use } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { LiveScoreMonitor } from '@/features/matches/components/LiveScoreMonitor';
import { TossForm } from '@/features/matches/components/TossForm';
import { useStartMatch } from '@/features/matches/api/matches.queries';
import { Button } from '@/shared/components/ui/button';

export default function MatchDetailPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { matchId } = use(params);
  const startMatch = useStartMatch();

  return (
    <div>
      <PageHeader title="Match Control" />
      <div className="p-6 space-y-6">
        <TossForm matchId={matchId} />
        <Button
          onClick={() => startMatch.mutate(matchId)}
          disabled={startMatch.isPending}
        >
          {startMatch.isPending ? 'Starting…' : 'Start match'}
        </Button>
        <LiveScoreMonitor matchId={matchId} />
      </div>
    </div>
  );
}
