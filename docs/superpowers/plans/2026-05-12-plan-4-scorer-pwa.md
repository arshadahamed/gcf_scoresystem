# SCF Plan 4 — Scorer PWA (Next.js 15, Offline-First)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Depends on:** Plan 2 complete (API running), Plan 3 auth patterns established.

**Goal:** Build the `apps/scorer` offline-first PWA for match scorers — a mobile-optimised score pad with IndexedDB outbox, optimistic UI, reconnect/replay, and all ball-type support (runs, wides, no-balls, byes, wickets, undo).

**Architecture:** Next.js 15 App Router, Client-heavy (scorer needs offline). Zustand stores optimistic innings state. Dexie manages IndexedDB outbox. Background sync drains outbox in-order with seq guard. TanStack Query handles server state for match setup queries.

**Tech Stack:** Next.js 15, TypeScript, Tailwind, ShadCN UI, Zustand 5, Dexie 4, TanStack Query v5, Framer Motion, next-pwa

---

## Folder Structure

```
apps/scorer/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                   # → /matches
│   ├── (auth)/login/page.tsx
│   └── matches/
│       ├── page.tsx               # Active matches list
│       └── [matchId]/
│           └── score/
│               └── page.tsx       # Score pad
├── features/
│   ├── auth/                      # Same pattern as admin
│   ├── match-setup/
│   │   ├── api/match-setup.queries.ts
│   │   └── components/
│   │       ├── MatchList.tsx
│   │       └── InningsSetup.tsx
│   └── scoring/
│       ├── stores/
│       │   └── innings.store.ts   # Zustand: optimistic innings state
│       ├── offline/
│       │   ├── outbox.db.ts       # Dexie setup
│       │   └── sync.service.ts    # Background drainer
│       ├── hooks/
│       │   ├── useBallSubmit.ts
│       │   ├── useInningsState.ts
│       │   └── useRealtimeSync.ts
│       └── components/
│           ├── ScorePad.tsx       # Main score input
│           ├── RunButtons.tsx
│           ├── ExtrasPanel.tsx
│           ├── WicketModal.tsx
│           ├── ScoreHeader.tsx
│           ├── CurrentOverDisplay.tsx
│           └── UndoButton.tsx
└── shared/
    ├── lib/
    │   ├── api-client.ts
    │   ├── supabase.ts
    │   └── query-client.ts
    └── components/
        └── Providers.tsx
```

---

## Task 1: Scaffold `apps/scorer`

**Files:**
- Create: `apps/scorer/package.json`
- Create: `apps/scorer/tsconfig.json`
- Create: `apps/scorer/next.config.ts`
- Create: `apps/scorer/tailwind.config.ts`
- Create: `apps/scorer/.env.example`

- [ ] **Step 1: Create package.json**

`apps/scorer/package.json`:

```json
{
  "name": "@scf/scorer",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3003",
    "build": "next build",
    "start": "next start --port 3003",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@scf/contracts": "workspace:*",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.59.0",
    "dexie": "^4.0.8",
    "framer-motion": "^11.0.0",
    "next": "15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "zod": "^3.23.0",
    "class-variance-authority": "^0.7.0",
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

- [ ] **Step 2: tsconfig.json**

`apps/scorer/tsconfig.json`:

```json
{
  "extends": "@scf/config/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx"]
}
```

- [ ] **Step 3: next.config.ts**

`apps/scorer/next.config.ts`:

```ts
import type { NextConfig } from 'next';
const config: NextConfig = {
  experimental: { typedRoutes: true },
};
export default config;
```

- [ ] **Step 4: .env.example**

`apps/scorer/.env.example`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 5: Init ShadCN + install**

```bash
cd apps/scorer
pnpm dlx shadcn@latest init -y
pnpm dlx shadcn@latest add button card dialog badge separator
pnpm install && pnpm dev
```

Expected: runs on port 3003.

- [ ] **Step 6: Copy shared lib from admin (same pattern)**

```bash
mkdir -p apps/scorer/src/shared/lib apps/scorer/src/shared/components
cp apps/admin/src/shared/lib/api-client.ts apps/scorer/src/shared/lib/
cp apps/admin/src/shared/lib/supabase.ts apps/scorer/src/shared/lib/
cp apps/admin/src/shared/lib/query-client.ts apps/scorer/src/shared/lib/
cp apps/admin/src/shared/components/Providers.tsx apps/scorer/src/shared/components/
```

- [ ] **Step 7: Commit**

```bash
cd ../..
git add apps/scorer/
git commit -m "chore(scorer): scaffold Next.js 15 scorer PWA"
```

---

## Task 2: Dexie Offline Outbox

**Files:**
- Create: `apps/scorer/src/features/scoring/offline/outbox.db.ts`
- Create: `apps/scorer/src/features/scoring/offline/sync.service.ts`

- [ ] **Step 1: Dexie outbox DB**

`apps/scorer/src/features/scoring/offline/outbox.db.ts`:

```ts
import Dexie, { type Table } from 'dexie';

export interface OutboxEntry {
  id?: number;        // auto-increment primary key
  inningsId: string;
  seq: number;        // expectedSeq at time of submission
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  extras: { wide: number; noBall: number; bye: number; legBye: number };
  wicket: { kind: string; dismissedPlayerId: string; fielderId: string|null; bowlerId: string|null } | null;
  status: 'pending' | 'syncing' | 'failed';
  createdAt: number;  // Date.now()
  failReason?: string;
}

export interface SyncedBall {
  id?: number;
  inningsId: string;
  seq: number;
  serverSeq: number;
  syncedAt: number;
}

class OutboxDatabase extends Dexie {
  outbox!: Table<OutboxEntry, number>;
  synced!: Table<SyncedBall, number>;

  constructor() {
    super('scf-scorer-outbox');
    this.version(1).stores({
      outbox: '++id, inningsId, seq, status, createdAt',
      synced: '++id, inningsId, seq',
    });
  }
}

export const db = new OutboxDatabase();
```

- [ ] **Step 2: Sync service**

`apps/scorer/src/features/scoring/offline/sync.service.ts`:

```ts
import { db, type OutboxEntry } from './outbox.db';
import { apiRequest } from '@/shared/lib/api-client';
import { getAccessToken } from '@/shared/lib/supabase';

let isSyncing = false;

export async function drainOutbox(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const pending = await db.outbox
      .where('status').equals('pending')
      .sortBy('createdAt');

    for (const entry of pending) {
      await syncEntry(entry);
    }
  } finally {
    isSyncing = false;
  }
}

async function syncEntry(entry: OutboxEntry): Promise<void> {
  if (entry.id === undefined) return;
  await db.outbox.update(entry.id, { status: 'syncing' });

  try {
    const token = await getAccessToken();
    await apiRequest('/v1/scoring/balls', {
      method: 'POST',
      token: token ?? undefined,
      body: {
        inningsId:    entry.inningsId,
        strikerId:    entry.strikerId,
        nonStrikerId: entry.nonStrikerId,
        bowlerId:     entry.bowlerId,
        runs:         entry.runs,
        extras:       entry.extras,
        wicket:       entry.wicket,
        expectedSeq:  entry.seq,
      },
    });

    await db.outbox.delete(entry.id);
    await db.synced.add({
      inningsId: entry.inningsId,
      seq:       entry.seq,
      serverSeq: entry.seq,
      syncedAt:  Date.now(),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown error';
    await db.outbox.update(entry.id, { status: 'failed', failReason: reason });
    throw err; // stop drain on first failure to preserve ordering
  }
}

export async function pendingCount(inningsId: string): Promise<number> {
  return db.outbox.where({ inningsId, status: 'pending' }).count();
}

export async function failedEntries(inningsId: string): Promise<OutboxEntry[]> {
  return db.outbox.where({ inningsId, status: 'failed' }).toArray();
}

export async function retryFailed(inningsId: string): Promise<void> {
  await db.outbox.where({ inningsId, status: 'failed' }).modify({ status: 'pending' });
  await drainOutbox();
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/scorer/src/features/scoring/offline/
git commit -m "feat(scorer): Dexie offline outbox + sync service (in-order drain, retry)"
```

---

## Task 3: Zustand Innings Store (Optimistic State)

**Files:**
- Create: `apps/scorer/src/features/scoring/stores/innings.store.ts`

- [ ] **Step 1: Implement store**

`apps/scorer/src/features/scoring/stores/innings.store.ts`:

```ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface LivePlayer {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

export interface LiveBowler {
  id: string;
  name: string;
  overs: string;
  runs: number;
  wickets: number;
}

export interface InningsState {
  inningsId: string | null;
  matchId: string | null;
  totalRuns: number;
  totalWickets: number;
  legalBalls: number;      // for over display: legalBalls % 6
  oversComplete: number;   // Math.floor(legalBalls / 6)
  maxOvers: number;
  striker: LivePlayer | null;
  nonStriker: LivePlayer | null;
  bowler: LiveBowler | null;
  recentBalls: string[];   // e.g. ['4', '0', 'W', '1', '·', '6']
  isComplete: boolean;
  seq: number;             // next expected seq
}

interface InningsStore extends InningsState {
  init: (init: Pick<InningsState, 'inningsId'|'matchId'|'maxOvers'|'seq'>) => void;
  applyBall: (ball: {
    runs: number;
    extras: { wide: number; noBall: number; bye: number; legBye: number };
    isWicket: boolean;
  }) => void;
  undoLastBall: () => void;
  setStriker: (player: LivePlayer) => void;
  setNonStriker: (player: LivePlayer) => void;
  setBowler: (bowler: LiveBowler) => void;
  setFromServer: (state: Partial<InningsState>) => void;
}

export const useInningsStore = create<InningsStore>()(
  immer((set) => ({
    inningsId: null,
    matchId: null,
    totalRuns: 0,
    totalWickets: 0,
    legalBalls: 0,
    oversComplete: 0,
    maxOvers: 20,
    striker: null,
    nonStriker: null,
    bowler: null,
    recentBalls: [],
    isComplete: false,
    seq: 0,

    init: (init) => set((s) => {
      s.inningsId  = init.inningsId;
      s.matchId    = init.matchId;
      s.maxOvers   = init.maxOvers;
      s.seq        = init.seq;
    }),

    applyBall: (ball) => set((s) => {
      const totalExtras = ball.extras.wide + ball.extras.noBall + ball.extras.bye + ball.extras.legBye;
      s.totalRuns += ball.runs + totalExtras;

      const isIllegal = ball.extras.wide > 0 || ball.extras.noBall > 0;
      if (!isIllegal) {
        s.legalBalls++;
        s.oversComplete = Math.floor(s.legalBalls / 6);
      }

      if (ball.isWicket) s.totalWickets++;

      const symbol = ball.isWicket ? 'W'
        : ball.extras.wide > 0 ? 'Wd'
        : ball.extras.noBall > 0 ? 'Nb'
        : ball.runs === 0 ? '·'
        : String(ball.runs);

      s.recentBalls = [...s.recentBalls.slice(-29), symbol];
      s.seq++;

      // Update striker stats
      if (s.striker && !isIllegal) {
        s.striker.balls++;
        s.striker.runs += ball.runs;
        if (ball.runs === 4) s.striker.fours++;
        if (ball.runs === 6) s.striker.sixes++;
      }

      if (s.legalBalls % 6 === 0 && s.legalBalls > 0) {
        // End of over: swap striker/non-striker
        const tmp = s.striker;
        s.striker = s.nonStriker;
        s.nonStriker = tmp;
      }

      if (s.totalWickets >= 10 || s.oversComplete >= s.maxOvers) {
        s.isComplete = true;
      }
    }),

    undoLastBall: () => set((s) => {
      if (s.seq === 0 || s.recentBalls.length === 0) return;
      s.recentBalls = s.recentBalls.slice(0, -1);
      s.seq = Math.max(0, s.seq - 1);
      // Optimistic undo: don't decrement scores — server authoritative
    }),

    setStriker: (player) => set((s) => { s.striker = player; }),
    setNonStriker: (player) => set((s) => { s.nonStriker = player; }),
    setBowler: (bowler) => set((s) => { s.bowler = bowler; }),
    setFromServer: (state) => set((s) => Object.assign(s, state)),
  }))
);
```

- [ ] **Step 2: Install immer**

```bash
cd apps/scorer && pnpm add immer
```

- [ ] **Step 3: Commit**

```bash
cd ../..
git add apps/scorer/src/features/scoring/stores/
git commit -m "feat(scorer): Zustand innings store with optimistic ball application"
```

---

## Task 4: useBallSubmit Hook (Offline-Aware)

**Files:**
- Create: `apps/scorer/src/features/scoring/hooks/useBallSubmit.ts`
- Create: `apps/scorer/src/features/scoring/hooks/useOnlineStatus.ts`

- [ ] **Step 1: Online status hook**

`apps/scorer/src/features/scoring/hooks/useOnlineStatus.ts`:

```ts
'use client';
import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}
```

- [ ] **Step 2: useBallSubmit**

`apps/scorer/src/features/scoring/hooks/useBallSubmit.ts`:

```ts
'use client';
import { useCallback } from 'react';
import { useInningsStore } from '../stores/innings.store';
import { db } from '../offline/outbox.db';
import { drainOutbox } from '../offline/sync.service';
import { useOnlineStatus } from './useOnlineStatus';
import type { RecordBallDTO } from '@scf/contracts';

export function useBallSubmit() {
  const store = useInningsStore();
  const online = useOnlineStatus();

  const submitBall = useCallback(async (dto: Omit<RecordBallDTO, 'inningsId' | 'expectedSeq'>) => {
    if (!store.inningsId) throw new Error('No active innings');

    const extras = {
      wide:   dto.extras?.wide   ?? 0,
      noBall: dto.extras?.noBall ?? 0,
      bye:    dto.extras?.bye    ?? 0,
      legBye: dto.extras?.legBye ?? 0,
    };

    // 1. Apply optimistically to local state immediately
    store.applyBall({
      runs:     dto.runs,
      extras,
      isWicket: dto.wicket !== null,
    });

    // 2. Queue in IndexedDB outbox
    await db.outbox.add({
      inningsId:    store.inningsId,
      seq:          store.seq - 1, // seq was incremented by applyBall
      strikerId:    dto.strikerId,
      nonStrikerId: dto.nonStrikerId,
      bowlerId:     dto.bowlerId,
      runs:         dto.runs,
      extras,
      wicket:       dto.wicket ?? null,
      status:       'pending',
      createdAt:    Date.now(),
    });

    // 3. Drain immediately if online
    if (online) {
      await drainOutbox().catch(console.error);
    }
  }, [store, online]);

  const undoBall = useCallback(async () => {
    if (!store.inningsId) return;
    store.undoLastBall();
    // Remove last pending entry from outbox
    const lastPending = await db.outbox
      .where({ inningsId: store.inningsId, status: 'pending' })
      .last();
    if (lastPending?.id !== undefined) await db.outbox.delete(lastPending.id);
    // If online, send undo to API
    if (online) {
      const { getAccessToken } = await import('@/shared/lib/supabase');
      const { apiRequest } = await import('@/shared/lib/api-client');
      const token = await getAccessToken();
      await apiRequest(`/v1/scoring/innings/${store.inningsId}/balls/last`, {
        method: 'DELETE',
        token: token ?? undefined,
      }).catch(console.error);
    }
  }, [store, online]);

  return { submitBall, undoBall };
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/scorer/src/features/scoring/hooks/
git commit -m "feat(scorer): useBallSubmit hook — optimistic + offline outbox + drain"
```

---

## Task 5: Score Pad Components

**Files:**
- Create: `apps/scorer/src/features/scoring/components/ScoreHeader.tsx`
- Create: `apps/scorer/src/features/scoring/components/CurrentOverDisplay.tsx`
- Create: `apps/scorer/src/features/scoring/components/RunButtons.tsx`
- Create: `apps/scorer/src/features/scoring/components/ExtrasPanel.tsx`
- Create: `apps/scorer/src/features/scoring/components/WicketModal.tsx`
- Create: `apps/scorer/src/features/scoring/components/UndoButton.tsx`
- Create: `apps/scorer/src/features/scoring/components/ScorePad.tsx`

- [ ] **Step 1: ScoreHeader**

`apps/scorer/src/features/scoring/components/ScoreHeader.tsx`:

```tsx
'use client';
import { useInningsStore } from '../stores/innings.store';

export function ScoreHeader() {
  const { totalRuns, totalWickets, oversComplete, legalBalls, maxOvers, striker, bowler } = useInningsStore();
  const oversDisplay = `${oversComplete}.${legalBalls % 6}`;

  return (
    <div className="bg-brand-dark text-white p-4">
      <div className="text-center">
        <div className="text-4xl font-bold tracking-tight">
          {totalRuns}/{totalWickets}
        </div>
        <div className="text-green-300 text-lg mt-1">
          {oversDisplay} / {maxOvers} overs
        </div>
      </div>

      <div className="mt-3 flex justify-between text-sm">
        <div>
          <span className="text-green-300">Bat </span>
          <span className="font-semibold">{striker?.name ?? '—'}</span>
          <span className="text-green-300 ml-2">{striker?.runs ?? 0}({striker?.balls ?? 0})</span>
        </div>
        <div>
          <span className="text-green-300">Bowl </span>
          <span className="font-semibold">{bowler?.name ?? '—'}</span>
          <span className="text-green-300 ml-2">{bowler?.overs ?? '0.0'}-{bowler?.runs ?? 0}-{bowler?.wickets ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: CurrentOverDisplay**

`apps/scorer/src/features/scoring/components/CurrentOverDisplay.tsx`:

```tsx
'use client';
import { useInningsStore } from '../stores/innings.store';

const ballColor: Record<string, string> = {
  'W':  'bg-red-500 text-white',
  'Wd': 'bg-yellow-400 text-black',
  'Nb': 'bg-orange-400 text-black',
  '4':  'bg-blue-500 text-white',
  '6':  'bg-purple-600 text-white',
  '·':  'bg-gray-200 text-gray-700',
};

const defaultColor = 'bg-green-100 text-green-800';

export function CurrentOverDisplay() {
  const { recentBalls, legalBalls, oversComplete } = useInningsStore();
  const thisOverStart = oversComplete * 6;
  const thisOver = recentBalls.slice(thisOverStart);

  return (
    <div className="p-3 bg-white border-b">
      <p className="text-xs text-gray-400 mb-2">Over {oversComplete + 1}</p>
      <div className="flex gap-2 flex-wrap">
        {thisOver.map((b, i) => (
          <span key={i} className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${ballColor[b] ?? defaultColor}`}>
            {b}
          </span>
        ))}
        {Array.from({ length: Math.max(0, 6 - thisOver.length) }).map((_, i) => (
          <span key={`e${i}`} className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: RunButtons**

`apps/scorer/src/features/scoring/components/RunButtons.tsx`:

```tsx
'use client';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

const runs = [0, 1, 2, 3, 4, 5, 6, 7];

const runStyle = (r: number) => {
  if (r === 4) return 'bg-blue-500 text-white border-blue-600 text-xl';
  if (r === 6) return 'bg-purple-600 text-white border-purple-700 text-xl';
  return 'bg-white text-gray-800 border-gray-300';
};

export function RunButtons({ onRun }: { onRun: (runs: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {runs.map((r) => (
        <motion.button
          key={r}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRun(r)}
          className={cn(
            'h-16 rounded-xl border-2 font-bold text-2xl transition-colors',
            runStyle(r),
          )}
        >
          {r}
        </motion.button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: ExtrasPanel**

`apps/scorer/src/features/scoring/components/ExtrasPanel.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';

interface Extras { wide: number; noBall: number; bye: number; legBye: number; }

export function ExtrasPanel({ onExtras }: { onExtras: (extras: Extras, runs: number) => void }) {
  const [active, setActive] = useState<string | null>(null);

  const extras: { label: string; key: keyof Extras; runsAdded: number }[] = [
    { label: 'Wide',   key: 'wide',   runsAdded: 1 },
    { label: 'No Ball',key: 'noBall', runsAdded: 1 },
    { label: 'Bye',    key: 'bye',    runsAdded: 0 },
    { label: 'Leg Bye',key: 'legBye', runsAdded: 0 },
  ];

  const handle = (key: keyof Extras, runs: number) => {
    const extra: Extras = { wide: 0, noBall: 0, bye: 0, legBye: 0 };
    extra[key] = 1;
    onExtras(extra, runs);
    setActive(key);
    setTimeout(() => setActive(null), 300);
  };

  return (
    <div className="grid grid-cols-2 gap-2 px-4 pb-3">
      {extras.map(({ label, key, runsAdded }) => (
        <Button key={key} variant="outline"
          className={`h-12 text-sm ${active === key ? 'ring-2 ring-yellow-400' : ''}`}
          onClick={() => handle(key, runsAdded)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: WicketModal**

`apps/scorer/src/features/scoring/components/WicketModal.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

const WICKET_KINDS = ['bowled','caught','lbw','run_out','stumped','hit_wicket','retired_hurt'] as const;
type WicketKind = typeof WICKET_KINDS[number];

interface WicketData {
  kind: WicketKind;
  dismissedPlayerId: string;
  fielderId: string | null;
  bowlerId: string | null;
}

export function WicketModal({
  open, onClose, onConfirm, strikerId, bowlerId,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (wicket: WicketData) => void;
  strikerId: string;
  bowlerId: string;
}) {
  const [kind, setKind] = useState<WicketKind>('bowled');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Wicket</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <Select value={kind} onValueChange={v => setKind(v as WicketKind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {WICKET_KINDS.map(k => (
                <SelectItem key={k} value={k}>{k.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white"
            onClick={() => onConfirm({ kind, dismissedPlayerId: strikerId, fielderId: null, bowlerId })}>
            Confirm Wicket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: UndoButton**

`apps/scorer/src/features/scoring/components/UndoButton.tsx`:

```tsx
'use client';
import { motion } from 'framer-motion';
import { Undo2 } from 'lucide-react';

export function UndoButton({ onUndo }: { onUndo: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }}
      onClick={onUndo}
      className="flex items-center gap-2 bg-orange-100 text-orange-700 border border-orange-300 px-4 py-2 rounded-xl font-semibold text-sm"
    >
      <Undo2 size={16} /> Undo last ball
    </motion.button>
  );
}
```

- [ ] **Step 7: ScorePad (main compositor)**

`apps/scorer/src/features/scoring/components/ScorePad.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { ScoreHeader } from './ScoreHeader';
import { CurrentOverDisplay } from './CurrentOverDisplay';
import { RunButtons } from './RunButtons';
import { ExtrasPanel } from './ExtrasPanel';
import { WicketModal } from './WicketModal';
import { UndoButton } from './UndoButton';
import { useBallSubmit } from '../hooks/useBallSubmit';
import { useInningsStore } from '../stores/innings.store';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';

export function ScorePad() {
  const store = useInningsStore();
  const { submitBall, undoBall } = useBallSubmit();
  const online = useOnlineStatus();
  const [wicketOpen, setWicketOpen] = useState(false);
  const [pendingRuns, setPendingRuns] = useState(0);

  const handleRun = async (runs: number) => {
    if (!store.striker || !store.nonStriker || !store.bowler) return;
    await submitBall({
      strikerId:    store.striker.id,
      nonStrikerId: store.nonStriker.id,
      bowlerId:     store.bowler.id,
      runs,
      extras:       {},
      wicket:       null,
    });
  };

  const handleExtras = async (extras: Record<string, number>, runs: number) => {
    if (!store.striker || !store.nonStriker || !store.bowler) return;
    await submitBall({
      strikerId:    store.striker.id,
      nonStrikerId: store.nonStriker.id,
      bowlerId:     store.bowler.id,
      runs,
      extras,
      wicket:       null,
    });
  };

  const handleWicketTrigger = (runs: number) => {
    setPendingRuns(runs);
    setWicketOpen(true);
  };

  const handleWicketConfirm = async (wicket: Parameters<typeof submitBall>[0]['wicket']) => {
    if (!store.striker || !store.nonStriker || !store.bowler) return;
    setWicketOpen(false);
    await submitBall({
      strikerId:    store.striker.id,
      nonStrikerId: store.nonStriker.id,
      bowlerId:     store.bowler.id,
      runs:         pendingRuns,
      extras:       {},
      wicket,
    });
  };

  if (store.isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-brand-dark text-white gap-4">
        <h2 className="text-3xl font-bold">Innings Complete</h2>
        <p className="text-green-300 text-xl">{store.totalRuns}/{store.totalWickets}</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto h-screen flex flex-col bg-gray-50">
      {/* Online indicator */}
      <div className={`flex items-center gap-1 px-3 py-1 text-xs ${online ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {online ? <Wifi size={12} /> : <WifiOff size={12} />}
        {online ? 'Live' : 'Offline — balls queued'}
      </div>

      <ScoreHeader />
      <CurrentOverDisplay />

      <div className="flex-1 overflow-auto">
        <RunButtons onRun={handleRun} />
        <ExtrasPanel onExtras={handleExtras} />

        <div className="px-4 pb-4 flex items-center justify-between">
          <button
            onClick={() => handleWicketTrigger(0)}
            className="h-12 px-6 rounded-xl bg-red-600 text-white font-bold text-lg"
          >
            WICKET
          </button>
          <UndoButton onUndo={undoBall} />
        </div>
      </div>

      <WicketModal
        open={wicketOpen}
        onClose={() => setWicketOpen(false)}
        onConfirm={handleWicketConfirm}
        strikerId={store.striker?.id ?? ''}
        bowlerId={store.bowler?.id ?? ''}
      />
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/scorer/src/features/scoring/components/
git commit -m "feat(scorer): full score pad — RunButtons, ExtrasPanel, WicketModal, UndoButton, ScorePad"
```

---

## Task 6: Match List + Score Page

**Files:**
- Create: `apps/scorer/src/features/match-setup/api/match-setup.queries.ts`
- Create: `apps/scorer/src/features/match-setup/components/MatchList.tsx`
- Create: `apps/scorer/src/app/layout.tsx`
- Create: `apps/scorer/src/app/page.tsx`
- Create: `apps/scorer/src/app/matches/page.tsx`
- Create: `apps/scorer/src/app/matches/[matchId]/score/page.tsx`
- Create: `apps/scorer/src/styles/globals.css`

- [ ] **Step 1: Match setup queries**

`apps/scorer/src/features/match-setup/api/match-setup.queries.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/lib/api-client';
import type { MatchDTO } from '@scf/contracts';

export function useLiveMatches() {
  return useQuery({
    queryKey: ['matches', 'live'],
    queryFn: () => apiRequest<MatchDTO[]>('/v1/matches?status=live'),
    refetchInterval: 10_000,
  });
}
```

- [ ] **Step 2: MatchList**

`apps/scorer/src/features/match-setup/components/MatchList.tsx`:

```tsx
'use client';
import Link from 'next/link';
import { useLiveMatches } from '../api/match-setup.queries';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

export function MatchList() {
  const { data, isLoading } = useLiveMatches();

  if (isLoading) return <p className="text-gray-400 text-center py-8">Loading matches…</p>;
  if (!data?.length) return <p className="text-gray-400 text-center py-8">No live matches. Check with your admin.</p>;

  return (
    <div className="space-y-3">
      {data.map(m => (
        <Link key={m.id} href={`/matches/${m.id}/score`}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{m.teamAName} vs {m.teamBName}</p>
                <p className="text-sm text-gray-500">{m.venue ?? 'TBD'}</p>
              </div>
              <Badge className="bg-green-100 text-green-700">{m.status}</Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Root layout + pages**

`apps/scorer/src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`apps/scorer/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/shared/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SCF Scorer',
  description: 'Ball-by-ball cricket scorer',
  manifest: '/manifest.json',
  themeColor: '#1a6b3c',
  viewport: { width: 'device-width', initialScale: 1 },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}><Providers>{children}</Providers></body>
    </html>
  );
}
```

`apps/scorer/src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
export default function Root() { redirect('/matches'); }
```

`apps/scorer/src/app/matches/page.tsx`:

```tsx
import { MatchList } from '@/features/match-setup/components/MatchList';

export default function MatchesPage() {
  return (
    <div className="max-w-sm mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Scorer Dashboard</h1>
        <p className="text-sm text-gray-500">Select a live match to score</p>
      </div>
      <MatchList />
    </div>
  );
}
```

- [ ] **Step 4: Score page (wire innings store)**

`apps/scorer/src/app/matches/[matchId]/score/page.tsx`:

```tsx
'use client';
import { use, useEffect } from 'react';
import { ScorePad } from '@/features/scoring/components/ScorePad';
import { useInningsStore } from '@/features/scoring/stores/innings.store';

// In production: fetch active innings for this match from API and init store
// For this scaffold, we init with defaults so scorer can start immediately
export default function ScorePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const init = useInningsStore(s => s.init);
  const setStriker    = useInningsStore(s => s.setStriker);
  const setNonStriker = useInningsStore(s => s.setNonStriker);
  const setBowler     = useInningsStore(s => s.setBowler);

  useEffect(() => {
    // TODO(Plan 4 extension): fetch innings snapshot from API
    // For now seed with placeholder players
    init({ inningsId: `innings-${matchId}`, matchId, maxOvers: 20, seq: 0 });
    setStriker({ id: 'p1', name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0 });
    setNonStriker({ id: 'p2', name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0 });
    setBowler({ id: 'b1', name: 'Bowler', overs: '0.0', runs: 0, wickets: 0 });
  }, [matchId, init, setStriker, setNonStriker, setBowler]);

  return <ScorePad />;
}
```

- [ ] **Step 5: Test manually**

```bash
cd apps/scorer && pnpm dev
```

Navigate to `http://localhost:3003/matches`. Sign in if prompted. Navigate to `http://localhost:3003/matches/m1/score`. Score pad should appear. Tap run buttons — score should update instantly. Turn off Wi-Fi — balls should queue (check DevTools → IndexedDB → scf-scorer-outbox). Turn Wi-Fi back on — should drain.

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/scorer/src/
git commit -m "feat(scorer): match list + score page + full offline-first score pad"
```

---

## Task 7: PWA Manifest

**Files:**
- Create: `apps/scorer/public/manifest.json`

- [ ] **Step 1: Create manifest**

`apps/scorer/public/manifest.json`:

```json
{
  "name": "SCF Scorer",
  "short_name": "SCF",
  "description": "School Cricket Fiesta ball-by-ball scorer",
  "start_url": "/matches",
  "display": "standalone",
  "background_color": "#1a6b3c",
  "theme_color": "#1a6b3c",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Create placeholder icons (replace with actual 192×192 and 512×512 PNGs):

```bash
cd apps/scorer/public
# Use any PNG image as placeholder — rename to icon-192.png and icon-512.png
```

- [ ] **Step 2: Commit**

```bash
cd ../../..
git add apps/scorer/public/
git commit -m "feat(scorer): PWA manifest for installable mobile scorer"
```

---

## Self-Review

| Requirement | Covered |
|---|---|
| Mobile-first score pad | Task 5 (ScorePad, RunButtons, ExtrasPanel) |
| Ball types: runs, wides, no-balls, byes, wickets, undo | Tasks 4, 5 |
| Offline-first with IndexedDB | Task 2 (Dexie outbox) |
| Background sync drain | Task 2 (sync.service) |
| Optimistic UI | Task 3 (Zustand store) |
| Concurrent scorer guard (seq) | Task 4 (useBallSubmit seq tracking) |
| Online status indicator | Task 5 (ScorePad header) |
| Framer Motion animations | Task 5 (RunButtons, UndoButton) |
| PWA manifest | Task 7 |
| Realtime sync (outgoing events to API) | Task 4 (drain on reconnect) |
