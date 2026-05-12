import { PageHeader } from '@/shared/components/PageHeader';
import { TournamentsList } from '@/features/tournaments/components/TournamentsList';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';

export default function TournamentsPage() {
  return (
    <div>
      <PageHeader
        title="Tournaments"
        description="Manage your cricket tournaments"
        action={
          <Link href="/tournaments/new">
            <Button>New tournament</Button>
          </Link>
        }
      />
      <div className="p-6">
        <TournamentsList />
      </div>
    </div>
  );
}
