'use client';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

const runs = [0, 1, 2, 3, 4, 5, 6, 7];

const runStyle = (r: number) => {
  if (r === 4) return 'bg-blue-500 text-white border-blue-600 text-xl';
  if (r === 6) return 'bg-purple-600 text-white border-purple-700 text-xl';
  return 'bg-white text-gray-800 border-gray-300';
};

export function RunButtons({ onRun }: { onRun: (runs: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {runs.map((r) => (
        <motion.button
          key={r}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRun(r)}
          className={cn(
            'h-16 rounded-xl border-2 font-bold text-2xl transition-colors',
            runStyle(r),
          )}
        >
          {r}
        </motion.button>
      ))}
    </div>
  );
}
