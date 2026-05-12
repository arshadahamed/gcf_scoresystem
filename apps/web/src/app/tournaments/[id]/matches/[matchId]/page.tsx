import { notFound } from 'next/navigation';
import { fetchMatch, fetchScorecard } from '@/features/scorecard/lib/fetch';
import { ScoreboardHeader } from '@/features/scorecard/components/ScoreboardHeader';
import { RecentBalls } from '@/features/scorecard/components/RecentBalls';
import { BatterTable } from '@/features/scorecard/components/BatterTable';
import { BowlerTable } from '@/features/scorecard/components/BowlerTable';

export const revalidate = 5;

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { matchId } = await params;

  let match, scorecard;
  try {
    [match, scorecard] = await Promise.all([
      fetchMatch(matchId),
      fetchScorecard(matchId),
    ]);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ScoreboardHeader match={match} innings={scorecard} />
      <RecentBalls matchId={matchId} />
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Batting
      </h2>
      <BatterTable batters={[]} />
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Bowling
      </h2>
      <BowlerTable bowlers={[]} />
    </div>
  );
}
