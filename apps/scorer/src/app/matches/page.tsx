import { MatchList } from '@/features/match-setup/components/MatchList';

export default function MatchesPage() {
  return (
    <div className="max-w-sm mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Scorer Dashboard</h1>
        <p className="text-sm text-gray-500">Select a live match to score</p>
      </div>
      <MatchList />
    </div>
  );
}
