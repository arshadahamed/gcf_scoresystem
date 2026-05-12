import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import type { TournamentDTO } from '@scf/contracts';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function TournamentCard({ t }: { t: TournamentDTO }) {
  return (
    <Link href={`/tournaments/${t.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{t.name}</CardTitle>
            <Badge className={statusColors[t.status] ?? ''}>{t.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          <p>{t.format} · {t.season}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
