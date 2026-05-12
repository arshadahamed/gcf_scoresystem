'use client';
import { useInningsStore } from '../stores/innings.store';

const ballColor: Record<string, string> = {
  'W':  'bg-red-500 text-white',
  'Wd': 'bg-yellow-400 text-black',
  'Nb': 'bg-orange-400 text-black',
  '4':  'bg-blue-500 text-white',
  '6':  'bg-purple-600 text-white',
  '·':  'bg-gray-200 text-gray-700',
};

const defaultColor = 'bg-green-100 text-green-800';

export function CurrentOverDisplay() {
  const { recentBalls, oversComplete } = useInningsStore();
  const thisOverStart = oversComplete * 6;
  const thisOver = recentBalls.slice(thisOverStart);

  return (
    <div className="p-3 bg-white border-b">
      <p className="text-xs text-gray-400 mb-2">Over {oversComplete + 1}</p>
      <div className="flex gap-2 flex-wrap">
        {thisOver.map((b, i) => (
          <span key={i} className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${ballColor[b] ?? defaultColor}`}>
            {b}
          </span>
        ))}
        {Array.from({ length: Math.max(0, 6 - thisOver.length) }).map((_, i) => (
          <span key={`e${i}`} className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200" />
        ))}
      </div>
    </div>
  );
}
