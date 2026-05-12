import { WicketBurst } from '@/features/overlay/components/overlays/WicketBurst';
export default async function WicketPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <div className="relative w-[1920px] h-[1080px]"><WicketBurst matchId={matchId} /></div>;
}
