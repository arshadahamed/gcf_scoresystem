interface BatterRow {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissal?: string;
}

export function BatterTable({ batters }: { batters: BatterRow[] }) {
  if (!batters.length)
    return <p className="text-gray-400 text-sm py-2">Batting stats not yet available</p>;

  return (
    <div className="bg-white rounded-xl border overflow-hidden mb-4">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs">
          <tr>
            <th className="text-left px-4 py-2">Batter</th>
            <th className="px-3 py-2">R</th>
            <th className="px-3 py-2">B</th>
            <th className="px-3 py-2">4s</th>
            <th className="px-3 py-2">6s</th>
            <th className="px-3 py-2">SR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {batters.map((b, i) => (
            <tr key={i} className={!b.isOut ? 'bg-green-50' : ''}>
              <td className="px-4 py-3">
                <span
                  className={b.isOut ? 'text-gray-500' : 'font-semibold text-gray-900'}
                >
                  {b.name}
                </span>
                {!b.isOut && (
                  <span className="ml-1 text-green-600 text-xs">*</span>
                )}
                {b.dismissal !== undefined && (
                  <p className="text-xs text-gray-400">{b.dismissal}</p>
                )}
              </td>
              <td className="text-center px-3 py-3 font-bold">{b.runs}</td>
              <td className="text-center px-3 py-3 text-gray-500">{b.balls}</td>
              <td className="text-center px-3 py-3 text-blue-600">{b.fours}</td>
              <td className="text-center px-3 py-3 text-purple-600">{b.sixes}</td>
              <td className="text-center px-3 py-3 text-gray-500">
                {b.strikeRate.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
