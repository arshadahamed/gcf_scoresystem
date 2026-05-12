import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';
import type { MatchDTO } from '@scf/contracts';

const statusBadge: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-700',
  live: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  abandoned: 'bg-red-100 text-red-700',
};

export function MatchCard({ match, tournamentId }: { match: MatchDTO; tournamentId: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">
            {match.teamAId} vs {match.teamBId}
          </span>
          <Badge className={statusBadge[match.status] ?? ''}>{match.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-gray-500 space-y-1">
        <p>{match.venue ?? 'TBD'} · {new Date(match.scheduledAt).toLocaleDateString()}</p>
        <p>{match.oversPerInnings} overs</p>
        <Link href={`/tournaments/${tournamentId}/matches/${match.id}`}>
          <Button variant="outline" size="sm" className="mt-2">Manage</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
