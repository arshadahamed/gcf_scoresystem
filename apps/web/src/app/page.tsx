import { fetchTournaments } from '@/features/tournament/lib/fetch';
import { TournamentHero } from '@/features/tournament/components/TournamentHero';

export const revalidate = 60;

export default async function HomePage() {
  let tournaments: Awaited<ReturnType<typeof fetchTournaments>> = [];
  try {
    tournaments = await fetchTournaments();
  } catch {
    // API may be offline during build — render empty state
  }
  const active = tournaments.filter((t) => t.status === 'active');
  const others = tournaments.filter((t) => t.status !== 'active');

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cricket Fiesta</h1>
        <p className="text-gray-500 mt-1">Live school cricket scores — powered by SCF</p>
      </div>

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Active Tournaments
          </h2>
          <div className="space-y-3">
            {active.map((t) => (
              <TournamentHero key={t.id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Past Tournaments
          </h2>
          <div className="space-y-3">
            {others.map((t) => (
              <TournamentHero key={t.id} tournament={t} />
            ))}
          </div>
        </section>
      )}

      {!tournaments.length && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🏏</p>
          <p>No tournaments yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
