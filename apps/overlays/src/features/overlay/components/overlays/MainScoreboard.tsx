'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useScoreboardSnapshot } from '../../hooks/useScoreboardSnapshot';
import { ScoreLine } from '../primitives/ScoreLine';
import { BroadcastText } from '../primitives/BroadcastText';

export function MainScoreboard({ matchId }: { matchId: string }) {
  const snap = useScoreboardSnapshot(matchId);
  const { currentInnings: inn, striker, nonStriker, bowler, teamA, teamB } = snap;
  const battingTeam = inn.battingTeamId === teamA.id ? teamA : teamB;

  return (
    <div className="absolute bottom-16 left-8">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-brand-dark/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-brand/50 min-w-[520px]"
      >
        <div className="bg-brand px-5 py-3 flex items-center justify-between">
          <BroadcastText size="xl">{battingTeam.shortName}</BroadcastText>
          <AnimatePresence mode="wait">
            <motion.div key={`${inn.runs}-${inn.wickets}`}
              initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
              <ScoreLine runs={inn.runs} wickets={inn.wickets} overs={inn.oversDisplay} targetRuns={inn.targetRuns} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-5 py-2 flex gap-6">
          <div>
            <BroadcastText size="sm" className="text-green-300">Bat </BroadcastText>
            <BroadcastText size="md">{striker.name}</BroadcastText>
            <BroadcastText size="sm" className="text-yellow-300"> {striker.runs}({striker.balls})</BroadcastText>
          </div>
          <div className="border-l border-brand pl-4">
            <BroadcastText size="md" className="text-gray-300">{nonStriker.name}</BroadcastText>
            <BroadcastText size="sm" className="text-gray-400"> {nonStriker.runs}({nonStriker.balls})</BroadcastText>
          </div>
        </div>

        <div className="px-5 pb-3 border-t border-brand/30 pt-2">
          <BroadcastText size="sm" className="text-green-300">Bowl </BroadcastText>
          <BroadcastText size="md" className="text-gray-200">{bowler.name}</BroadcastText>
          <BroadcastText size="sm" className="text-gray-400"> {bowler.overs}-{bowler.runs}-{bowler.wickets}</BroadcastText>
        </div>
      </motion.div>
    </div>
  );
}
