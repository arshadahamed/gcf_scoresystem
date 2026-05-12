import { BoundaryFlash } from '@/features/overlay/components/overlays/BoundaryFlash';
export default async function BoundaryPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <div className="relative w-[1920px] h-[1080px]"><BoundaryFlash matchId={matchId} /></div>;
}
