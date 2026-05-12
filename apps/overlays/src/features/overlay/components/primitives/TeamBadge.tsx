export function TeamBadge({ name, shortName, isBatting }: { name: string; shortName: string; isBatting: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${isBatting ? 'bg-obs-green text-white' : 'bg-gray-700 text-gray-300'}`}>
      <span className="font-broadcast font-bold text-lg uppercase">{shortName}</span>
      <span className="text-xs opacity-75">{name}</span>
    </div>
  );
}
