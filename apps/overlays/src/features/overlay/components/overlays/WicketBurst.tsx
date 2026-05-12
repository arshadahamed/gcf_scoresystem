'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayDirector } from '../../hooks/useOverlayDirector';
import { BroadcastText } from '../primitives/BroadcastText';

export function WicketBurst({ matchId }: { matchId: string }) {
  const cue = useOverlayDirector(matchId);
  const active = cue?.kind === 'wicket' ? cue : null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {active && (
          <motion.div
            key="wicket"
            initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="bg-gradient-to-br from-red-700 to-red-900 rounded-3xl px-14 py-8 shadow-2xl border-4 border-red-400/50"
          >
            <div className="text-center">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: 3, duration: 0.4 }}>
                <BroadcastText size="6xl" className="text-white block">WICKET!</BroadcastText>
              </motion.div>
              <BroadcastText size="2xl" className="text-red-200 mt-2 block">
                {String(active.data['batsmanName'] ?? '')}
              </BroadcastText>
              <BroadcastText size="xl" className="text-yellow-300 mt-1 block">
                {String(active.data['runs'] ?? 0)}({String(active.data['balls'] ?? 0)}) · {String(active.data['teamScore'] ?? '')}
              </BroadcastText>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
