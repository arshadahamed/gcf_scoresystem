'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayDirector } from '../../hooks/useOverlayDirector';
import { BroadcastText } from '../primitives/BroadcastText';

export function ResultCard({ matchId }: { matchId: string }) {
  const cue = useOverlayDirector(matchId);
  const active = cue?.kind === 'result' ? cue : null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {active && (
          <motion.div
            key="result"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            className="bg-gradient-to-br from-brand-dark to-brand rounded-3xl px-16 py-10 shadow-2xl border-2 border-green-400/30 text-center min-w-[700px]"
          >
            <BroadcastText size="xl" className="text-green-300 block mb-2">Match Result</BroadcastText>
            <BroadcastText size="4xl" className="text-white block">
              {String(active.data['resultSummary'] ?? 'Match Complete')}
            </BroadcastText>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
