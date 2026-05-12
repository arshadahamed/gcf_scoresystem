'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Channels } from '@scf/contracts';
import { useRealtimeChannel } from '../../hooks/useRealtimeChannel';
import { BroadcastText } from '../primitives/BroadcastText';

interface TossData { winnerName: string; decision: string; }

export function TossCard({ matchId }: { matchId: string }) {
  const [toss, setToss] = useState<TossData | null>(null);

  useRealtimeChannel(Channels.match(matchId), {
    'match.toss.decided': (payload: unknown) => {
      const p = payload as Record<string, unknown>;
      const winnerName = String(p['winnerName'] ?? '');
      const decision   = String(p['decision'] ?? '');
      if (winnerName) {
        setToss({ winnerName, decision });
        setTimeout(() => setToss(null), 8000);
      }
    },
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {toss && (
          <motion.div
            key="toss"
            initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-brand-dark rounded-3xl px-14 py-8 border-2 border-green-400/40 text-center"
          >
            <BroadcastText size="lg" className="text-green-300 block mb-1">Toss</BroadcastText>
            <BroadcastText size="4xl" className="text-white block">{toss.winnerName} won the toss</BroadcastText>
            <BroadcastText size="2xl" className="text-yellow-300 mt-2 block">Elected to {toss.decision}</BroadcastText>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
