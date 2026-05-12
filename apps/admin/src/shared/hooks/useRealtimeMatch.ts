'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { Channels } from '@scf/contracts';
import type { WsEvent } from '@scf/contracts';

export function useRealtimeMatch(matchId: string) {
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);

  useEffect(() => {
    const channel = supabase.channel(Channels.match(matchId));
    channel.on('broadcast', { event: '*' }, ({ event, payload }) => {
      setLastEvent({ type: event, v: 1, payload } as unknown as WsEvent);
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [matchId]);

  return lastEvent;
}
