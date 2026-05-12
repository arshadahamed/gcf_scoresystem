# SCF Plan 6 — OBS Overlays + Realtime Director

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Depends on:** Plan 2 complete (API + Realtime events flowing).

**Goal:** Build `apps/overlays` — isolated Next.js 15 app serving browser-source URLs for OBS Studio. Eight overlay types, transparent backgrounds, Framer Motion animations, and a realtime overlay director FSM that cues animations based on domain events.

**Architecture:** Each overlay is a standalone Next.js route with `background: transparent` body. Overlays subscribe to Supabase Realtime broadcast channels. An `OverlayDirector` FSM (hook) prioritises cues: `result > wicket > boundary > lower-third > sponsor`. Overlay state is driven entirely by realtime events — no auth required (public channel read).

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Framer Motion, Supabase Realtime, `@scf/contracts`

---

## OBS Studio Setup Instructions (for end user)

Add each overlay as a **Browser Source** in OBS:
- URL: `https://overlays.scf.app/main/{matchId}?theme=dark`
- Width: 1920, Height: 1080
- **Enable: "Shutdown source when not visible"** = OFF
- **Enable: "Refresh browser when scene becomes active"** = OFF (keeps subscription alive)
- Custom CSS: `body { background: transparent !important; margin: 0; overflow: hidden; }`

---

## Folder Structure

```
apps/overlays/src/
├── app/
│   ├── layout.tsx                          # transparent body
│   ├── main/[matchId]/page.tsx             # Always-on lower scoreboard
│   ├── lower-third/[matchId]/page.tsx      # Batter/bowler name card
│   ├── wicket/[matchId]/page.tsx           # Wicket burst
│   ├── boundary/[matchId]/page.tsx         # 4 or 6 celebration
│   ├── toss/[matchId]/page.tsx             # Toss reveal card
│   ├── result/[matchId]/page.tsx           # Match result
│   └── sponsor/[matchId]/page.tsx          # Rotating sponsor strip
├── features/
│   └── overlay/
│       ├── hooks/
│       │   ├── useOverlayDirector.ts       # FSM cue manager
│       │   ├── useRealtimeChannel.ts       # Supabase broadcast subscriber
│       │   └── useScoreboardSnapshot.ts    # Maintains live snapshot
│       └── components/
│           ├── overlays/
│           │   ├── MainScoreboard.tsx
│           │   ├── LowerThird.tsx
│           │   ├── WicketBurst.tsx
│           │   ├── BoundaryFlash.tsx
│           │   ├── TossCard.tsx
│           │   ├── ResultCard.tsx
│           │   └── SponsorStrip.tsx
│           └── primitives/
│               ├── BroadcastText.tsx        # Cricket broadcast typography
│               ├── TeamBadge.tsx
│               └── ScoreLine.tsx
└── shared/
    └── lib/
        └── supabase.ts
```

---

## Task 1: Scaffold `apps/overlays`

**Files:**
- Create: `apps/overlays/package.json`
- Create: `apps/overlays/tsconfig.json`
- Create: `apps/overlays/next.config.ts`
- Create: `apps/overlays/tailwind.config.ts`
- Create: `apps/overlays/.env.example`

- [ ] **Step 1: package.json**

`apps/overlays/package.json`:

```json
{
  "name": "@scf/overlays",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3004",
    "build": "next build",
    "start": "next start --port 3004",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@scf/contracts": "workspace:*",
    "@supabase/supabase-js": "^2.45.0",
    "framer-motion": "^11.0.0",
    "next": "15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0"
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

- [ ] **Step 2: tsconfig.json**

`apps/overlays/tsconfig.json`:

```json
{
  "extends": "@scf/config/tsconfig/nextjs.json",
  "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx"]
}
```

- [ ] **Step 3: next.config.ts**

`apps/overlays/next.config.ts`:

```ts
import type { NextConfig } from 'next';
const config: NextConfig = {};
export default config;
```

- [ ] **Step 4: tailwind.config.ts**

`apps/overlays/tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { broadcast: ['Rajdhani', 'Impact', 'sans-serif'] },
      colors: {
        'obs-green': '#00b140',
        'obs-red': '#e53e3e',
        'obs-yellow': '#f6e05e',
        brand: { DEFAULT: '#1a6b3c', dark: '#134d2c' },
      },
      animation: {
        'slide-up':    'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down':  'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'burst':       'burst 0.5s ease-out',
        'fade-out':    'fadeOut 0.5s ease-in forwards',
      },
      keyframes: {
        slideUp:   { '0%': { transform: 'translateY(100%)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-100%)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        burst:     { '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' }, '60%': { transform: 'scale(1.1) rotate(2deg)' }, '100%': { transform: 'scale(1) rotate(0)', opacity: '1' } },
        fadeOut:   { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
      },
    },
  },
};
export default config;
```

- [ ] **Step 5: .env.example**

`apps/overlays/.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 6: Install**

```bash
cd apps/overlays && pnpm install && pnpm dev
```

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/overlays/
git commit -m "chore(overlays): scaffold OBS overlay Next.js app"
```

---

## Task 2: Transparent Root Layout

**Files:**
- Create: `apps/overlays/src/styles/globals.css`
- Create: `apps/overlays/src/app/layout.tsx`
- Create: `apps/overlays/src/shared/lib/supabase.ts`

- [ ] **Step 1: globals.css (transparent background)**

`apps/overlays/src/styles/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* OBS Browser Source requires transparent body */
html, body {
  background: transparent !important;
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 1920px;
  height: 1080px;
}

* { box-sizing: border-box; }
```

- [ ] **Step 2: Root layout (no chrome)**

`apps/overlays/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = { title: 'SCF Overlays' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: 'transparent' }}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Supabase client**

`apps/overlays/src/shared/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

- [ ] **Step 4: Commit**

```bash
git add apps/overlays/src/
git commit -m "feat(overlays): transparent layout + Supabase client"
```

---

## Task 3: Realtime Hooks

**Files:**
- Create: `apps/overlays/src/features/overlay/hooks/useRealtimeChannel.ts`
- Create: `apps/overlays/src/features/overlay/hooks/useScoreboardSnapshot.ts`
- Create: `apps/overlays/src/features/overlay/hooks/useOverlayDirector.ts`

- [ ] **Step 1: useRealtimeChannel**

`apps/overlays/src/features/overlay/hooks/useRealtimeChannel.ts`:

```ts
'use client';
import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';

export function useRealtimeChannel(
  channelName: string,
  eventHandlers: Record<string, (payload: unknown) => void>,
) {
  useEffect(() => {
    const channel = supabase.channel(channelName);
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      channel.on('broadcast', { event }, ({ payload }) => handler(payload));
    });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [channelName]); // intentionally omit eventHandlers to avoid re-subscribe on render
}
```

- [ ] **Step 2: useScoreboardSnapshot**

`apps/overlays/src/features/overlay/hooks/useScoreboardSnapshot.ts`:

```ts
'use client';
import { useState, useCallback } from 'react';
import { Channels } from '@scf/contracts';
import type { ScoreboardSnapshot } from '@scf/contracts';
import { useRealtimeChannel } from './useRealtimeChannel';

const EMPTY_SNAPSHOT: ScoreboardSnapshot = {
  matchId: '',
  tournamentName: '',
  teamA: { id: '', name: '—', shortName: '—' },
  teamB: { id: '', name: '—', shortName: '—' },
  currentInnings: { battingTeamId: '', runs: 0, wickets: 0, oversDisplay: '0.0', targetRuns: null },
  striker:    { id: '', name: '—', runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
  nonStriker: { id: '', name: '—', runs: 0, balls: 0 },
  bowler:     { id: '', name: '—', overs: '0.0', runs: 0, wickets: 0, economy: 0 },
  recentOvers: [],
  matchStatus: 'live',
};

export function useScoreboardSnapshot(matchId: string) {
  const [snapshot, setSnapshot] = useState<ScoreboardSnapshot>({ ...EMPTY_SNAPSHOT, matchId });

  const handlers = {
    'scoring.ball.recorded': useCallback((payload: unknown) => {
      const p = payload as any;
      setSnapshot(prev => ({
        ...prev,
        currentInnings: {
          ...prev.currentInnings,
          runs:        p.totalRuns    ?? prev.currentInnings.runs,
          wickets:     p.totalWickets ?? prev.currentInnings.wickets,
          oversDisplay: p.overDisplay ?? prev.currentInnings.oversDisplay,
        },
        striker: p.striker ? {
          id:          p.striker.id,
          name:        p.striker.name,
          runs:        p.striker.runs,
          balls:       p.striker.balls,
          fours:       p.striker.fours ?? 0,
          sixes:       p.striker.sixes ?? 0,
          strikeRate:  p.striker.balls > 0 ? (p.striker.runs / p.striker.balls) * 100 : 0,
        } : prev.striker,
        bowler: p.bowler ? {
          id:       p.bowler.id,
          name:     p.bowler.name,
          overs:    p.bowler.overs,
          runs:     p.bowler.runs,
          wickets:  p.bowler.wickets,
          economy:  parseFloat(p.bowler.overs) > 0 ? p.bowler.runs / parseFloat(p.bowler.overs) : 0,
        } : prev.bowler,
      }));
    }, []),
    'match.ended': useCallback((payload: unknown) => {
      const p = payload as any;
      setSnapshot(prev => ({ ...prev, matchStatus: 'completed', currentInnings: { ...prev.currentInnings } }));
    }, []),
  };

  useRealtimeChannel(Channels.match(matchId), handlers);

  return snapshot;
}
```

- [ ] **Step 3: useOverlayDirector (FSM)**

`apps/overlays/src/features/overlay/hooks/useOverlayDirector.ts`:

```ts
'use client';
import { useEffect, useState, useRef } from 'react';
import { Channels, type OverlayCue } from '@scf/contracts';
import { supabase } from '@/shared/lib/supabase';

type CuePriority = { kind: string; priority: number };
const PRIORITY: Record<string, number> = {
  result:        100,
  wicket:        90,
  boundary_six:  80,
  boundary_four: 70,
  over_complete: 50,
  sponsor:       10,
};

export function useOverlayDirector(matchId: string) {
  const [activeCue, setActiveCue] = useState<OverlayCue | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCue = (cue: OverlayCue) => {
    const incoming = PRIORITY[cue.kind] ?? 0;
    const current  = activeCue ? (PRIORITY[activeCue.kind] ?? 0) : 0;
    if (incoming < current) return; // don't interrupt higher-priority cue

    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveCue(cue);
    timerRef.current = setTimeout(() => setActiveCue(null), cue.durationMs);
  };

  useEffect(() => {
    const channel = supabase.channel(Channels.match(matchId));

    channel.on('broadcast', { event: 'scoring.ball.recorded' }, ({ payload }: any) => {
      const ball = payload?.ball;
      if (!ball) return;
      if (ball.wicket) {
        triggerCue({ kind: 'wicket', durationMs: 5000, data: { batsmanName: payload.striker?.name, runs: payload.striker?.runs, balls: payload.striker?.balls, teamScore: `${payload.totalRuns}/${payload.totalWickets}`, overs: payload.overDisplay } });
      } else if (ball.runsOffBat === 6) {
        triggerCue({ kind: 'boundary_six', durationMs: 4000, data: { batsmanName: payload.striker?.name, runs: 6, teamScore: `${payload.totalRuns}/${payload.totalWickets}` } });
      } else if (ball.runsOffBat === 4) {
        triggerCue({ kind: 'boundary_four', durationMs: 3000, data: { batsmanName: payload.striker?.name, runs: 4, teamScore: `${payload.totalRuns}/${payload.totalWickets}` } });
      }
    });

    channel.on('broadcast', { event: 'scoring.over.completed' }, ({ payload }: any) => {
      triggerCue({ kind: 'over_complete', durationMs: 3000, data: payload });
    });

    channel.on('broadcast', { event: 'match.ended' }, ({ payload }: any) => {
      triggerCue({ kind: 'result', durationMs: 15000, data: payload });
    });

    channel.on('broadcast', { event: 'overlay.cue' }, ({ payload }: any) => {
      if (payload?.kind) triggerCue(payload as OverlayCue);
    });

    channel.subscribe();
    return () => { void supabase.removeChannel(channel); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [matchId]);

  return activeCue;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/overlays/src/features/overlay/hooks/
git commit -m "feat(overlays): realtime hooks — channel subscriber, snapshot, overlay director FSM"
```

---

## Task 4: Primitive Components

**Files:**
- Create: `apps/overlays/src/features/overlay/components/primitives/BroadcastText.tsx`
- Create: `apps/overlays/src/features/overlay/components/primitives/ScoreLine.tsx`
- Create: `apps/overlays/src/features/overlay/components/primitives/TeamBadge.tsx`

- [ ] **Step 1: BroadcastText**

`apps/overlays/src/features/overlay/components/primitives/BroadcastText.tsx`:

```tsx
import { cn } from 'clsx-tailwind-merge';

// Broadcast TV typography primitive — always renders in broadcast font
export function BroadcastText({
  children, size = 'md', weight = 'bold', className,
}: {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
  weight?: 'normal' | 'semibold' | 'bold';
  className?: string;
}) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl', '4xl': 'text-4xl', '6xl': 'text-6xl' };
  const weights = { normal: 'font-normal', semibold: 'font-semibold', bold: 'font-bold' };
  return (
    <span className={`font-broadcast uppercase tracking-wide ${sizes[size]} ${weights[weight]} ${className ?? ''}`}>
      {children}
    </span>
  );
}
```

Fix import (clsx-tailwind-merge doesn't exist — use cn from utils):

Replace the import with:
```tsx
function cn(...classes: (string | undefined)[]) { return classes.filter(Boolean).join(' '); }
```

- [ ] **Step 2: ScoreLine**

`apps/overlays/src/features/overlay/components/primitives/ScoreLine.tsx`:

```tsx
import { BroadcastText } from './BroadcastText';

export function ScoreLine({ runs, wickets, overs, targetRuns }: {
  runs: number; wickets: number; overs: string; targetRuns?: number | null;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <BroadcastText size="4xl">{runs}/{wickets}</BroadcastText>
      <BroadcastText size="lg" weight="semibold" className="text-green-300">{overs} ov</BroadcastText>
      {targetRuns && (
        <BroadcastText size="sm" className="text-yellow-300">
          Target: {targetRuns} · Need {targetRuns - runs} in {overs}
        </BroadcastText>
      )}
    </div>
  );
}
```

- [ ] **Step 3: TeamBadge**

`apps/overlays/src/features/overlay/components/primitives/TeamBadge.tsx`:

```tsx
export function TeamBadge({ name, shortName, isBatting }: { name: string; shortName: string; isBatting: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${isBatting ? 'bg-obs-green text-white' : 'bg-gray-700 text-gray-300'}`}>
      <span className="font-broadcast font-bold text-lg uppercase">{shortName}</span>
      <span className="text-xs opacity-75">{name}</span>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/overlays/src/features/overlay/components/primitives/
git commit -m "feat(overlays): broadcast typography primitives — BroadcastText, ScoreLine, TeamBadge"
```

---

## Task 5: Main Scoreboard Overlay

**Files:**
- Create: `apps/overlays/src/features/overlay/components/overlays/MainScoreboard.tsx`
- Create: `apps/overlays/src/app/main/[matchId]/page.tsx`

- [ ] **Step 1: MainScoreboard component**

`apps/overlays/src/features/overlay/components/overlays/MainScoreboard.tsx`:

```tsx
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useScoreboardSnapshot } from '../../hooks/useScoreboardSnapshot';
import { ScoreLine } from '../primitives/ScoreLine';
import { BroadcastText } from '../primitives/BroadcastText';

export function MainScoreboard({ matchId }: { matchId: string }) {
  const snap = useScoreboardSnapshot(matchId);
  const { currentInnings: inn, striker, nonStriker, bowler, teamA, teamB } = snap;

  const battingTeam = inn.battingTeamId === teamA.id ? teamA : teamB;

  return (
    // Positioned bottom-left of the 1920×1080 canvas
    <div className="absolute bottom-16 left-8">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-brand-dark/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-brand/50 min-w-[520px]"
      >
        {/* Team + Score header */}
        <div className="bg-brand px-5 py-3 flex items-center justify-between">
          <BroadcastText size="xl">{battingTeam.shortName}</BroadcastText>
          <AnimatePresence mode="wait">
            <motion.div key={`${inn.runs}-${inn.wickets}`}
              initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
              <ScoreLine runs={inn.runs} wickets={inn.wickets} overs={inn.oversDisplay} targetRuns={inn.targetRuns} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Striker + Non-striker */}
        <div className="px-5 py-2 flex gap-6">
          <div>
            <BroadcastText size="sm" className="text-green-300">Bat </BroadcastText>
            <BroadcastText size="md">{striker.name}</BroadcastText>
            <BroadcastText size="sm" className="text-yellow-300"> {striker.runs}({striker.balls})</BroadcastText>
          </div>
          <div className="border-l border-brand pl-4">
            <BroadcastText size="sm" className="text-green-300">  </BroadcastText>
            <BroadcastText size="md" className="text-gray-300">{nonStriker.name}</BroadcastText>
            <BroadcastText size="sm" className="text-gray-400"> {nonStriker.runs}({nonStriker.balls})</BroadcastText>
          </div>
        </div>

        {/* Bowler */}
        <div className="px-5 pb-3 border-t border-brand/30 pt-2">
          <BroadcastText size="sm" className="text-green-300">Bowl </BroadcastText>
          <BroadcastText size="md" className="text-gray-200">{bowler.name}</BroadcastText>
          <BroadcastText size="sm" className="text-gray-400"> {bowler.overs}-{bowler.runs}-{bowler.wickets}</BroadcastText>
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Main overlay page**

`apps/overlays/src/app/main/[matchId]/page.tsx`:

```tsx
import { MainScoreboard } from '@/features/overlay/components/overlays/MainScoreboard';

export default async function MainOverlayPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return (
    <div className="relative w-[1920px] h-[1080px]">
      <MainScoreboard matchId={matchId} />
    </div>
  );
}
```

- [ ] **Step 3: Test in browser**

```bash
cd apps/overlays && pnpm dev
```

Open `http://localhost:3004/main/m1`. Should show the scoreboard at bottom-left on a transparent background. Score some balls in the scorer PWA — scoreboard should animate updates.

- [ ] **Step 4: Commit**

```bash
cd ../..
git add apps/overlays/src/features/overlay/components/overlays/MainScoreboard.tsx apps/overlays/src/app/main/
git commit -m "feat(overlays): main scoreboard overlay — realtime animated score display"
```

---

## Task 6: Wicket + Boundary Overlays

**Files:**
- Create: `apps/overlays/src/features/overlay/components/overlays/WicketBurst.tsx`
- Create: `apps/overlays/src/features/overlay/components/overlays/BoundaryFlash.tsx`
- Create: `apps/overlays/src/app/wicket/[matchId]/page.tsx`
- Create: `apps/overlays/src/app/boundary/[matchId]/page.tsx`

- [ ] **Step 1: WicketBurst**

`apps/overlays/src/features/overlay/components/overlays/WicketBurst.tsx`:

```tsx
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayDirector } from '../../hooks/useOverlayDirector';
import { BroadcastText } from '../primitives/BroadcastText';

export function WicketBurst({ matchId }: { matchId: string }) {
  const cue = useOverlayDirector(matchId);
  const active = cue?.kind === 'wicket' ? cue : null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {active && (
          <motion.div
            key="wicket"
            initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="bg-gradient-to-br from-red-700 to-red-900 rounded-3xl px-14 py-8 shadow-2xl border-4 border-red-400/50"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: 3, duration: 0.4 }}
              >
                <BroadcastText size="6xl" className="text-white block">WICKET!</BroadcastText>
              </motion.div>
              <BroadcastText size="2xl" className="text-red-200 mt-2 block">
                {(active.data as any).batsmanName}
              </BroadcastText>
              <BroadcastText size="xl" className="text-yellow-300 mt-1 block">
                {(active.data as any).runs}({(active.data as any).balls}) ·{' '}
                {(active.data as any).teamScore}
              </BroadcastText>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: BoundaryFlash**

`apps/overlays/src/features/overlay/components/overlays/BoundaryFlash.tsx`:

```tsx
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayDirector } from '../../hooks/useOverlayDirector';
import { BroadcastText } from '../primitives/BroadcastText';

export function BoundaryFlash({ matchId }: { matchId: string }) {
  const cue = useOverlayDirector(matchId);
  const isFour = cue?.kind === 'boundary_four';
  const isSix  = cue?.kind === 'boundary_six';
  const active = (isFour || isSix) ? cue : null;

  return (
    <div className="absolute top-24 right-12 pointer-events-none">
      <AnimatePresence>
        {active && (
          <motion.div
            key={active.kind}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0, transition: { duration: 0.3 } }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={`rounded-2xl px-8 py-5 border-4 shadow-2xl ${isSix ? 'bg-purple-900 border-purple-400' : 'bg-blue-900 border-blue-400'}`}
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, -3, 3, 0] }}
                transition={{ duration: 0.3, repeat: 2 }}
              >
                <BroadcastText size="6xl" className={isSix ? 'text-purple-200' : 'text-blue-200'}>
                  {isSix ? 'SIX!' : 'FOUR!'}
                </BroadcastText>
              </motion.div>
              <BroadcastText size="lg" className="text-gray-300 mt-1 block">
                {(active.data as any).batsmanName}
              </BroadcastText>
              <BroadcastText size="sm" className="text-gray-400 block">
                {(active.data as any).teamScore}
              </BroadcastText>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 3: Overlay pages**

`apps/overlays/src/app/wicket/[matchId]/page.tsx`:

```tsx
import { WicketBurst } from '@/features/overlay/components/overlays/WicketBurst';
export default async function WicketPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <div className="relative w-[1920px] h-[1080px]"><WicketBurst matchId={matchId} /></div>;
}
```

`apps/overlays/src/app/boundary/[matchId]/page.tsx`:

```tsx
import { BoundaryFlash } from '@/features/overlay/components/overlays/BoundaryFlash';
export default async function BoundaryPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <div className="relative w-[1920px] h-[1080px]"><BoundaryFlash matchId={matchId} /></div>;
}
```

- [ ] **Step 4: Test**

Open `http://localhost:3004/wicket/m1` and `http://localhost:3004/boundary/m1` in separate tabs. Score a 6 in the scorer — boundary flash should appear at top-right. Score a wicket — wicket burst should appear centered.

- [ ] **Step 5: Commit**

```bash
git add apps/overlays/src/features/overlay/components/overlays/ apps/overlays/src/app/
git commit -m "feat(overlays): wicket burst + boundary flash overlays with Framer Motion"
```

---

## Task 7: Result + Toss + Sponsor Overlays

**Files:**
- Create: `apps/overlays/src/features/overlay/components/overlays/ResultCard.tsx`
- Create: `apps/overlays/src/features/overlay/components/overlays/TossCard.tsx`
- Create: `apps/overlays/src/features/overlay/components/overlays/SponsorStrip.tsx`
- Create: `apps/overlays/src/app/result/[matchId]/page.tsx`
- Create: `apps/overlays/src/app/toss/[matchId]/page.tsx`
- Create: `apps/overlays/src/app/sponsor/[matchId]/page.tsx`

- [ ] **Step 1: ResultCard**

`apps/overlays/src/features/overlay/components/overlays/ResultCard.tsx`:

```tsx
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayDirector } from '../../hooks/useOverlayDirector';
import { BroadcastText } from '../primitives/BroadcastText';

export function ResultCard({ matchId }: { matchId: string }) {
  const cue = useOverlayDirector(matchId);
  const active = cue?.kind === 'result' ? cue : null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {active && (
          <motion.div
            key="result"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            className="bg-gradient-to-br from-brand-dark to-brand rounded-3xl px-16 py-10 shadow-2xl border-2 border-green-400/30 text-center min-w-[700px]"
          >
            <BroadcastText size="xl" className="text-green-300 block mb-2">Match Result</BroadcastText>
            <BroadcastText size="4xl" className="text-white block">
              {(active.data as any).resultSummary ?? 'Match Complete'}
            </BroadcastText>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: TossCard**

`apps/overlays/src/features/overlay/components/overlays/TossCard.tsx`:

```tsx
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useOverlayDirector } from '../../hooks/useOverlayDirector';
import { BroadcastText } from '../primitives/BroadcastText';

export function TossCard({ matchId }: { matchId: string }) {
  const cue = useOverlayDirector(matchId);
  const active = cue?.kind === 'toss' ? cue : null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {active && (
          <motion.div
            key="toss"
            initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-brand-dark rounded-3xl px-14 py-8 border-2 border-green-400/40 text-center"
          >
            <BroadcastText size="lg" className="text-green-300 block mb-1">Toss</BroadcastText>
            <BroadcastText size="4xl" className="text-white block">
              {(active.data as any).winnerName} won the toss
            </BroadcastText>
            <BroadcastText size="2xl" className="text-yellow-300 mt-2 block">
              Elected to {(active.data as any).decision}
            </BroadcastText>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 3: SponsorStrip**

`apps/overlays/src/features/overlay/components/overlays/SponsorStrip.tsx`:

```tsx
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Sponsor { name: string; logoUrl?: string; tagline?: string; }

const DEFAULT_SPONSORS: Sponsor[] = [
  { name: 'Cricket Academy', tagline: 'Nurturing champions' },
  { name: 'Sports Authority', tagline: 'Official Equipment Partner' },
];

export function SponsorStrip({ matchId, sponsors = DEFAULT_SPONSORS }: { matchId: string; sponsors?: Sponsor[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % sponsors.length), 8000);
    return () => clearInterval(t);
  }, [sponsors.length]);

  const sponsor = sponsors[idx];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-14 bg-brand-dark/90 border-t border-brand/50 flex items-center px-6">
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4"
        >
          <span className="text-green-400 text-xs uppercase tracking-widest">Presented by</span>
          <span className="text-white font-broadcast font-bold text-lg uppercase">{sponsor?.name}</span>
          {sponsor?.tagline && <span className="text-green-300 text-sm">{sponsor.tagline}</span>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Pages**

`apps/overlays/src/app/result/[matchId]/page.tsx`:

```tsx
import { ResultCard } from '@/features/overlay/components/overlays/ResultCard';
export default async function ResultPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <div className="relative w-[1920px] h-[1080px]"><ResultCard matchId={matchId} /></div>;
}
```

`apps/overlays/src/app/toss/[matchId]/page.tsx`:

```tsx
import { TossCard } from '@/features/overlay/components/overlays/TossCard';
export default async function TossPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <div className="relative w-[1920px] h-[1080px]"><TossCard matchId={matchId} /></div>;
}
```

`apps/overlays/src/app/sponsor/[matchId]/page.tsx`:

```tsx
import { SponsorStrip } from '@/features/overlay/components/overlays/SponsorStrip';
export default async function SponsorPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <div className="relative w-[1920px] h-[1080px]"><SponsorStrip matchId={matchId} /></div>;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/overlays/src/
git commit -m "feat(overlays): result card + toss card + sponsor strip overlays"
```

---

## Task 8: LowerThird Overlay

**Files:**
- Create: `apps/overlays/src/features/overlay/components/overlays/LowerThird.tsx`
- Create: `apps/overlays/src/app/lower-third/[matchId]/page.tsx`

- [ ] **Step 1: LowerThird**

`apps/overlays/src/features/overlay/components/overlays/LowerThird.tsx`:

```tsx
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useScoreboardSnapshot } from '../../hooks/useScoreboardSnapshot';
import { BroadcastText } from '../primitives/BroadcastText';

export function LowerThird({ matchId }: { matchId: string }) {
  const snap = useScoreboardSnapshot(matchId);
  const { striker, bowler } = snap;

  return (
    <div className="absolute bottom-24 left-8 right-8 pointer-events-none">
      <AnimatePresence>
        <motion.div
          key={`${striker.id}-${bowler.id}`}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex gap-4"
        >
          {/* Striker card */}
          <div className="bg-brand-dark/90 rounded-xl px-5 py-3 border-l-4 border-obs-green">
            <BroadcastText size="sm" className="text-green-400 block">Batting</BroadcastText>
            <BroadcastText size="xl" className="text-white block">{striker.name}</BroadcastText>
            <BroadcastText size="lg" className="text-yellow-300">
              {striker.runs}({striker.balls}) · SR {striker.strikeRate.toFixed(0)}
            </BroadcastText>
          </div>

          {/* Bowler card */}
          <div className="bg-brand-dark/90 rounded-xl px-5 py-3 border-l-4 border-obs-red">
            <BroadcastText size="sm" className="text-red-400 block">Bowling</BroadcastText>
            <BroadcastText size="xl" className="text-white block">{bowler.name}</BroadcastText>
            <BroadcastText size="lg" className="text-orange-300">
              {bowler.overs}-{bowler.runs}-{bowler.wickets} · Econ {bowler.economy.toFixed(2)}
            </BroadcastText>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Page**

`apps/overlays/src/app/lower-third/[matchId]/page.tsx`:

```tsx
import { LowerThird } from '@/features/overlay/components/overlays/LowerThird';
export default async function LowerThirdPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <div className="relative w-[1920px] h-[1080px]"><LowerThird matchId={matchId} /></div>;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/overlays/src/
git commit -m "feat(overlays): lower-third batter/bowler name card"
```

---

## Task 9: OBS Setup Guide Page

**Files:**
- Create: `apps/overlays/src/app/page.tsx`

- [ ] **Step 1: Create index page**

`apps/overlays/src/app/page.tsx`:

```tsx
const overlays = [
  { name: 'Main Scoreboard', path: '/main/{matchId}', desc: 'Persistent bottom-left score bar' },
  { name: 'Lower Third',     path: '/lower-third/{matchId}', desc: 'Batter & bowler name cards' },
  { name: 'Wicket',          path: '/wicket/{matchId}', desc: 'Auto-triggered on wicket event' },
  { name: 'Boundary',        path: '/boundary/{matchId}', desc: 'Auto-triggered on 4 or 6' },
  { name: 'Toss',            path: '/toss/{matchId}', desc: 'Toss result announcement' },
  { name: 'Result',          path: '/result/{matchId}', desc: 'Final match result card' },
  { name: 'Sponsor',         path: '/sponsor/{matchId}', desc: 'Rotating sponsor strip' },
];

export default function OverlayIndexPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8" style={{ width: '100%', height: 'auto' }}>
      <h1 className="text-2xl font-bold mb-2">SCF OBS Overlays</h1>
      <p className="text-gray-400 mb-6 text-sm">Add each URL as a Browser Source in OBS (1920×1080).</p>
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
      <p className="text-gray-500 text-xs mt-6">Replace {"{"} matchId {"}"} with your match UUID from the admin dashboard.</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/overlays/src/app/page.tsx
git commit -m "feat(overlays): overlay index page with OBS setup guide"
```

---

## Self-Review

| Requirement | Covered |
|---|---|
| Main lower scoreboard overlay | Task 5 |
| Lower third batter/bowler card | Task 8 |
| Wicket burst animation | Task 6 |
| Boundary 4/6 flash | Task 6 |
| Toss reveal | Task 7 |
| Match result card | Task 7 |
| Sponsor rotation strip | Task 7 |
| Transparent OBS background | Task 2 |
| Overlay Director FSM (priority cues) | Task 3 |
| Realtime event subscription | Task 3 |
| Framer Motion animations throughout | Tasks 5–8 |
| Broadcast typography system | Task 4 |
| 1920×1080 canvas layout | Throughout |
| OBS setup guide | Task 9 |
