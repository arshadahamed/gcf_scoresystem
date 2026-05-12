'use client';
import { useTournaments } from '../api/tournaments.queries';
import { TournamentCard } from './TournamentCard';

export function TournamentsList() {
  const { data, isLoading, error } = useTournaments();
  if (isLoading) return <p className="text-gray-500">Loading tournaments…</p>;
  if (error) return <p className="text-red-500">Failed to load tournaments</p>;
  if (!data?.length) return <p className="text-gray-500">No tournaments yet. Create one!</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map(t => <TournamentCard key={t.id} t={t} />)}
    </div>
  );
}
