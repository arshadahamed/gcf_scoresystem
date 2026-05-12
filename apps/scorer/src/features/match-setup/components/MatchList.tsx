'use client';
import Link from 'next/link';
import { useLiveMatches } from '../api/match-setup.queries';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

export function MatchList() {
  const { data, isLoading } = useLiveMatches();

  if (isLoading) return <p className="text-gray-400 text-center py-8">Loading matches…</p>;
  if (!data?.length) return <p className="text-gray-400 text-center py-8">No live matches. Check with your admin.</p>;

  return (
    <div className="space-y-3">
      {data.map(m => (
        <Link key={m.id} href={`/matches/${m.id}/score`}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{m.teamAName} vs {m.teamBName}</p>
                <p className="text-sm text-gray-500">{m.venue ?? 'TBD'}</p>
              </div>
              <Badge className="bg-green-100 text-green-700">{m.status}</Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
