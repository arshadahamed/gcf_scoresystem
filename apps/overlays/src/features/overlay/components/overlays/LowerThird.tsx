'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useScoreboardSnapshot } from '../../hooks/useScoreboardSnapshot';
import { BroadcastText } from '../primitives/BroadcastText';

export function LowerThird({ matchId }: { matchId: string }) {
  const snap = useScoreboardSnapshot(matchId);
  const { striker, bowler } = snap;

  return (
    <div className="absolute bottom-24 left-8 right-8 pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={`${striker.id}-${bowler.id}`}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex gap-4"
        >
          <div className="bg-brand-dark/90 rounded-xl px-5 py-3 border-l-4 border-obs-green">
            <BroadcastText size="sm" className="text-green-400 block">Batting</BroadcastText>
            <BroadcastText size="xl" className="text-white block">{striker.name}</BroadcastText>
            <BroadcastText size="lg" className="text-yellow-300">
              {striker.runs}({striker.balls}) · SR {striker.strikeRate.toFixed(0)}
            </BroadcastText>
          </div>

          <div className="bg-brand-dark/90 rounded-xl px-5 py-3 border-l-4 border-obs-red">
            <BroadcastText size="sm" className="text-red-400 block">Bowling</BroadcastText>
            <BroadcastText size="xl" className="text-white block">{bowler.name}</BroadcastText>
            <BroadcastText size="lg" className="text-orange-300">
              {bowler.overs}-{bowler.runs}-{bowler.wickets} · Econ {bowler.economy.toFixed(2)}
            </BroadcastText>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
