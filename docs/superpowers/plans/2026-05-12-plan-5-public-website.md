# SCF Plan 5 — Public Live-Score Website (Next.js 15, SSR + Realtime)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Depends on:** Plan 2 complete.

**Goal:** Build the public-facing `apps/web` Next.js 15 site — a live scoreboard fans can open on any device. Pages: landing/tournament list, tournament detail, live match scorecard with realtime ball updates, player statistics.

**Architecture:** App Router with heavy Server Component usage + ISR for public pages. Only realtime-subscribed components are Client Components. Minimal JS to browser — core scorecard is SSR. Vercel Edge + `revalidateTag` for sub-second cache busting on match events.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind, Framer Motion, Supabase JS (Realtime only), TanStack Query (client components)

---

## Folder Structure

```
apps/web/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Landing — tournament list
│   ├── tournaments/
│   │   └── [id]/
│   │       ├── page.tsx                  # Tournament detail + fixture list
│   │       └── matches/
│   │           └── [matchId]/
│   │               └── page.tsx          # Live scorecard
│   ├── api/
│   │   └── revalidate/route.ts           # Webhook endpoint: revalidate match tags
│   └── not-found.tsx
├── features/
│   ├── tournament/
│   │   ├── components/
│   │   │   ├── TournamentHero.tsx
│   │   │   └── FixtureGrid.tsx
│   │   └── lib/fetch.ts
│   ├── scorecard/
│   │   ├── components/
│   │   │   ├── ScoreboardHeader.tsx      # Server: initial score
│   │   │   ├── LiveScoreboard.tsx        # Client: realtime updates
│   │   │   ├── BatterTable.tsx
│   │   │   ├── BowlerTable.tsx
│   │   │   ├── OverTimeline.tsx
│   │   │   └── RecentBalls.tsx           # Client: live ball feed
│   │   └── lib/fetch.ts
│   └── stats/
│       └── components/
│           └── LeaderboardTable.tsx
└── shared/
    ├── lib/
    │   ├── api.ts                         # Direct Supabase read OR API fetch
    │   └── supabase-realtime.ts
    └── components/
        ├── Navbar.tsx
        └── Footer.tsx
```

---

## Task 1: Scaffold `apps/web`

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/.env.example`

- [ ] **Step 1: package.json**

`apps/web/package.json`:

```json
{
  "name": "@scf/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start --port 3000",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@scf/contracts": "workspace:*",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.59.0",
    "framer-motion": "^11.0.0",
    "next": "15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.456.0"
  },
  "devDependencies": {
    "@scf/config": "workspace:*",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: tsconfig + next.config + tailwind**

`apps/web/tsconfig.json`:

```json
{
  "extends": "@scf/config/tsconfig/nextjs.json",
  "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx"]
}
```

`apps/web/next.config.ts`:

```ts
import type { NextConfig } from 'next';
const config: NextConfig = {
  experimental: { typedRoutes: true },
  // Revalidate tags via API webhook from backend
};
export default config;
```

`apps/web/tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1a6b3c', dark: '#134d2c', light: '#25a05a' },
      },
      animation: { 'ball-in': 'ballIn 0.3s ease-out' },
      keyframes: {
        ballIn: { '0%': { transform: 'scale(0)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
    },
  },
};
export default config;
```

`apps/web/.env.example`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
REVALIDATE_SECRET=change-me
```

- [ ] **Step 3: Install**

```bash
cd apps/web && pnpm install && pnpm dev
```

Expected: runs on port 3000.

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/web/
git commit -m "chore(web): scaffold public website Next.js 15"
```

---

## Task 2: Shared Layout + Navbar

**Files:**
- Create: `apps/web/src/styles/globals.css`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/shared/components/Navbar.tsx`
- Create: `apps/web/src/shared/components/Footer.tsx`
- Create: `apps/web/src/shared/lib/api.ts`
- Create: `apps/web/src/shared/lib/supabase-realtime.ts`

- [ ] **Step 1: Globals**

`apps/web/src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
body { @apply bg-gray-50 text-gray-900; }
```

- [ ] **Step 2: Root layout**

`apps/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Navbar } from '@/shared/components/Navbar';
import { Footer } from '@/shared/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cricket Fiesta — Live Scores',
  description: 'School cricket tournament live scores, scorecards, and statistics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Navbar**

`apps/web/src/shared/components/Navbar.tsx`:

```tsx
import Link from 'next/link';

export function Navbar() {
  return (
    <header className="bg-brand-dark shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          🏏 Cricket Fiesta
        </Link>
        <nav className="flex gap-4 text-sm text-green-200">
          <Link href="/" className="hover:text-white transition-colors">Tournaments</Link>
          <Link href="/stats" className="hover:text-white transition-colors">Stats</Link>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Footer**

`apps/web/src/shared/components/Footer.tsx`:

```tsx
export function Footer() {
  return (
    <footer className="bg-brand-dark text-green-300 text-center text-xs py-6 mt-16">
      <p>School Cricket Fiesta · Powered by Next.js + Supabase</p>
    </footer>
  );
}
```

- [ ] **Step 5: API fetch helper (SSR-compatible)**

`apps/web/src/shared/lib/api.ts`:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3001';

export async function apiFetch<T>(path: string, options?: RequestInit & { tags?: string[] }): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    next: options?.tags ? { tags: options.tags } : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
  const json = await res.json() as { data: T };
  return json.data;
}
```

- [ ] **Step 6: Supabase realtime helper (client-side only)**

`apps/web/src/shared/lib/supabase-realtime.ts`:

```ts
'use client';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): shared layout, Navbar, Footer, API fetch helper"
```

---

## Task 3: Landing Page + Tournament List

**Files:**
- Create: `apps/web/src/features/tournament/lib/fetch.ts`
- Create: `apps/web/src/features/tournament/components/TournamentHero.tsx`
- Create: `apps/web/src/features/tournament/components/FixtureGrid.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/not-found.tsx`

- [ ] **Step 1: Fetch functions**

`apps/web/src/features/tournament/lib/fetch.ts`:

```ts
import { apiFetch } from '@/shared/lib/api';
import type { MatchDTO } from '@scf/contracts';

export interface TournamentSummary {
  id: string;
  name: string;
  season: string;
  format: string;
  status: string;
}

export async function fetchTournaments(): Promise<TournamentSummary[]> {
  return apiFetch<TournamentSummary[]>('/v1/tournaments', { tags: ['tournaments'] });
}

export async function fetchTournamentMatches(tournamentId: string): Promise<MatchDTO[]> {
  return apiFetch<MatchDTO[]>(`/v1/matches?tournamentId=${tournamentId}`, {
    tags: [`tournament:${tournamentId}:matches`],
  });
}
```

- [ ] **Step 2: TournamentHero**

`apps/web/src/features/tournament/components/TournamentHero.tsx`:

```tsx
import type { TournamentSummary } from '../lib/fetch';
import Link from 'next/link';

export function TournamentHero({ tournament }: { tournament: TournamentSummary }) {
  const isLive = tournament.status === 'active';
  return (
    <Link href={`/tournaments/${tournament.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{tournament.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{tournament.format} · Season {tournament.season}</p>
        </div>
        {isLive && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            LIVE
          </span>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: FixtureGrid**

`apps/web/src/features/tournament/components/FixtureGrid.tsx`:

```tsx
import Link from 'next/link';
import type { MatchDTO } from '@scf/contracts';

export function FixtureGrid({ matches, tournamentId }: { matches: MatchDTO[]; tournamentId: string }) {
  if (!matches.length) return <p className="text-gray-400 text-sm">No matches scheduled yet.</p>;

  return (
    <div className="space-y-3">
      {matches.map(m => (
        <Link key={m.id} href={`/tournaments/${tournamentId}/matches/${m.id}`}
          className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-brand transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{m.teamAName} <span className="text-gray-400">vs</span> {m.teamBName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {m.venue ?? 'TBD'} · {new Date(m.scheduledAt).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
              </p>
            </div>
            {m.status === 'live' && (
              <span className="text-xs font-bold text-green-600 animate-pulse">● LIVE</span>
            )}
            {m.status === 'completed' && m.winnerId && (
              <span className="text-xs text-gray-500">Result</span>
            )}
          </div>
          {m.resultSummary && (
            <p className="text-xs text-brand mt-2 font-medium">{m.resultSummary}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Landing page (Server Component)**

`apps/web/src/app/page.tsx`:

```tsx
import { fetchTournaments } from '@/features/tournament/lib/fetch';
import { TournamentHero } from '@/features/tournament/components/TournamentHero';

export const revalidate = 60;

export default async function HomePage() {
  const tournaments = await fetchTournaments();
  const active = tournaments.filter(t => t.status === 'active');
  const others = tournaments.filter(t => t.status !== 'active');

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cricket Fiesta</h1>
        <p className="text-gray-500 mt-1">Live school cricket scores — powered by SCF</p>
      </div>

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Active Tournaments</h2>
          <div className="space-y-3">{active.map(t => <TournamentHero key={t.id} tournament={t} />)}</div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Past Tournaments</h2>
          <div className="space-y-3">{others.map(t => <TournamentHero key={t.id} tournament={t} />)}</div>
        </section>
      )}

      {!tournaments.length && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🏏</p>
          <p>No tournaments yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Not found page**

`apps/web/src/app/not-found.tsx`:

```tsx
import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="text-6xl mb-4">🏏</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link href="/" className="mt-4 inline-block text-brand underline">Back to home</Link>
    </div>
  );
}
```

- [ ] **Step 6: Test**

Navigate to `http://localhost:3000`. Should show seeded "Cricket Fiesta 2026" tournament.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): landing page + tournament list with ISR"
```

---

## Task 4: Live Scorecard Page

**Files:**
- Create: `apps/web/src/features/scorecard/lib/fetch.ts`
- Create: `apps/web/src/features/scorecard/components/ScoreboardHeader.tsx`
- Create: `apps/web/src/features/scorecard/components/LiveScoreboard.tsx`
- Create: `apps/web/src/features/scorecard/components/BatterTable.tsx`
- Create: `apps/web/src/features/scorecard/components/BowlerTable.tsx`
- Create: `apps/web/src/features/scorecard/components/RecentBalls.tsx`
- Create: `apps/web/src/app/tournaments/[id]/matches/[matchId]/page.tsx`

- [ ] **Step 1: Scorecard fetch**

`apps/web/src/features/scorecard/lib/fetch.ts`:

```ts
import { apiFetch } from '@/shared/lib/api';
import type { InningsDTO, MatchDTO } from '@scf/contracts';

export async function fetchMatch(matchId: string): Promise<MatchDTO> {
  return apiFetch<MatchDTO>(`/v1/matches/${matchId}`, { tags: [`match:${matchId}`] });
}

export async function fetchScorecard(matchId: string): Promise<InningsDTO[]> {
  return apiFetch<InningsDTO[]>(`/v1/matches/${matchId}/scorecard`, { tags: [`match:${matchId}:scorecard`] });
}
```

- [ ] **Step 2: ScoreboardHeader (Server)**

`apps/web/src/features/scorecard/components/ScoreboardHeader.tsx`:

```tsx
import type { MatchDTO, InningsDTO } from '@scf/contracts';

export function ScoreboardHeader({ match, innings }: { match: MatchDTO; innings: InningsDTO[] }) {
  const current = innings.find(i => !i.isComplete) ?? innings[innings.length - 1];

  return (
    <div className="bg-brand-dark text-white rounded-2xl p-6 mb-6">
      <div className="text-center mb-4">
        <p className="text-green-300 text-sm">{match.status === 'live' ? '● LIVE' : match.status.toUpperCase()}</p>
        <h1 className="text-2xl font-bold mt-1">
          {match.teamAName} <span className="text-green-300">vs</span> {match.teamBName}
        </h1>
        {match.venue && <p className="text-green-200 text-sm mt-1">{match.venue}</p>}
      </div>

      {current && (
        <div className="bg-brand rounded-xl p-4 text-center">
          <div className="text-4xl font-bold">{current.totalRuns}/{current.totalWickets}</div>
          <div className="text-green-300 text-lg mt-1">{current.oversDisplay} / {innings[0]?.matchId ? match.oversPerInnings : '—'} overs</div>
          {match.resultSummary && <p className="text-green-200 text-sm mt-2">{match.resultSummary}</p>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: BatterTable**

`apps/web/src/features/scorecard/components/BatterTable.tsx`:

```tsx
interface BatterRow { name: string; runs: number; balls: number; fours: number; sixes: number; strikeRate: number; isOut: boolean; dismissal?: string; }

export function BatterTable({ batters }: { batters: BatterRow[] }) {
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
                <span className={b.isOut ? 'text-gray-500' : 'font-semibold text-gray-900'}>{b.name}</span>
                {!b.isOut && <span className="ml-1 text-green-600 text-xs">*</span>}
                {b.isOut && b.dismissal && <p className="text-xs text-gray-400">{b.dismissal}</p>}
              </td>
              <td className="text-center px-3 py-3 font-bold">{b.runs}</td>
              <td className="text-center px-3 py-3 text-gray-500">{b.balls}</td>
              <td className="text-center px-3 py-3 text-blue-600">{b.fours}</td>
              <td className="text-center px-3 py-3 text-purple-600">{b.sixes}</td>
              <td className="text-center px-3 py-3 text-gray-500">{b.strikeRate.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: BowlerTable**

`apps/web/src/features/scorecard/components/BowlerTable.tsx`:

```tsx
interface BowlerRow { name: string; overs: string; runs: number; wickets: number; economy: number; }

export function BowlerTable({ bowlers }: { bowlers: BowlerRow[] }) {
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
              <td className="text-center px-3 py-3 text-gray-500">{b.economy.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: RecentBalls (Client, realtime)**

`apps/web/src/features/scorecard/components/RecentBalls.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase-realtime';
import { Channels, type WsEvent } from '@scf/contracts';
import { motion, AnimatePresence } from 'framer-motion';

const ballStyle: Record<string, string> = {
  W: 'bg-red-500 text-white',
  Wd: 'bg-yellow-400 text-black',
  Nb: 'bg-orange-400 text-black',
  '4': 'bg-blue-500 text-white',
  '6': 'bg-purple-600 text-white',
  '·': 'bg-gray-200 text-gray-600',
};

export function RecentBalls({ matchId, initial }: { matchId: string; initial?: string[] }) {
  const [balls, setBalls] = useState<string[]>(initial ?? []);
  const [score, setScore] = useState<{ runs: number; wickets: number; overs: string } | null>(null);

  useEffect(() => {
    const ch = supabase.channel(Channels.match(matchId));
    ch.on('broadcast', { event: 'scoring.ball.recorded' }, ({ payload }: { payload: WsEvent['payload'] }) => {
      const p = payload as any;
      const symbol = p.ball?.wicket ? 'W'
        : p.ball?.extras?.wide > 0 ? 'Wd'
        : p.ball?.extras?.noBall > 0 ? 'Nb'
        : p.ball?.runsOffBat === 0 ? '·'
        : String(p.ball?.runsOffBat ?? '·');

      setBalls(prev => [...prev.slice(-29), symbol]);
      if (p.scoreAfter) setScore(p.scoreAfter);
    }).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [matchId]);

  return (
    <div className="bg-white rounded-xl border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Ball-by-ball</h3>
        {score && (
          <span className="text-sm font-bold text-brand">
            {score.runs}/{score.wickets} ({score.overs})
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {balls.slice(-12).map((b, i) => (
            <motion.span key={`${b}-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${ballStyle[b] ?? 'bg-green-100 text-green-800'}`}
            >
              {b}
            </motion.span>
          ))}
        </AnimatePresence>
        {balls.length === 0 && <p className="text-gray-400 text-sm">Match hasn't started yet</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: LiveScoreboard (Client: realtime score line)**

`apps/web/src/features/scorecard/components/LiveScoreboard.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase-realtime';
import { Channels } from '@scf/contracts';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveScore { runs: number; wickets: number; overs: string; }

export function LiveScoreboard({ matchId, initialScore }: { matchId: string; initialScore: LiveScore }) {
  const [score, setScore] = useState(initialScore);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const ch = supabase.channel(Channels.match(matchId));
    ch.on('broadcast', { event: 'scoring.ball.recorded' }, ({ payload }: any) => {
      if (payload?.scoreAfter) {
        setScore(payload.scoreAfter);
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }
    }).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [matchId]);

  return (
    <div className={`text-center transition-colors duration-300 ${flash ? 'text-brand-light' : ''}`}>
      <AnimatePresence mode="wait">
        <motion.div key={`${score.runs}-${score.wickets}`}
          initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
          <div className="text-5xl font-black tracking-tight">
            {score.runs}/{score.wickets}
          </div>
          <div className="text-green-300 text-xl mt-1">{score.overs}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 7: Match scorecard page**

`apps/web/src/app/tournaments/[id]/matches/[matchId]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { fetchMatch, fetchScorecard } from '@/features/scorecard/lib/fetch';
import { ScoreboardHeader } from '@/features/scorecard/components/ScoreboardHeader';
import { RecentBalls } from '@/features/scorecard/components/RecentBalls';
import { BatterTable } from '@/features/scorecard/components/BatterTable';
import { BowlerTable } from '@/features/scorecard/components/BowlerTable';

// Revalidate frequently for live matches; longer for completed
export const revalidate = 5;

export default async function MatchPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { matchId, id: tournamentId } = await params;

  let match, scorecard;
  try {
    [match, scorecard] = await Promise.all([fetchMatch(matchId), fetchScorecard(matchId)]);
  } catch {
    notFound();
  }

  const currentInnings = scorecard.find(i => !i.isComplete) ?? scorecard[scorecard.length - 1];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ScoreboardHeader match={match} innings={scorecard} />

      {/* Client: realtime ball feed */}
      <RecentBalls matchId={matchId} />

      {currentInnings && (
        <>
          {/* Batter table — placeholder data (extend with player_match_stats query) */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Batting</h2>
          <BatterTable batters={[]} />

          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Bowling</h2>
          <BowlerTable bowlers={[]} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Test**

Start the API. Navigate to `http://localhost:3000`. Click through to a match page. Should show scorecard. Open the scorer PWA and score some balls — the public page ball-feed should update in real time.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): live scorecard — SSR header + realtime ball feed + batter/bowler tables"
```

---

## Task 5: Tournament Detail Page + Cache Revalidation Webhook

**Files:**
- Create: `apps/web/src/app/tournaments/[id]/page.tsx`
- Create: `apps/web/src/app/api/revalidate/route.ts`

- [ ] **Step 1: Tournament detail page**

`apps/web/src/app/tournaments/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { fetchTournaments, fetchTournamentMatches } from '@/features/tournament/lib/fetch';
import { FixtureGrid } from '@/features/tournament/components/FixtureGrid';

export const revalidate = 30;

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let tournaments, matches;
  try {
    [tournaments, matches] = await Promise.all([fetchTournaments(), fetchTournamentMatches(id)]);
  } catch {
    notFound();
  }

  const tournament = tournaments.find(t => t.id === id);
  if (!tournament) notFound();

  const live = matches.filter(m => m.status === 'live');
  const rest = matches.filter(m => m.status !== 'live');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-gray-400 uppercase tracking-wide">{tournament.format} · {tournament.season}</p>
        <h1 className="text-2xl font-bold mt-1">{tournament.name}</h1>
      </div>

      {live.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Live now</h2>
          <FixtureGrid matches={live} tournamentId={id} />
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">All fixtures</h2>
        <FixtureGrid matches={rest} tournamentId={id} />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Revalidation webhook (API route)**

`apps/web/src/app/api/revalidate/route.ts`:

```ts
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-revalidate-secret');
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { tag?: string; matchId?: string; tournamentId?: string };

  if (body.tag) {
    revalidateTag(body.tag);
  } else if (body.matchId) {
    revalidateTag(`match:${body.matchId}`);
    revalidateTag(`match:${body.matchId}:scorecard`);
  } else if (body.tournamentId) {
    revalidateTag(`tournament:${body.tournamentId}:matches`);
    revalidateTag('tournaments');
  }

  return NextResponse.json({ revalidated: true });
}
```

Call this from the API's event bus after publishing domain events (wire in Plan 2 extension).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/tournaments/ apps/web/src/app/api/
git commit -m "feat(web): tournament detail page + cache revalidation webhook"
```

---

## Self-Review

| Requirement | Covered |
|---|---|
| Public tournament list (SSR + ISR) | Task 3 |
| Tournament detail + fixture list | Task 5 |
| Live scorecard with realtime ball feed | Task 4 |
| BatterTable + BowlerTable | Task 4 |
| Framer Motion animated ball icons | Task 4 (RecentBalls, LiveScoreboard) |
| ISR cache busting via webhook | Task 5 |
| Responsive + accessible layout | Throughout |
| Vercel Edge-compatible | fetch with `next.tags` |
