import { MainScoreboard } from '@/features/overlay/components/overlays/MainScoreboard';

export default async function MainOverlayPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return (
    <div className="relative w-[1920px] h-[1080px]">
      <MainScoreboard matchId={matchId} />
    </div>
  );
}
