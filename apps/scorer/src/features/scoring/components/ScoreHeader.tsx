'use client';
import { useInningsStore } from '../stores/innings.store';

export function ScoreHeader() {
  const { totalRuns, totalWickets, oversComplete, legalBalls, maxOvers, striker, bowler } = useInningsStore();
  const oversDisplay = `${oversComplete}.${legalBalls % 6}`;

  return (
    <div className="bg-green-900 text-white p-4">
      <div className="text-center">
        <div className="text-4xl font-bold tracking-tight">
          {totalRuns}/{totalWickets}
        </div>
        <div className="text-green-300 text-lg mt-1">
          {oversDisplay} / {maxOvers} overs
        </div>
      </div>

      <div className="mt-3 flex justify-between text-sm">
        <div>
          <span className="text-green-300">Bat </span>
          <span className="font-semibold">{striker?.name ?? '—'}</span>
          <span className="text-green-300 ml-2">{striker?.runs ?? 0}({striker?.balls ?? 0})</span>
        </div>
        <div>
          <span className="text-green-300">Bowl </span>
          <span className="font-semibold">{bowler?.name ?? '—'}</span>
          <span className="text-green-300 ml-2">{bowler?.overs ?? '0.0'}-{bowler?.runs ?? 0}-{bowler?.wickets ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
