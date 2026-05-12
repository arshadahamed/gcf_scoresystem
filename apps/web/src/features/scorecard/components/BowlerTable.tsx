interface BowlerRow {
  name: string;
  overs: string;
  runs: number;
  wickets: number;
  economy: number;
}

export function BowlerTable({ bowlers }: { bowlers: BowlerRow[] }) {
  if (!bowlers.length)
    return <p className="text-gray-400 text-sm py-2">Bowling stats not yet available</p>;

  return (
    <div className="bg-white rounded-xl border overflow-hidden mb-4">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs">
          <tr>
            <th className="text-left px-4 py-2">Bowler</th>
            <th className="px-3 py-2">O</th>
            <th className="px-3 py-2">R</th>
            <th className="px-3 py-2">W</th>
            <th className="px-3 py-2">Econ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {bowlers.map((b, i) => (
            <tr key={i}>
              <td className="px-4 py-3 font-medium">{b.name}</td>
              <td className="text-center px-3 py-3 text-gray-500">{b.overs}</td>
              <td className="text-center px-3 py-3">{b.runs}</td>
              <td className="text-center px-3 py-3 font-bold text-red-600">{b.wickets}</td>
              <td className="text-center px-3 py-3 text-gray-500">
                {b.economy.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
