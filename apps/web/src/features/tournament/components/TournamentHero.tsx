import type { TournamentSummary } from '../lib/fetch';
import Link from 'next/link';

export function TournamentHero({ tournament }: { tournament: TournamentSummary }) {
  const isLive = tournament.status === 'active';
  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{tournament.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {tournament.format} · Season {tournament.season}
          </p>
        </div>
        {isLive && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            LIVE
          </span>
        )}
      </div>
    </Link>
  );
}
