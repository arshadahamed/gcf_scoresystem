'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Sponsor { name: string; tagline?: string; }

const DEFAULT_SPONSORS: Sponsor[] = [
  { name: 'Cricket Academy', tagline: 'Nurturing champions' },
  { name: 'Sports Authority', tagline: 'Official Equipment Partner' },
];

export function SponsorStrip({ sponsors = DEFAULT_SPONSORS }: { sponsors?: Sponsor[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % sponsors.length), 8000);
    return () => clearInterval(t);
  }, [sponsors.length]);

  const sponsor = sponsors[idx];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-14 bg-brand-dark/90 border-t border-brand/50 flex items-center px-6">
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4"
        >
          <span className="text-green-400 text-xs uppercase tracking-widest">Presented by</span>
          <span className="text-white font-broadcast font-bold text-lg uppercase">{sponsor?.name}</span>
          {sponsor?.tagline && <span className="text-green-300 text-sm">{sponsor.tagline}</span>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
