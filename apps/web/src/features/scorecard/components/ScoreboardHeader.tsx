import type { InningsDTO, MatchDTO } from '@scf/contracts';

export function ScoreboardHeader({
  match,
  innings,
}: {
  match: MatchDTO;
  innings: InningsDTO[];
}) {
  const current = innings.find((i) => !i.isComplete) ?? innings[innings.length - 1];

  return (
    <div className="bg-green-900 text-white rounded-2xl p-6 mb-6">
      <div className="text-center mb-4">
        <p className="text-green-300 text-sm">
          {match.status === 'live' ? 'LIVE' : match.status.toUpperCase()}
        </p>
        <h1 className="text-2xl font-bold mt-1">
          {match.teamAName} <span className="text-green-300">vs</span> {match.teamBName}
        </h1>
        {match.venue !== null && match.venue !== undefined && (
          <p className="text-green-200 text-sm mt-1">{match.venue}</p>
        )}
      </div>

      {current !== undefined && (
        <div className="bg-green-800 rounded-xl p-4 text-center">
          <div className="text-4xl font-bold">
            {current.totalRuns}/{current.totalWickets}
          </div>
          <div className="text-green-300 text-lg mt-1">{current.oversDisplay}</div>
          {match.resultSummary !== null && match.resultSummary !== undefined && (
            <p className="text-green-200 text-sm mt-2">{match.resultSummary}</p>
          )}
        </div>
      )}
    </div>
  );
}
