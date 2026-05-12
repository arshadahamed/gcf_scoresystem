export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <p className="text-gray-400">Tournament {params.id}</p>
    </div>
  );
}
