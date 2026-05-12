'use client';
import { useState } from 'react';
import { Channels } from '@scf/contracts';
import type { ScoreboardSnapshot, BallRecordedPayload } from '@scf/contracts';
import { useRealtimeChannel } from './useRealtimeChannel';

const EMPTY_SNAPSHOT: ScoreboardSnapshot = {
  matchId: '',
  tournamentName: '',
  teamA: { id: '', name: '—', shortName: '—' },
  teamB: { id: '', name: '—', shortName: '—' },
  currentInnings: { battingTeamId: '', runs: 0, wickets: 0, oversDisplay: '0.0', targetRuns: null },
  striker:    { id: '', name: '—', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
  nonStriker: { id: '', name: '—', runs: 0, balls: 0 },
  bowler:     { id: '', name: '—', overs: '0.0', runs: 0, wickets: 0, economy: 0 },
  recentOvers: [],
  matchStatus: 'live',
};

export function useScoreboardSnapshot(matchId: string) {
  const [snapshot, setSnapshot] = useState<ScoreboardSnapshot>({ ...EMPTY_SNAPSHOT, matchId });

  const handlers = {
    'scoring.ball.recorded': (payload: unknown) => {
      const p = payload as BallRecordedPayload;
      setSnapshot(prev => ({
        ...prev,
        currentInnings: {
          ...prev.currentInnings,
          runs:         p.scoreAfter.runs,
          wickets:      p.scoreAfter.wickets,
          oversDisplay: p.scoreAfter.oversDisplay,
        },
        striker:    p.striker,
        nonStriker: { id: p.nonStriker.id, name: p.nonStriker.name, runs: p.nonStriker.runs, balls: p.nonStriker.balls },
        bowler:     p.bowler,
      }));
    },
    'match.ended': (_payload: unknown) => {
      setSnapshot(prev => ({ ...prev, matchStatus: 'completed' }));
    },
  };

  useRealtimeChannel(Channels.match(matchId), handlers);

  return snapshot;
}
