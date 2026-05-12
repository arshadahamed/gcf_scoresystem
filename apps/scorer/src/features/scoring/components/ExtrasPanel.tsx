'use client';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';

interface Extras { wide: number; noBall: number; bye: number; legBye: number; }

export function ExtrasPanel({ onExtras }: { onExtras: (extras: Extras, runs: number) => void }) {
  const [active, setActive] = useState<string | null>(null);

  const extras: { label: string; key: keyof Extras; runsAdded: number }[] = [
    { label: 'Wide',    key: 'wide',   runsAdded: 1 },
    { label: 'No Ball', key: 'noBall', runsAdded: 1 },
    { label: 'Bye',     key: 'bye',    runsAdded: 0 },
    { label: 'Leg Bye', key: 'legBye', runsAdded: 0 },
  ];

  const handle = (key: keyof Extras, runs: number) => {
    const extra: Extras = { wide: 0, noBall: 0, bye: 0, legBye: 0 };
    extra[key] = 1;
    onExtras(extra, runs);
    setActive(key);
    setTimeout(() => setActive(null), 300);
  };

  return (
    <div className="grid grid-cols-2 gap-2 px-4 pb-3">
      {extras.map(({ label, key, runsAdded }) => (
        <Button key={key} variant="outline"
          className={`h-12 text-sm ${active === key ? 'ring-2 ring-yellow-400' : ''}`}
          onClick={() => handle(key, runsAdded)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
