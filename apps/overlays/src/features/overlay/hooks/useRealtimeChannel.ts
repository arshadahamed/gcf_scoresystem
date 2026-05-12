'use client';
import { useEffect, useRef } from 'react';
import { supabase } from '@/shared/lib/supabase';

export function useRealtimeChannel(
  channelName: string,
  eventHandlers: Record<string, (payload: unknown) => void>,
) {
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    const channel = supabase.channel(channelName);
    Object.keys(handlersRef.current).forEach((event) => {
      channel.on('broadcast', { event }, ({ payload }) => {
        handlersRef.current[event]?.(payload);
      });
    });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [channelName]);
}
