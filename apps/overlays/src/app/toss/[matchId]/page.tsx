import { TossCard } from '@/features/overlay/components/overlays/TossCard';
export default async function TossPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <div className="relative w-[1920px] h-[1080px]"><TossCard matchId={matchId} /></div>;
}
