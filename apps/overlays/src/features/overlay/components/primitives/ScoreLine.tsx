import { BroadcastText } from './BroadcastText';

export function ScoreLine({ runs, wickets, overs, targetRuns }: {
  runs: number; wickets: number; overs: string; targetRuns?: number | null;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <BroadcastText size="4xl">{runs}/{wickets}</BroadcastText>
      <BroadcastText size="lg" weight="semibold" className="text-green-300">{overs} ov</BroadcastText>
      {targetRuns != null && (
        <BroadcastText size="sm" className="text-yellow-300">
          Target: {targetRuns} · Need {targetRuns - runs}
        </BroadcastText>
      )}
    </div>
  );
}
