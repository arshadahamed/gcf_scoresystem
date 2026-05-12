import { ResultCard } from '@/features/overlay/components/overlays/ResultCard';
export default async function ResultPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <div className="relative w-[1920px] h-[1080px]"><ResultCard matchId={matchId} /></div>;
}
