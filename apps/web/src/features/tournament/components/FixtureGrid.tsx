import Link from 'next/link';
import type { MatchDTO } from '@scf/contracts';

export function FixtureGrid({
  matches,
  tournamentId,
}: {
  matches: MatchDTO[];
  tournamentId: string;
}) {
  if (!matches.length)
    return <p className="text-gray-400 text-sm">No matches scheduled yet.</p>;

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <Link
          key={m.id}
          href={`/tournaments/${tournamentId}/matches/${m.id}`}
          className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-brand transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {m.teamAName} <span className="text-gray-400">vs</span> {m.teamBName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {m.venue ?? 'TBD'} ·{' '}
                {new Date(m.scheduledAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
            {m.status === 'live' && (
              <span className="text-xs font-bold text-green-600 animate-pulse">LIVE</span>
            )}
          </div>
          {m.resultSummary !== null && m.resultSummary !== undefined && (
            <p className="text-xs text-brand mt-2 font-medium">{m.resultSummary}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
