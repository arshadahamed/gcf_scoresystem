'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase-realtime';
import { Channels } from '@scf/contracts';
import { motion, AnimatePresence } from 'framer-motion';

const ballStyle: Record<string, string> = {
  W: 'bg-red-500 text-white',
  Wd: 'bg-yellow-400 text-black',
  Nb: 'bg-orange-400 text-black',
  '4': 'bg-blue-500 text-white',
  '6': 'bg-purple-600 text-white',
  '·': 'bg-gray-200 text-gray-600',
};

export function RecentBalls({
  matchId,
  initial,
}: {
  matchId: string;
  initial?: string[];
}) {
  const [balls, setBalls] = useState<string[]>(initial ?? []);

  useEffect(() => {
    const ch = supabase.channel(Channels.match(matchId));
    ch
      .on(
        'broadcast',
        { event: 'scoring.ball.recorded' },
        ({ payload }: { payload: unknown }) => {
          const p = payload as Record<string, unknown>;
          const ball = p['ball'] as Record<string, unknown> | undefined;
          const extras = ball?.['extras'] as Record<string, number> | undefined;
          const symbol =
            ball?.['wicket'] != null
              ? 'W'
              : (extras?.['wide'] ?? 0) > 0
              ? 'Wd'
              : (extras?.['noBall'] ?? 0) > 0
              ? 'Nb'
              : ball?.['runsOffBat'] === 0
              ? '·'
              : String(ball?.['runsOffBat'] ?? '·');

          setBalls((prev) => [...prev.slice(-29), symbol]);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [matchId]);

  return (
    <div className="bg-white rounded-xl border p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Ball-by-ball</h3>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {balls.slice(-12).map((b, i) => (
            <motion.span
              key={`${b}-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                ballStyle[b] ?? 'bg-green-100 text-green-800'
              }`}
            >
              {b}
            </motion.span>
          ))}
        </AnimatePresence>
        {balls.length === 0 && (
          <p className="text-gray-400 text-sm">Match has not started yet</p>
        )}
      </div>
    </div>
  );
}
