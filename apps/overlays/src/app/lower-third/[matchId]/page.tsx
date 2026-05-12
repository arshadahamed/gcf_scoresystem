import { LowerThird } from '@/features/overlay/components/overlays/LowerThird';
export default async function LowerThirdPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <div className="relative w-[1920px] h-[1080px]"><LowerThird matchId={matchId} /></div>;
}
