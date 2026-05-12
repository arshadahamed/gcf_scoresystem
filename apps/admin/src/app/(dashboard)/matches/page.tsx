import { PageHeader } from '@/shared/components/PageHeader';

export default function MatchesPage() {
  return (
    <div>
      <PageHeader title="Live Matches" />
      <div className="p-6"><p className="text-gray-400">No live matches.</p></div>
    </div>
  );
}
