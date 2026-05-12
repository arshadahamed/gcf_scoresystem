import { PageHeader } from '@/shared/components/PageHeader';

export default function TournamentsPage() {
  return (
    <div>
      <PageHeader title="Tournaments" description="Manage your cricket tournaments" />
      <div className="p-6"><p className="text-gray-400">Loading tournaments…</p></div>
    </div>
  );
}
