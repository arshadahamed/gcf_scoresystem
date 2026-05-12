'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayDirector } from '../../hooks/useOverlayDirector';
import { BroadcastText } from '../primitives/BroadcastText';

export function BoundaryFlash({ matchId }: { matchId: string }) {
  const cue = useOverlayDirector(matchId);
  const isFour = cue?.kind === 'boundary_four';
  const isSix  = cue?.kind === 'boundary_six';
  const active = (isFour || isSix) ? cue : null;

  return (
    <div className="absolute top-24 right-12 pointer-events-none">
      <AnimatePresence>
        {active && (
          <motion.div
            key={active.kind}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0, transition: { duration: 0.3 } }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={`rounded-2xl px-8 py-5 border-4 shadow-2xl ${isSix ? 'bg-purple-900 border-purple-400' : 'bg-blue-900 border-blue-400'}`}
          >
            <div className="text-center">
              <motion.div animate={{ rotate: [0, -3, 3, 0] }} transition={{ duration: 0.3, repeat: 2 }}>
                <BroadcastText size="6xl" className={isSix ? 'text-purple-200' : 'text-blue-200'}>
                  {isSix ? 'SIX!' : 'FOUR!'}
                </BroadcastText>
              </motion.div>
              <BroadcastText size="lg" className="text-gray-300 mt-1 block">
                {String(active.data['batsmanName'] ?? '')}
              </BroadcastText>
              <BroadcastText size="sm" className="text-gray-400 block">
                {String(active.data['teamScore'] ?? '')}
              </BroadcastText>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
