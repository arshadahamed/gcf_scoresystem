'use client';
import { useEffect, useState, useRef } from 'react';
import { Channels } from '@scf/contracts';
import type { OverlayCue, BallRecordedPayload } from '@scf/contracts';
import { supabase } from '@/shared/lib/supabase';

const PRIORITY: Record<string, number> = {
  result:        100,
  wicket:        90,
  boundary_six:  80,
  boundary_four: 70,
  over_complete: 50,
  sponsor:       10,
};

export function useOverlayDirector(matchId: string) {
  const [activeCue, setActiveCue] = useState<OverlayCue | null>(null);
  const activeCueRef = useRef<OverlayCue | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCue = useRef((cue: OverlayCue) => {
    const incoming = PRIORITY[cue.kind] ?? 0;
    const current  = activeCueRef.current ? (PRIORITY[activeCueRef.current.kind] ?? 0) : 0;
    if (incoming < current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    activeCueRef.current = cue;
    setActiveCue(cue);
    timerRef.current = setTimeout(() => {
      activeCueRef.current = null;
      setActiveCue(null);
    }, cue.durationMs);
  });

  useEffect(() => {
    const channel = supabase.channel(Channels.match(matchId));

    channel.on('broadcast', { event: 'scoring.ball.recorded' }, ({ payload }) => {
      const p = payload as BallRecordedPayload;
      const ball = p.ball;
      if (ball.wicket) {
        triggerCue.current({ kind: 'wicket', durationMs: 5000, data: {
          batsmanName: p.striker.name,
          runs:        p.striker.runs,
          balls:       p.striker.balls,
          teamScore:   `${p.scoreAfter.runs}/${p.scoreAfter.wickets}`,
          overs:       p.scoreAfter.oversDisplay,
        }});
      } else if (ball.runsOffBat === 6) {
        triggerCue.current({ kind: 'boundary_six', durationMs: 4000, data: {
          batsmanName: p.striker.name,
          runs:        6,
          teamScore:   `${p.scoreAfter.runs}/${p.scoreAfter.wickets}`,
        }});
      } else if (ball.runsOffBat === 4) {
        triggerCue.current({ kind: 'boundary_four', durationMs: 3000, data: {
          batsmanName: p.striker.name,
          runs:        4,
          teamScore:   `${p.scoreAfter.runs}/${p.scoreAfter.wickets}`,
        }});
      }
    });

    channel.on('broadcast', { event: 'scoring.over.completed' }, ({ payload }) => {
      triggerCue.current({ kind: 'over_complete', durationMs: 3000, data: payload as Record<string, unknown> });
    });

    channel.on('broadcast', { event: 'match.ended' }, ({ payload }) => {
      triggerCue.current({ kind: 'result', durationMs: 15000, data: payload as Record<string, unknown> });
    });

    channel.on('broadcast', { event: 'overlay.cue' }, ({ payload }) => {
      const cue = payload as OverlayCue | undefined;
      if (cue?.kind) triggerCue.current(cue);
    });

    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [matchId]);

  return activeCue;
}
