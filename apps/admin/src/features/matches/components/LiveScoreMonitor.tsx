'use client';
import { useRealtimeMatch } from '@/shared/hooks/useRealtimeMatch';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function LiveScoreMonitor({ matchId }: { matchId: string }) {
  const event = useRealtimeMatch(matchId);

  return (
    <Card>
      <CardHeader><CardTitle>Live Score Feed</CardTitle></CardHeader>
      <CardContent>
        {event ? (
          <div className="font-mono text-sm bg-gray-50 p-3 rounded">
            <p className="font-semibold">{event.type}</p>
            <pre className="text-xs mt-1 overflow-auto">{JSON.stringify(event.payload, null, 2)}</pre>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Waiting for live events…</p>
        )}
      </CardContent>
    </Card>
  );
}
