import { PageHeader } from '@/shared/components/PageHeader';
import { CreateTournamentForm } from '@/features/tournaments/components/CreateTournamentForm';

export default function NewTournamentPage() {
  return (
    <div>
      <PageHeader title="New Tournament" description="Create a new cricket tournament" />
      <div className="p-6"><CreateTournamentForm /></div>
    </div>
  );
}
