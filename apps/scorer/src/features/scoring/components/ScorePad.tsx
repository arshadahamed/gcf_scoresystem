'use client';
import { useState } from 'react';
import { ScoreHeader } from './ScoreHeader';
import { CurrentOverDisplay } from './CurrentOverDisplay';
import { RunButtons } from './RunButtons';
import { ExtrasPanel } from './ExtrasPanel';
import { WicketModal } from './WicketModal';
import { UndoButton } from './UndoButton';
import { useBallSubmit } from '../hooks/useBallSubmit';
import { useInningsStore } from '../stores/innings.store';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';
import type { WicketDTO, ExtrasDTO } from '@scf/contracts';

export function ScorePad() {
  const store = useInningsStore();
  const { submitBall, undoBall } = useBallSubmit();
  const online = useOnlineStatus();
  const [wicketOpen, setWicketOpen] = useState(false);
  const [pendingRuns, setPendingRuns] = useState(0);

  const baseExtras: ExtrasDTO = { wide: 0, noBall: 0, bye: 0, legBye: 0 };

  const handleRun = async (runs: number) => {
    if (!store.striker || !store.nonStriker || !store.bowler) return;
    await submitBall({
      strikerId:    store.striker.id,
      nonStrikerId: store.nonStriker.id,
      bowlerId:     store.bowler.id,
      runs,
      extras:       baseExtras,
      wicket:       null,
    });
  };

  const handleExtras = async (extras: ExtrasDTO, runs: number) => {
    if (!store.striker || !store.nonStriker || !store.bowler) return;
    await submitBall({
      strikerId:    store.striker.id,
      nonStrikerId: store.nonStriker.id,
      bowlerId:     store.bowler.id,
      runs,
      extras,
      wicket:       null,
    });
  };

  const handleWicketTrigger = (runs: number) => {
    setPendingRuns(runs);
    setWicketOpen(true);
  };

  const handleWicketConfirm = async (wicket: WicketDTO) => {
    if (!store.striker || !store.nonStriker || !store.bowler) return;
    setWicketOpen(false);
    await submitBall({
      strikerId:    store.striker.id,
      nonStrikerId: store.nonStriker.id,
      bowlerId:     store.bowler.id,
      runs:         pendingRuns,
      extras:       baseExtras,
      wicket,
    });
  };

  if (store.isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-green-900 text-white gap-4">
        <h2 className="text-3xl font-bold">Innings Complete</h2>
        <p className="text-green-300 text-xl">{store.totalRuns}/{store.totalWickets}</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto h-screen flex flex-col bg-gray-50">
      <div className={`flex items-center gap-1 px-3 py-1 text-xs ${online ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {online ? <Wifi size={12} /> : <WifiOff size={12} />}
        {online ? 'Live' : 'Offline — balls queued'}
      </div>

      <ScoreHeader />
      <CurrentOverDisplay />

      <div className="flex-1 overflow-auto">
        <RunButtons onRun={handleRun} />
        <ExtrasPanel onExtras={handleExtras} />

        <div className="px-4 pb-4 flex items-center justify-between">
          <button
            onClick={() => handleWicketTrigger(0)}
            className="h-12 px-6 rounded-xl bg-red-600 text-white font-bold text-lg"
          >
            WICKET
          </button>
          <UndoButton onUndo={undoBall} />
        </div>
      </div>

      <WicketModal
        open={wicketOpen}
        onClose={() => setWicketOpen(false)}
        onConfirm={handleWicketConfirm}
        strikerId={store.striker?.id ?? ''}
        bowlerId={store.bowler?.id ?? ''}
      />
    </div>
  );
}
