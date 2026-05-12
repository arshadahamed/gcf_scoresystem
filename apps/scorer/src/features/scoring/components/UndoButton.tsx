'use client';
import { motion } from 'framer-motion';
import { Undo2 } from 'lucide-react';

export function UndoButton({ onUndo }: { onUndo: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }}
      onClick={onUndo}
      className="flex items-center gap-2 bg-orange-100 text-orange-700 border border-orange-300 px-4 py-2 rounded-xl font-semibold text-sm"
    >
      <Undo2 size={16} /> Undo last ball
    </motion.button>
  );
}
