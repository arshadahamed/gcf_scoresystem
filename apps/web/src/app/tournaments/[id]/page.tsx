import { notFound } from 'next/navigation';
import { fetchTournaments, fetchTournamentMatches } from '@/features/tournament/lib/fetch';
import { FixtureGrid } from '@/features/tournament/components/FixtureGrid';

export const revalidate = 30;

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let tournaments, matches;
  try {
    [tournaments, matches] = await Promise.all([
      fetchTournaments(),
      fetchTournamentMatches(id),
    ]);
  } catch {
    notFound();
  }

  const tournament = tournaments.find((t) => t.id === id);
  if (!tournament) notFound();

  const live = matches.filter((m) => m.status === 'live');
  const rest = matches.filter((m) => m.status !== 'live');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-gray-400 uppercase tracking-wide">
          {tournament.format} · {tournament.season}
        </p>
        <h1 className="text-2xl font-bold mt-1">{tournament.name}</h1>
      </div>

      {live.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Live now</h2>
          <FixtureGrid matches={live} tournamentId={id} />
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">All fixtures</h2>
        <FixtureGrid matches={rest} tournamentId={id} />
      </section>
    </div>
  );
}
