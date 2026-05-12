'use client';
import { useState } from 'react';
import { useDecideToss } from '../api/matches.queries';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function TossForm({ matchId }: { matchId: string }) {
  const [winnerId, setWinnerId] = useState('');
  const [decision, setDecision] = useState<'bat' | 'bowl'>('bat');
  const mutation = useDecideToss();

  return (
    <Card>
      <CardHeader><CardTitle>Toss</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Toss winner (Team ID)</Label>
          <Input value={winnerId} onChange={e => setWinnerId(e.target.value)} placeholder="Team UUID" />
        </div>
        <div>
          <Label>Decision</Label>
          <Select value={decision} onValueChange={v => setDecision(v as 'bat' | 'bowl')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bat">Bat first</SelectItem>
              <SelectItem value="bowl">Bowl first</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => mutation.mutate({ matchId, winnerId, decision })}
          disabled={mutation.isPending || !winnerId}
        >
          Record toss
        </Button>
      </CardContent>
    </Card>
  );
}
