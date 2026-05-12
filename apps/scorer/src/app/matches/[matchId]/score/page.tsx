'use client';
import { use, useEffect } from 'react';
import { ScorePad } from '@/features/scoring/components/ScorePad';
import { useInningsStore } from '@/features/scoring/stores/innings.store';

export default function ScorePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const init = useInningsStore(s => s.init);
  const setStriker    = useInningsStore(s => s.setStriker);
  const setNonStriker = useInningsStore(s => s.setNonStriker);
  const setBowler     = useInningsStore(s => s.setBowler);

  useEffect(() => {
    init({ inningsId: `innings-${matchId}`, matchId, maxOvers: 20, seq: 0 });
    setStriker({ id: 'p1', name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0 });
    setNonStriker({ id: 'p2', name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0 });
    setBowler({ id: 'b1', name: 'Bowler', overs: '0.0', runs: 0, wickets: 0 });
  }, [matchId, init, setStriker, setNonStriker, setBowler]);

  return <ScorePad />;
}
