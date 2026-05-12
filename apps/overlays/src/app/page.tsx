const overlays = [
  { name: 'Main Scoreboard', path: '/main/{matchId}',        desc: 'Persistent bottom-left score bar' },
  { name: 'Lower Third',     path: '/lower-third/{matchId}', desc: 'Batter & bowler name cards' },
  { name: 'Wicket',          path: '/wicket/{matchId}',      desc: 'Auto-triggered on wicket event' },
  { name: 'Boundary',        path: '/boundary/{matchId}',    desc: 'Auto-triggered on 4 or 6' },
  { name: 'Toss',            path: '/toss/{matchId}',        desc: 'Toss result announcement' },
  { name: 'Result',          path: '/result/{matchId}',      desc: 'Final match result card' },
  { name: 'Sponsor',         path: '/sponsor/{matchId}',     desc: 'Rotating sponsor strip' },
];

export default function OverlayIndexPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8" style={{ width: '100%', height: 'auto' }}>
      <h1 className="text-2xl font-bold mb-2">SCF OBS Overlays</h1>
      <p className="text-gray-400 mb-6 text-sm">Add each URL as a Browser Source in OBS (1920x1080).</p>
      <div className="space-y-3">
        {overlays.map(o => (
          <div key={o.path} className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{o.name}</p>
                <p className="text-gray-400 text-sm">{o.desc}</p>
              </div>
              <code className="text-green-400 text-sm bg-gray-900 px-3 py-1 rounded">{o.path}</code>
            </div>
          </div>
        ))}
      </div>
      <p className="text-gray-500 text-xs mt-6">Replace matchId with your match UUID from the admin dashboard.</p>
    </div>
  );
}
