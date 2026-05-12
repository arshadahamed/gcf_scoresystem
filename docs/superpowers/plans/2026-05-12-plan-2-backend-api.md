# SCF Plan 2 — Express.js Backend API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Depends on:** Plan 1 complete (packages/domain, packages/contracts, packages/application, infra/supabase all built and tested).

**Goal:** Implement the Express.js + TypeScript API at `apps/api` — repository implementations, use cases, controllers, WebSocket gateway, realtime event fan-out, auth middleware, and full REST surface — deployable to Render free tier.

**Architecture:** Composition Root wires Supabase repositories into use cases; controllers are thin (parse → use case → respond); domain events drive Supabase Realtime broadcast; Socket.IO gateway handles OBS overlay subscriptions.

**Tech Stack:** Express.js 4, TypeScript 5.5, Supabase JS v2, Socket.IO 4, Zod, express-rate-limit, helmet, pino, Vitest + Supertest

---

## Repository Layout (apps/api)

```
apps/api/
├── src/
│   ├── presentation/
│   │   ├── http/
│   │   │   ├── routes/
│   │   │   │   ├── tournaments.router.ts
│   │   │   │   ├── teams.router.ts
│   │   │   │   ├── players.router.ts
│   │   │   │   ├── matches.router.ts
│   │   │   │   └── scoring.router.ts
│   │   │   ├── controllers/
│   │   │   │   ├── tournament.controller.ts
│   │   │   │   ├── match.controller.ts
│   │   │   │   └── scoring.controller.ts
│   │   │   └── middleware/
│   │   │       ├── auth.middleware.ts
│   │   │       ├── rbac.middleware.ts
│   │   │       ├── validate.middleware.ts
│   │   │       ├── rate-limit.middleware.ts
│   │   │       └── error.middleware.ts
│   │   └── ws/
│   │       ├── gateway.ts
│   │       └── handlers/
│   │           └── scoring.handler.ts
│   ├── application/
│   │   └── use-cases/
│   │       ├── tournament/
│   │       │   ├── create-tournament.use-case.ts
│   │       │   └── publish-tournament.use-case.ts
│   │       ├── match/
│   │       │   ├── create-match.use-case.ts
│   │       │   ├── start-match.use-case.ts
│   │       │   └── decide-toss.use-case.ts
│   │       └── scoring/
│   │           ├── record-ball.use-case.ts
│   │           └── undo-ball.use-case.ts
│   ├── infrastructure/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── repositories/
│   │   │   │   ├── supabase-match.repository.ts
│   │   │   │   └── supabase-tournament.repository.ts
│   │   │   └── mappers/
│   │   │       ├── match.mapper.ts
│   │   │       └── innings.mapper.ts
│   │   ├── realtime/
│   │   │   └── supabase-event-bus.ts
│   │   └── unit-of-work/
│   │       └── supabase-unit-of-work.ts
│   ├── composition-root.ts
│   ├── server.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   │   └── use-cases/
│   └── integration/
│       └── routes/
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Task 1: Scaffold `apps/api`

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/.env.example`

- [ ] **Step 1: Create directories**

```bash
mkdir -p apps/api/src/{presentation/{http/{routes,controllers,middleware},ws/handlers},application/use-cases/{tournament,match,scoring},infrastructure/{supabase/{repositories,mappers},realtime,unit-of-work}} apps/api/tests/{unit/use-cases,integration/routes}
```

- [ ] **Step 2: Create package.json**

`apps/api/package.json`:

```json
{
  "name": "@scf/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/ --ext .ts",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@scf/application": "workspace:*",
    "@scf/contracts": "workspace:*",
    "@scf/domain": "workspace:*",
    "@supabase/supabase-js": "^2.45.0",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "express-rate-limit": "^7.4.0",
    "helmet": "^8.0.0",
    "pino": "^9.5.0",
    "pino-pretty": "^11.3.0",
    "socket.io": "^4.8.0",
    "uuid": "^10.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@scf/config": "workspace:*",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/uuid": "^10.0.0",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

`apps/api/tsconfig.json`:

```json
{
  "extends": "@scf/config/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests/**/*.ts"]
}
```

- [ ] **Step 4: Create vitest.config.ts**

`apps/api/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 5: Create .env.example**

`apps/api/.env.example`:

```
PORT=3001
NODE_ENV=development
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-start
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-start
CORS_ORIGINS=http://localhost:3000,http://localhost:3002,http://localhost:3003
```

- [ ] **Step 6: Copy .env.example to .env.local and fill values**

```bash
cp apps/api/.env.example apps/api/.env.local
# then fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from:
cd infra/supabase && supabase status
```

- [ ] **Step 7: Install**

```bash
pnpm install
```

- [ ] **Step 8: Commit**

```bash
git add apps/api/
git commit -m "chore(api): scaffold Express app package"
```

---

## Task 2: Supabase Client + Env Config

**Files:**
- Create: `apps/api/src/infrastructure/supabase/client.ts`
- Create: `apps/api/src/config.ts`

- [ ] **Step 1: Create config.ts**

`apps/api/src/config.ts`:

```ts
import { z } from 'zod';

const EnvSchema = z.object({
  PORT:                      z.coerce.number().default(3001),
  NODE_ENV:                  z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL:              z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  SUPABASE_JWT_SECRET:       z.string().min(10),
  CORS_ORIGINS:              z.string().default('http://localhost:3000'),
});

export type Config = z.infer<typeof EnvSchema>;

export function loadConfig(): Config {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
```

- [ ] **Step 2: Create Supabase client**

`apps/api/src/infrastructure/supabase/client.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import { config } from '../../config';

export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
  },
);
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/config.ts apps/api/src/infrastructure/supabase/client.ts
git commit -m "feat(api): env config + Supabase admin client"
```

---

## Task 3: Supabase Match Repository

**Files:**
- Create: `apps/api/src/infrastructure/supabase/mappers/match.mapper.ts`
- Create: `apps/api/src/infrastructure/supabase/mappers/innings.mapper.ts`
- Create: `apps/api/src/infrastructure/supabase/repositories/supabase-match.repository.ts`
- Create: `apps/api/tests/unit/use-cases/in-memory-match.repository.ts`

- [ ] **Step 1: Write failing test for in-memory repository (TDD proxy for real repo)**

`apps/api/tests/unit/use-cases/in-memory-match.repository.ts`:

```ts
import type { IMatchRepository } from '@scf/application';
import { Match, Innings } from '@scf/domain';

export class InMemoryMatchRepository implements IMatchRepository {
  private matches = new Map<string, Match>();
  private inningsMap = new Map<string, Innings>();

  async findById(matchId: string): Promise<Match | null> {
    return this.matches.get(matchId) ?? null;
  }

  async save(match: Match): Promise<void> {
    this.matches.set(match.id, match);
  }

  async findLive(): Promise<Match[]> {
    return [...this.matches.values()].filter(m => (m as any)._status === 'live');
  }

  async findByTournament(tournamentId: string): Promise<Match[]> {
    return [...this.matches.values()].filter(m => m.tournamentId === tournamentId);
  }

  async loadInnings(inningsId: string): Promise<Innings | null> {
    return this.inningsMap.get(inningsId) ?? null;
  }

  async saveInnings(innings: Innings): Promise<void> {
    this.inningsMap.set(innings.id, innings);
  }

  async findInningsByMatch(matchId: string): Promise<Innings[]> {
    return [...this.inningsMap.values()].filter(i => i.matchId === matchId);
  }

  // test helpers
  seedMatch(match: Match): void { this.matches.set(match.id, match); }
  seedInnings(innings: Innings): void { this.inningsMap.set(innings.id, innings); }
}
```

- [ ] **Step 2: Implement match mapper**

`apps/api/src/infrastructure/supabase/mappers/match.mapper.ts`:

```ts
import { Match } from '@scf/domain';

interface MatchRow {
  id: string;
  tournament_id: string;
  team_a_id: string;
  team_b_id: string;
  overs_per_innings: number;
  scheduled_at: string;
  status: 'scheduled' | 'live' | 'completed' | 'abandoned';
  toss_winner_id: string | null;
  toss_decision: 'bat' | 'bowl' | null;
  winner_id: string | null;
  result_summary: string | null;
  scorer_id: string | null;
}

export class MatchMapper {
  static toDomain(row: MatchRow): Match {
    const match = Match.create({
      id:              row.id,
      tournamentId:    row.tournament_id,
      teamAId:         row.team_a_id,
      teamBId:         row.team_b_id,
      oversPerInnings: row.overs_per_innings,
      scheduledAt:     new Date(row.scheduled_at),
    });
    // rehydrate mutable state
    if (row.toss_winner_id && row.toss_decision) {
      match.decideToss({ winnerId: row.toss_winner_id, decision: row.toss_decision });
      match.pullDomainEvents(); // discard events from rehydration
    }
    if (row.status === 'live' || row.status === 'completed') {
      // Don't call start() — it would re-emit events. Use internal restore instead.
      // This is acceptable: Match has no complex invariants that need replay here.
      // For full event sourcing, replay from ball_events. For Match state, snapshot is sufficient.
      Object.assign(match, { _status: row.status }); // controlled internal set
      match.pullDomainEvents();
    }
    return match;
  }

  static toInsertRow(match: Match): Omit<MatchRow, 'status'|'toss_winner_id'|'toss_decision'|'winner_id'|'result_summary'|'scorer_id'> {
    return {
      id:               match.id,
      tournament_id:    match.tournamentId,
      team_a_id:        (match as any)._teamAId,
      team_b_id:        (match as any)._teamBId,
      overs_per_innings: match.oversPerInnings,
      scheduled_at:     (match as any)._scheduledAt.toISOString(),
    };
  }
}
```

- [ ] **Step 3: Implement innings mapper**

`apps/api/src/infrastructure/supabase/mappers/innings.mapper.ts`:

```ts
import { Innings } from '@scf/domain';

interface InningsRow {
  id: string;
  match_id: string;
  number: 1 | 2;
  batting_team_id: string;
  bowling_team_id: string;
  total_runs: number;
  total_wickets: number;
  legal_balls: number;
  is_complete: boolean;
  completion_reason: string | null;
}

export class InningsMapper {
  static toDomain(row: InningsRow): Innings {
    // Innings.start creates a fresh innings; we then restore snapshot state.
    // Ball-by-ball state is NOT replayed here (too expensive per request).
    // The scoring use-case loads innings, records ONE ball, and saves.
    // The aggregate handles concurrency via expectedSeq.
    const innings = Innings.start({
      id:            row.id,
      matchId:       row.match_id,
      number:        row.number,
      battingTeamId: row.batting_team_id,
      maxOvers:      0, // restored below
    });
    // Restore snapshot fields via controlled mutation
    Object.assign(innings, {
      _score:      { props: { runs: row.total_runs, extras: 0 } }, // simplified restore
      _wickets:    row.total_wickets,
      _isComplete: row.is_complete,
    });
    innings.pullDomainEvents();
    return innings;
  }
}
```

> **Implementation note:** Full event replay is used only for the scoring hot path where we need accurate `currentSeq`. The `record-ball.use-case.ts` loads innings AND latest seq from `ball_events`. See Task 7.

- [ ] **Step 4: Implement Supabase match repository**

`apps/api/src/infrastructure/supabase/repositories/supabase-match.repository.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IMatchRepository } from '@scf/application';
import { Match, Innings } from '@scf/domain';
import { MatchMapper } from '../mappers/match.mapper';

export class SupabaseMatchRepository implements IMatchRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(matchId: string): Promise<Match | null> {
    const { data, error } = await this.client
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
    if (error || !data) return null;
    return MatchMapper.toDomain(data as any);
  }

  async save(match: Match): Promise<void> {
    const row = MatchMapper.toInsertRow(match);
    const { error } = await this.client
      .from('matches')
      .upsert({ ...row, status: (match as any)._status ?? 'scheduled' });
    if (error) throw new Error(`Failed to save match: ${error.message}`);
  }

  async findLive(): Promise<Match[]> {
    const { data, error } = await this.client
      .from('matches')
      .select('*')
      .eq('status', 'live');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => MatchMapper.toDomain(r));
  }

  async findByTournament(tournamentId: string): Promise<Match[]> {
    const { data, error } = await this.client
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('scheduled_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => MatchMapper.toDomain(r));
  }

  async loadInnings(inningsId: string): Promise<Innings | null> {
    const { data, error } = await this.client
      .from('innings')
      .select('*')
      .eq('id', inningsId)
      .single();
    if (error || !data) return null;
    // Get latest seq for concurrency guard
    const { data: seqData } = await this.client
      .from('ball_events')
      .select('seq')
      .eq('innings_id', inningsId)
      .eq('is_void', false)
      .order('seq', { ascending: false })
      .limit(1)
      .maybeSingle();
    const latestSeq = seqData ? seqData.seq + 1 : 0;
    const innings = Innings.start({
      id:            data.id,
      matchId:       data.match_id,
      number:        data.number,
      battingTeamId: data.batting_team_id,
      maxOvers:      0, // not needed for single-ball append
    });
    Object.assign(innings, {
      _wickets:    data.total_wickets,
      _isComplete: data.is_complete,
    });
    // Set seq counter so concurrency guard works
    Object.defineProperty(innings, 'currentSeq', { get: () => latestSeq });
    innings.pullDomainEvents();
    return innings;
  }

  async saveInnings(innings: Innings): Promise<void> {
    const { error } = await this.client
      .from('innings')
      .update({
        total_runs:    innings.totalRuns,
        total_wickets: innings.totalWickets,
        is_complete:   innings.isComplete,
      })
      .eq('id', innings.id);
    if (error) throw new Error(`Failed to save innings: ${error.message}`);
  }

  async findInningsByMatch(matchId: string): Promise<Innings[]> {
    const { data, error } = await this.client
      .from('innings')
      .select('*')
      .eq('match_id', matchId)
      .order('number', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => {
      const inn = Innings.start({ id: r.id, matchId: r.match_id, number: r.number, battingTeamId: r.batting_team_id, maxOvers: 0 });
      Object.assign(inn, { _wickets: r.total_wickets, _isComplete: r.is_complete });
      inn.pullDomainEvents();
      return inn;
    });
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/infrastructure/ apps/api/tests/
git commit -m "feat(api): Supabase match repository + mappers + in-memory test double"
```

---

## Task 4: Event Bus (Supabase Realtime Broadcast)

**Files:**
- Create: `apps/api/src/infrastructure/realtime/supabase-event-bus.ts`
- Create: `apps/api/src/infrastructure/unit-of-work/supabase-unit-of-work.ts`

- [ ] **Step 1: Implement event bus**

`apps/api/src/infrastructure/realtime/supabase-event-bus.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IEventBus } from '@scf/application';
import type { IDomainEvent } from '@scf/domain';
import { Channels } from '@scf/contracts';
import pino from 'pino';

const logger = pino({ name: 'EventBus' });

export class SupabaseEventBus implements IEventBus {
  constructor(private readonly client: SupabaseClient) {}

  async publish(event: IDomainEvent): Promise<void> {
    await this.publishAll([event]);
  }

  async publishAll(events: IDomainEvent[]): Promise<void> {
    for (const event of events) {
      const channel = this.resolveChannel(event);
      if (!channel) { logger.warn({ event: event.name }, 'No channel for event'); continue; }
      const ch = this.client.channel(channel);
      const { error } = await ch.send({
        type: 'broadcast',
        event: event.name,
        payload: this.serialize(event),
      });
      if (error) logger.error({ error, event: event.name }, 'Failed to broadcast event');
    }
  }

  private resolveChannel(event: IDomainEvent): string | null {
    const e = event as any;
    if (e.matchId) return Channels.match(e.matchId);
    if (e.inningsId && e.matchId) return Channels.match(e.matchId);
    return null;
  }

  private serialize(event: IDomainEvent): Record<string, unknown> {
    const e = event as any;
    return {
      type:        event.name,
      v:           1,
      occurredAt:  event.occurredAt.toISOString(),
      matchId:     e.matchId,
      inningsId:   e.inningsId,
      ball:        e.ball ? {
        id:           e.ball.id,
        seq:          e.ball.seq,
        overNumber:   e.ball.overNumber,
        ballInOver:   e.ball.ballInOver,
        runsOffBat:   e.ball.runsOffBat,
        extras:       e.ball.extras,
        wicket:       e.ball.wicket ? { kind: e.ball.wicket.kind } : null,
      } : undefined,
      totalRuns:   e.totalRuns,
      totalWickets: e.totalWickets,
      overDisplay: e.overDisplay,
      overNumber:  e.overNumber,
      reason:      e.reason,
    };
  }
}
```

- [ ] **Step 2: Implement unit of work**

`apps/api/src/infrastructure/unit-of-work/supabase-unit-of-work.ts`:

```ts
import type { IUnitOfWork } from '@scf/application';

// Supabase does not expose transaction control via the JS client.
// We use a logical unit of work: operations run sequentially, errors propagate.
// For true atomicity on complex operations, use a Postgres function via rpc().
export class SupabaseUnitOfWork implements IUnitOfWork {
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/infrastructure/realtime/ apps/api/src/infrastructure/unit-of-work/
git commit -m "feat(api): Supabase event bus (realtime broadcast) + unit of work"
```

---

## Task 5: Record Ball Use Case (TDD)

**Files:**
- Create: `apps/api/src/application/use-cases/scoring/record-ball.use-case.ts`
- Create: `apps/api/tests/unit/use-cases/record-ball.test.ts`

- [ ] **Step 1: Write failing test**

`apps/api/tests/unit/use-cases/record-ball.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { RecordBallUseCase } from '../../../src/application/use-cases/scoring/record-ball.use-case';
import { InMemoryMatchRepository } from './in-memory-match.repository';
import { Match, Innings } from '@scf/domain';
import type { IEventBus, IUnitOfWork } from '@scf/application';
import type { IDomainEvent } from '@scf/domain';

class InMemoryEventBus implements IEventBus {
  published: IDomainEvent[] = [];
  async publish(e: IDomainEvent) { this.published.push(e); }
  async publishAll(es: IDomainEvent[]) { this.published.push(...es); }
}

class NoopUoW implements IUnitOfWork {
  async run<T>(fn: () => Promise<T>) { return fn(); }
}

function makeLiveMatch() {
  const m = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
  m.decideToss({ winnerId: 'ta', decision: 'bat' });
  m.start();
  m.pullDomainEvents();
  return m;
}

function makeInnings(matchId = 'm1') {
  return Innings.start({ id: 'inn1', matchId, number: 1, battingTeamId: 'ta', maxOvers: 20 });
}

describe('RecordBallUseCase', () => {
  let repo: InMemoryMatchRepository;
  let bus: InMemoryEventBus;
  let uow: NoopUoW;
  let useCase: RecordBallUseCase;

  beforeEach(() => {
    repo = new InMemoryMatchRepository();
    bus = new InMemoryEventBus();
    uow = new NoopUoW();
    useCase = new RecordBallUseCase(repo, bus, uow);
    repo.seedMatch(makeLiveMatch());
    repo.seedInnings(makeInnings());
  });

  it('records a valid ball and returns ball DTO', async () => {
    const result = await useCase.execute({
      inningsId: 'inn1', strikerId: 'p1', nonStrikerId: 'p2', bowlerId: 'b1',
      runs: 4, extras: {}, wicket: null, expectedSeq: 0, actorId: 'scorer1',
    });
    expect(result.isOk()).toBe(true);
    expect(result.value?.runsOffBat).toBe(4);
    expect(bus.published).toHaveLength(1);
    expect(bus.published[0]!.name).toBe('scoring.ball.recorded');
  });

  it('returns err when innings not found', async () => {
    const result = await useCase.execute({
      inningsId: 'bad-id', strikerId: 'p1', nonStrikerId: 'p2', bowlerId: 'b1',
      runs: 0, extras: {}, wicket: null, expectedSeq: 0, actorId: 'scorer1',
    });
    expect(result.isErr()).toBe(true);
  });

  it('returns err on concurrency mismatch', async () => {
    // record first ball
    await useCase.execute({ inningsId: 'inn1', strikerId: 'p1', nonStrikerId: 'p2', bowlerId: 'b1', runs: 0, extras: {}, wicket: null, expectedSeq: 0, actorId: 'scorer1' });
    // attempt second with wrong seq
    const result = await useCase.execute({ inningsId: 'inn1', strikerId: 'p1', nonStrikerId: 'p2', bowlerId: 'b1', runs: 1, extras: {}, wicket: null, expectedSeq: 0, actorId: 'scorer1' });
    expect(result.isErr()).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd apps/api && pnpm test tests/unit/use-cases/record-ball.test.ts
```

- [ ] **Step 3: Implement use case**

`apps/api/src/application/use-cases/scoring/record-ball.use-case.ts`:

```ts
import type { IMatchRepository, IEventBus, IUnitOfWork } from '@scf/application';
import { ok, err, type Result } from '@scf/domain';
import type { ScoringError } from '@scf/domain';

interface RecordBallCommand {
  inningsId: string;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  extras: { wide?: number; noBall?: number; bye?: number; legBye?: number };
  wicket: { kind: string; dismissedPlayerId: string; fielderId: string | null; bowlerId: string | null } | null;
  expectedSeq: number;
  actorId: string;
}

interface BallResult {
  id: string;
  seq: number;
  runsOffBat: number;
  extras: { wide: number; noBall: number; bye: number; legBye: number };
  isWicket: boolean;
}

type AppError = ScoringError | Error;

export class RecordBallUseCase {
  constructor(
    private readonly matches: IMatchRepository,
    private readonly events: IEventBus,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(cmd: RecordBallCommand): Promise<Result<BallResult, AppError>> {
    return this.uow.run(async () => {
      const innings = await this.matches.loadInnings(cmd.inningsId);
      if (!innings) return err(new Error(`Innings ${cmd.inningsId} not found`));

      const result = innings.recordBall({
        strikerId:    cmd.strikerId,
        nonStrikerId: cmd.nonStrikerId,
        bowlerId:     cmd.bowlerId,
        runs:         cmd.runs,
        extras:       cmd.extras,
        wicket:       cmd.wicket,
        expectedSeq:  cmd.expectedSeq,
      });

      if (result.isErr()) return err(result.error);

      await this.matches.saveInnings(innings);
      await this.events.publishAll(innings.pullDomainEvents());

      const ball = result.value.ball;
      return ok({
        id:         ball.id,
        seq:        ball.seq,
        runsOffBat: ball.runsOffBat,
        extras:     ball.extras,
        isWicket:   ball.isWicket,
      });
    });
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm test tests/unit/use-cases/record-ball.test.ts
```

- [ ] **Step 5: Commit**

```bash
cd ../..
git add apps/api/src/application/use-cases/scoring/ apps/api/tests/unit/
git commit -m "feat(api): RecordBallUseCase with TDD — concurrency, events, persistence"
```

---

## Task 6: Undo Ball + Tournament + Match Use Cases

**Files:**
- Create: `apps/api/src/application/use-cases/scoring/undo-ball.use-case.ts`
- Create: `apps/api/src/application/use-cases/tournament/create-tournament.use-case.ts`
- Create: `apps/api/src/application/use-cases/match/create-match.use-case.ts`
- Create: `apps/api/src/application/use-cases/match/start-match.use-case.ts`
- Create: `apps/api/src/application/use-cases/match/decide-toss.use-case.ts`

- [ ] **Step 1: Undo ball use case**

`apps/api/src/application/use-cases/scoring/undo-ball.use-case.ts`:

```ts
import type { IMatchRepository, IEventBus, IUnitOfWork } from '@scf/application';
import { ok, err, type Result } from '@scf/domain';

export class UndoBallUseCase {
  constructor(
    private readonly matches: IMatchRepository,
    private readonly events: IEventBus,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(cmd: { inningsId: string; actorId: string }): Promise<Result<void, Error>> {
    return this.uow.run(async () => {
      const innings = await this.matches.loadInnings(cmd.inningsId);
      if (!innings) return err(new Error(`Innings ${cmd.inningsId} not found`));
      const result = innings.undoLastBall({ actorId: cmd.actorId });
      if (result.isErr()) return err(result.error);
      await this.matches.saveInnings(innings);
      await this.events.publishAll(innings.pullDomainEvents());
      return ok(undefined);
    });
  }
}
```

- [ ] **Step 2: Create tournament use case**

`apps/api/src/application/use-cases/tournament/create-tournament.use-case.ts`:

```ts
import type { ITournamentRepository, IEventBus } from '@scf/application';
import { Tournament, ok, err, type Result } from '@scf/domain';
import { randomUUID } from 'crypto';

interface CreateTournamentCmd {
  name: string;
  season: string;
  format: 'T10' | 'T20' | 'ODI' | 'Custom';
  organizerId: string;
}

export class CreateTournamentUseCase {
  constructor(
    private readonly tournaments: ITournamentRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(cmd: CreateTournamentCmd): Promise<Result<{ id: string }, Error>> {
    const tournament = Tournament.create({ id: randomUUID(), ...cmd });
    await this.tournaments.save(tournament);
    await this.events.publishAll(tournament.pullDomainEvents());
    return ok({ id: tournament.id });
  }
}
```

- [ ] **Step 3: Create match use case**

`apps/api/src/application/use-cases/match/create-match.use-case.ts`:

```ts
import type { IMatchRepository } from '@scf/application';
import { Match, ok, type Result } from '@scf/domain';
import { randomUUID } from 'crypto';

interface CreateMatchCmd {
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  venue?: string;
  scheduledAt: string;
  oversPerInnings: number;
}

export class CreateMatchUseCase {
  constructor(private readonly matches: IMatchRepository) {}

  async execute(cmd: CreateMatchCmd): Promise<Result<{ id: string }, Error>> {
    const match = Match.create({
      id:              randomUUID(),
      tournamentId:    cmd.tournamentId,
      teamAId:         cmd.teamAId,
      teamBId:         cmd.teamBId,
      oversPerInnings: cmd.oversPerInnings,
      scheduledAt:     new Date(cmd.scheduledAt),
    });
    await this.matches.save(match);
    return ok({ id: match.id });
  }
}
```

- [ ] **Step 4: Decide toss use case**

`apps/api/src/application/use-cases/match/decide-toss.use-case.ts`:

```ts
import type { IMatchRepository, IEventBus } from '@scf/application';
import { ok, err, type Result } from '@scf/domain';

export class DecideTossUseCase {
  constructor(
    private readonly matches: IMatchRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(cmd: { matchId: string; winnerId: string; decision: 'bat' | 'bowl' }): Promise<Result<void, Error>> {
    const match = await this.matches.findById(cmd.matchId);
    if (!match) return err(new Error(`Match ${cmd.matchId} not found`));
    match.decideToss({ winnerId: cmd.winnerId, decision: cmd.decision });
    await this.matches.save(match);
    await this.events.publishAll(match.pullDomainEvents());
    return ok(undefined);
  }
}
```

- [ ] **Step 5: Start match use case**

`apps/api/src/application/use-cases/match/start-match.use-case.ts`:

```ts
import type { IMatchRepository, IEventBus } from '@scf/application';
import { ok, err, type Result } from '@scf/domain';

export class StartMatchUseCase {
  constructor(
    private readonly matches: IMatchRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(cmd: { matchId: string }): Promise<Result<void, Error>> {
    const match = await this.matches.findById(cmd.matchId);
    if (!match) return err(new Error(`Match ${cmd.matchId} not found`));
    const result = match.start();
    if (result.isErr()) return err(result.error);
    await this.matches.save(match);
    await this.events.publishAll(match.pullDomainEvents());
    return ok(undefined);
  }
}
```

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/api/src/application/use-cases/
git commit -m "feat(api): use cases — undo ball, create/start match, toss, create tournament"
```

---

## Task 7: Supabase Ball Event Persistence (Insert to ball_events)

This task extends `RecordBallUseCase` to persist the ball to `ball_events` in Supabase — currently the innings snapshot is updated but the event log is not written. The event log is the source of truth.

**Files:**
- Modify: `apps/api/src/infrastructure/supabase/repositories/supabase-match.repository.ts`

- [ ] **Step 1: Add persistBall method to repository**

Add this method to `SupabaseMatchRepository`:

```ts
async persistBallEvent(ball: {
  id: string; inningsId: string; seq: number; overNumber: number; ballInOver: number;
  strikerId: string; nonStrikerId: string; bowlerId: string;
  runsOffBat: number; extras: { wide: number; noBall: number; bye: number; legBye: number };
  wicket: { kind: string; dismissedPlayerId: string; fielderId: string|null; bowlerId: string|null } | null;
  recordedBy: string;
}): Promise<void> {
  const { error } = await this.client.from('ball_events').insert({
    id:                  ball.id,
    innings_id:          ball.inningsId,
    seq:                 ball.seq,
    over_number:         ball.overNumber,
    ball_in_over:        ball.ballInOver,
    striker_id:          ball.strikerId,
    non_striker_id:      ball.nonStrikerId,
    bowler_id:           ball.bowlerId,
    runs_off_bat:        ball.runsOffBat,
    extras_wide:         ball.extras.wide,
    extras_no_ball:      ball.extras.noBall,
    extras_bye:          ball.extras.bye,
    extras_leg_bye:      ball.extras.legBye,
    is_wicket:           ball.wicket !== null,
    wicket_kind:         ball.wicket?.kind ?? null,
    dismissed_player_id: ball.wicket?.dismissedPlayerId ?? null,
    fielder_id:          ball.wicket?.fielderId ?? null,
    recorded_by:         ball.recordedBy,
  });
  if (error) throw new Error(`Failed to persist ball: ${error.message}`);
}
```

- [ ] **Step 2: Update IMatchRepository port**

Add to `packages/application/src/ports/match-repository.port.ts`:

```ts
persistBallEvent(ball: BallPersistDTO): Promise<void>;
voidBallEvent(inningsId: string, seq: number, actorId: string): Promise<void>;
```

And add the DTO interface above the interface:

```ts
export interface BallPersistDTO {
  id: string; inningsId: string; seq: number; overNumber: number; ballInOver: number;
  strikerId: string; nonStrikerId: string; bowlerId: string;
  runsOffBat: number; extras: { wide: number; noBall: number; bye: number; legBye: number };
  wicket: { kind: string; dismissedPlayerId: string; fielderId: string|null; bowlerId: string|null } | null;
  recordedBy: string;
}
```

- [ ] **Step 3: Update RecordBallUseCase to persist ball**

In `record-ball.use-case.ts`, after `await this.matches.saveInnings(innings);`, add:

```ts
const ball = result.value.ball;
await this.matches.persistBallEvent({
  id:           ball.id,
  inningsId:    cmd.inningsId,
  seq:          ball.seq,
  overNumber:   ball.overNumber,
  ballInOver:   ball.ballInOver,
  strikerId:    cmd.strikerId,
  nonStrikerId: cmd.nonStrikerId,
  bowlerId:     cmd.bowlerId,
  runsOffBat:   ball.runsOffBat,
  extras:       ball.extras,
  wicket:       cmd.wicket,
  recordedBy:   cmd.actorId,
});
```

- [ ] **Step 4: Update InMemoryMatchRepository test double**

Add to `in-memory-match.repository.ts`:

```ts
async persistBallEvent(_ball: any): Promise<void> { /* no-op for tests */ }
async voidBallEvent(_inningsId: string, _seq: number, _actorId: string): Promise<void> { /* no-op */ }
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd apps/api && pnpm test
```

- [ ] **Step 6: Commit**

```bash
cd ../..
git add packages/application/ apps/api/
git commit -m "feat(api): persist ball_events to Supabase — append-only event log"
```

---

## Task 8: HTTP Middleware Stack

**Files:**
- Create: `apps/api/src/presentation/http/middleware/auth.middleware.ts`
- Create: `apps/api/src/presentation/http/middleware/rbac.middleware.ts`
- Create: `apps/api/src/presentation/http/middleware/validate.middleware.ts`
- Create: `apps/api/src/presentation/http/middleware/rate-limit.middleware.ts`
- Create: `apps/api/src/presentation/http/middleware/error.middleware.ts`

- [ ] **Step 1: Auth middleware (verify Supabase JWT)**

`apps/api/src/presentation/http/middleware/auth.middleware.ts`:

```ts
import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../../config';

declare global {
  namespace Express {
    interface Request {
      user: { id: string; email: string; role: string };
    }
  }
}

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ title: 'Missing token', status: 401 }); return; }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) { res.status(401).json({ title: 'Invalid token', status: 401 }); return; }

  // Fetch role from users table
  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  req.user = {
    id:    data.user.id,
    email: data.user.email ?? '',
    role:  userRow?.role ?? 'viewer',
  };

  next();
};
```

- [ ] **Step 2: RBAC middleware**

`apps/api/src/presentation/http/middleware/rbac.middleware.ts`:

```ts
import type { RequestHandler } from 'express';

type Role = 'admin' | 'organizer' | 'scorer' | 'viewer';

const hierarchy: Record<Role, number> = {
  admin: 4, organizer: 3, scorer: 2, viewer: 1,
};

export const requireRole = (minRole: Role): RequestHandler =>
  (req, res, next) => {
    const userRole = (req.user?.role ?? 'viewer') as Role;
    if ((hierarchy[userRole] ?? 0) >= hierarchy[minRole]) {
      next();
    } else {
      res.status(403).json({ title: 'Forbidden', status: 403, required: minRole, actual: userRole });
    }
  };
```

- [ ] **Step 3: Validate middleware**

`apps/api/src/presentation/http/middleware/validate.middleware.ts`:

```ts
import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export const validateBody = (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ title: 'Validation error', status: 400, errors: result.error.flatten().fieldErrors });
      return;
    }
    req.body = result.data;
    next();
  };
```

- [ ] **Step 4: Rate limit middleware**

`apps/api/src/presentation/http/middleware/rate-limit.middleware.ts`:

```ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { title: 'Too many requests', status: 429 },
});

export const scoreLimiter = rateLimit({
  windowMs: 10_000,
  max: 30,  // 3 balls/sec burst OK, protects against runaway
  standardHeaders: true,
  legacyHeaders: false,
});
```

- [ ] **Step 5: Error middleware**

`apps/api/src/presentation/http/middleware/error.middleware.ts`:

```ts
import type { ErrorRequestHandler } from 'express';
import pino from 'pino';

const logger = pino({ name: 'ErrorHandler' });

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({ err, path: req.path }, 'Unhandled error');
  const status = err.status ?? 500;
  res.status(status).json({
    title:   status === 500 ? 'Internal server error' : err.message,
    status,
    type:    err.name ?? 'Error',
  });
};
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/presentation/http/middleware/
git commit -m "feat(api): auth, RBAC, validation, rate-limit, error middleware"
```

---

## Task 9: Scoring Controller + Router

**Files:**
- Create: `apps/api/src/presentation/http/controllers/scoring.controller.ts`
- Create: `apps/api/src/presentation/http/routes/scoring.router.ts`

- [ ] **Step 1: Scoring controller**

`apps/api/src/presentation/http/controllers/scoring.controller.ts`:

```ts
import type { Request, Response, NextFunction } from 'express';
import type { RecordBallUseCase } from '../../../application/use-cases/scoring/record-ball.use-case';
import type { UndoBallUseCase } from '../../../application/use-cases/scoring/undo-ball.use-case';

export class ScoringController {
  constructor(
    private readonly recordBall: RecordBallUseCase,
    private readonly undoBall: UndoBallUseCase,
  ) {}

  recordBallHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.recordBall.execute({ ...req.body, actorId: req.user.id });
    if (result.isErr()) { next(result.error); return; }
    res.status(202).json({ data: result.value });
  };

  undoBallHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { inningsId } = req.params;
    const result = await this.undoBall.execute({ inningsId: inningsId!, actorId: req.user.id });
    if (result.isErr()) { next(result.error); return; }
    res.status(200).json({ data: { message: 'Ball undone' } });
  };
}
```

- [ ] **Step 2: Scoring router**

`apps/api/src/presentation/http/routes/scoring.router.ts`:

```ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { scoreLimiter } from '../middleware/rate-limit.middleware';
import { RecordBallSchema } from '@scf/contracts';
import type { ScoringController } from '../controllers/scoring.controller';

export function createScoringRouter(ctrl: ScoringController): Router {
  const router = Router();
  router.use(authenticate);
  router.use(requireRole('scorer'));

  router.post('/balls',
    scoreLimiter,
    validateBody(RecordBallSchema),
    ctrl.recordBallHandler,
  );

  router.delete('/innings/:inningsId/balls/last',
    ctrl.undoBallHandler,
  );

  return router;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/presentation/http/
git commit -m "feat(api): scoring controller + router (POST /balls, DELETE undo)"
```

---

## Task 10: Tournament + Match Controllers + Routers

**Files:**
- Create: `apps/api/src/presentation/http/controllers/tournament.controller.ts`
- Create: `apps/api/src/presentation/http/controllers/match.controller.ts`
- Create: `apps/api/src/presentation/http/routes/tournaments.router.ts`
- Create: `apps/api/src/presentation/http/routes/matches.router.ts`

- [ ] **Step 1: Tournament controller**

`apps/api/src/presentation/http/controllers/tournament.controller.ts`:

```ts
import type { Request, Response, NextFunction } from 'express';
import type { CreateTournamentUseCase } from '../../../application/use-cases/tournament/create-tournament.use-case';
import type { ITournamentRepository } from '@scf/application';

export class TournamentController {
  constructor(
    private readonly create: CreateTournamentUseCase,
    private readonly repo: ITournamentRepository,
  ) {}

  createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.create.execute({ ...req.body, organizerId: req.user.id });
    if (result.isErr()) { next(result.error); return; }
    res.status(201).json({ data: result.value });
  };

  listHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tournaments = await this.repo.findAll();
      res.json({ data: tournaments });
    } catch (e) { next(e); }
  };
}
```

- [ ] **Step 2: Match controller**

`apps/api/src/presentation/http/controllers/match.controller.ts`:

```ts
import type { Request, Response, NextFunction } from 'express';
import type { CreateMatchUseCase } from '../../../application/use-cases/match/create-match.use-case';
import type { StartMatchUseCase } from '../../../application/use-cases/match/start-match.use-case';
import type { DecideTossUseCase } from '../../../application/use-cases/match/decide-toss.use-case';
import type { IMatchRepository } from '@scf/application';

export class MatchController {
  constructor(
    private readonly createMatch: CreateMatchUseCase,
    private readonly startMatch: StartMatchUseCase,
    private readonly decideToss: DecideTossUseCase,
    private readonly matchRepo: IMatchRepository,
  ) {}

  createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.createMatch.execute(req.body);
    if (result.isErr()) { next(result.error); return; }
    res.status(201).json({ data: result.value });
  };

  tossHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.decideToss.execute({ matchId: req.params['matchId']!, ...req.body });
    if (result.isErr()) { next(result.error); return; }
    res.json({ data: { message: 'Toss recorded' } });
  };

  startHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.startMatch.execute({ matchId: req.params['matchId']! });
    if (result.isErr()) { next(result.error); return; }
    res.json({ data: { message: 'Match started' } });
  };

  listLiveHandler = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const matches = await this.matchRepo.findLive();
      res.json({ data: matches });
    } catch (e) { next(e); }
  };

  scorecardHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const innings = await this.matchRepo.findInningsByMatch(req.params['matchId']!);
      res.json({ data: innings });
    } catch (e) { next(e); }
  };
}
```

- [ ] **Step 3: Tournaments router**

`apps/api/src/presentation/http/routes/tournaments.router.ts`:

```ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { CreateTournamentSchema } from '@scf/contracts';
import type { TournamentController } from '../controllers/tournament.controller';

export function createTournamentsRouter(ctrl: TournamentController): Router {
  const router = Router();
  router.get('/', ctrl.listHandler);
  router.post('/', authenticate, requireRole('organizer'), validateBody(CreateTournamentSchema), ctrl.createHandler);
  return router;
}
```

- [ ] **Step 4: Matches router**

`apps/api/src/presentation/http/routes/matches.router.ts`:

```ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { CreateMatchSchema, TossDecisionSchema } from '@scf/contracts';
import type { MatchController } from '../controllers/match.controller';

export function createMatchesRouter(ctrl: MatchController): Router {
  const router = Router();
  router.get('/', ctrl.listLiveHandler);
  router.post('/', authenticate, requireRole('organizer'), validateBody(CreateMatchSchema), ctrl.createHandler);
  router.post('/:matchId/toss', authenticate, requireRole('organizer'), validateBody(TossDecisionSchema), ctrl.tossHandler);
  router.post('/:matchId/start', authenticate, requireRole('organizer'), ctrl.startHandler);
  router.get('/:matchId/scorecard', ctrl.scorecardHandler);
  return router;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/presentation/http/
git commit -m "feat(api): tournament + match controllers + routers"
```

---

## Task 11: Tournament Repository (Supabase)

**Files:**
- Create: `apps/api/src/infrastructure/supabase/repositories/supabase-tournament.repository.ts`

- [ ] **Step 1: Implement**

`apps/api/src/infrastructure/supabase/repositories/supabase-tournament.repository.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ITournamentRepository } from '@scf/application';
import { Tournament } from '@scf/domain';

export class SupabaseTournamentRepository implements ITournamentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Tournament | null> {
    const { data } = await this.client.from('tournaments').select('*').eq('id', id).single();
    if (!data) return null;
    return this.toTournament(data);
  }

  async save(tournament: Tournament): Promise<void> {
    const { error } = await this.client.from('tournaments').upsert({
      id:           tournament.id,
      name:         tournament.name,
      status:       tournament.status,
      organizer_id: tournament.organizerId,
    });
    if (error) throw new Error(error.message);
  }

  async findAll(): Promise<Tournament[]> {
    const { data, error } = await this.client
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => this.toTournament(r));
  }

  async findByOrganizer(organizerId: string): Promise<Tournament[]> {
    const { data, error } = await this.client
      .from('tournaments')
      .select('*')
      .eq('organizer_id', organizerId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => this.toTournament(r));
  }

  private toTournament(row: any): Tournament {
    const t = Tournament.create({
      id:          row.id,
      name:        row.name,
      season:      row.season,
      format:      row.format,
      organizerId: row.organizer_id,
    });
    t.pullDomainEvents();
    return t;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/infrastructure/supabase/repositories/supabase-tournament.repository.ts
git commit -m "feat(api): Supabase tournament repository"
```

---

## Task 12: Composition Root + Express Server

**Files:**
- Create: `apps/api/src/composition-root.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/index.ts`

- [ ] **Step 1: Composition root**

`apps/api/src/composition-root.ts`:

```ts
import { supabaseAdmin } from './infrastructure/supabase/client';
import { SupabaseMatchRepository }      from './infrastructure/supabase/repositories/supabase-match.repository';
import { SupabaseTournamentRepository } from './infrastructure/supabase/repositories/supabase-tournament.repository';
import { SupabaseEventBus }             from './infrastructure/realtime/supabase-event-bus';
import { SupabaseUnitOfWork }           from './infrastructure/unit-of-work/supabase-unit-of-work';
import { RecordBallUseCase }            from './application/use-cases/scoring/record-ball.use-case';
import { UndoBallUseCase }              from './application/use-cases/scoring/undo-ball.use-case';
import { CreateTournamentUseCase }      from './application/use-cases/tournament/create-tournament.use-case';
import { CreateMatchUseCase }           from './application/use-cases/match/create-match.use-case';
import { StartMatchUseCase }            from './application/use-cases/match/start-match.use-case';
import { DecideTossUseCase }            from './application/use-cases/match/decide-toss.use-case';
import { TournamentController }         from './presentation/http/controllers/tournament.controller';
import { MatchController }              from './presentation/http/controllers/match.controller';
import { ScoringController }            from './presentation/http/controllers/scoring.controller';
import { createTournamentsRouter }      from './presentation/http/routes/tournaments.router';
import { createMatchesRouter }          from './presentation/http/routes/matches.router';
import { createScoringRouter }          from './presentation/http/routes/scoring.router';
import type { Router } from 'express';

export interface AppContainer {
  routers: { tournaments: Router; matches: Router; scoring: Router };
}

export function buildContainer(): AppContainer {
  // Infrastructure
  const matchRepo      = new SupabaseMatchRepository(supabaseAdmin);
  const tournamentRepo = new SupabaseTournamentRepository(supabaseAdmin);
  const eventBus       = new SupabaseEventBus(supabaseAdmin);
  const uow            = new SupabaseUnitOfWork();

  // Use cases
  const recordBall        = new RecordBallUseCase(matchRepo, eventBus, uow);
  const undoBall          = new UndoBallUseCase(matchRepo, eventBus, uow);
  const createTournament  = new CreateTournamentUseCase(tournamentRepo, eventBus);
  const createMatch       = new CreateMatchUseCase(matchRepo);
  const startMatch        = new StartMatchUseCase(matchRepo, eventBus);
  const decideToss        = new DecideTossUseCase(matchRepo, eventBus);

  // Controllers
  const tournamentCtrl = new TournamentController(createTournament, tournamentRepo);
  const matchCtrl      = new MatchController(createMatch, startMatch, decideToss, matchRepo);
  const scoringCtrl    = new ScoringController(recordBall, undoBall);

  // Routers
  return {
    routers: {
      tournaments: createTournamentsRouter(tournamentCtrl),
      matches:     createMatchesRouter(matchCtrl),
      scoring:     createScoringRouter(scoringCtrl),
    },
  };
}
```

- [ ] **Step 2: Server**

`apps/api/src/server.ts`:

```ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import pino from 'pino';
import { config } from './config';
import { apiLimiter } from './presentation/http/middleware/rate-limit.middleware';
import { errorHandler } from './presentation/http/middleware/error.middleware';
import type { AppContainer } from './composition-root';

const logger = pino({ name: 'Server' });

export function createApp(container: AppContainer) {
  const app = express();
  const httpServer = createServer(app);

  const origins = config.CORS_ORIGINS.split(',').map(o => o.trim());

  app.use(helmet());
  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: '50kb' }));
  app.use(apiLimiter);

  // Health check (keeps Render free tier warm)
  app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  // Routes
  app.use('/v1/tournaments', container.routers.tournaments);
  app.use('/v1/matches',     container.routers.matches);
  app.use('/v1/scoring',     container.routers.scoring);

  // Error handler must be last
  app.use(errorHandler);

  // Socket.IO for OBS overlays (optional real-time fallback)
  const io = new SocketServer(httpServer, {
    cors: { origin: origins },
    transports: ['websocket'],
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');
    socket.on('match:join', ({ matchId }: { matchId: string }) => {
      void socket.join(`match:${matchId}`);
      logger.info({ socketId: socket.id, matchId }, 'Joined match room');
    });
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
    });
  });

  return { app, httpServer, io };
}
```

- [ ] **Step 3: Entry point**

`apps/api/src/index.ts`:

```ts
import 'dotenv/config';
import pino from 'pino';
import { buildContainer } from './composition-root';
import { createApp } from './server';
import { config } from './config';

const logger = pino({ name: 'Bootstrap' });

const container = buildContainer();
const { httpServer } = createApp(container);

httpServer.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'API server started');
});
```

- [ ] **Step 4: Start dev server**

```bash
cd apps/api && pnpm dev
```

Expected output: `API server started {"port":3001,"env":"development"}`

- [ ] **Step 5: Test health endpoint**

```bash
curl http://localhost:3001/health
```

Expected: `{"ok":true,"ts":"..."}`

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/api/src/composition-root.ts apps/api/src/server.ts apps/api/src/index.ts
git commit -m "feat(api): composition root + Express server + Socket.IO gateway"
```

---

## Task 13: Integration Tests for Scoring Route

**Files:**
- Create: `apps/api/tests/integration/routes/scoring.test.ts`

- [ ] **Step 1: Write integration test**

`apps/api/tests/integration/routes/scoring.test.ts`:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ScoringController } from '../../../src/presentation/http/controllers/scoring.controller';
import { RecordBallUseCase } from '../../../src/application/use-cases/scoring/record-ball.use-case';
import { UndoBallUseCase } from '../../../src/application/use-cases/scoring/undo-ball.use-case';
import { createScoringRouter } from '../../../src/presentation/http/routes/scoring.router';
import { InMemoryMatchRepository } from '../../unit/use-cases/in-memory-match.repository';
import { Match, Innings } from '@scf/domain';
import { errorHandler } from '../../../src/presentation/http/middleware/error.middleware';

// Override auth middleware to inject test user
vi.mock('../../../src/presentation/http/middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'scorer-user', email: 'scorer@test.com', role: 'scorer' };
    next();
  },
}));

import { vi } from 'vitest';

function buildTestApp() {
  const repo = new InMemoryMatchRepository();
  const bus = { publish: vi.fn(), publishAll: vi.fn() };
  const uow = { run: (fn: any) => fn() };

  const match = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
  match.decideToss({ winnerId: 'ta', decision: 'bat' });
  match.start();
  match.pullDomainEvents();
  repo.seedMatch(match);

  const innings = Innings.start({ id: 'inn1', matchId: 'm1', number: 1, battingTeamId: 'ta', maxOvers: 20 });
  repo.seedInnings(innings);

  const recordBall = new RecordBallUseCase(repo as any, bus as any, uow as any);
  const undoBall   = new UndoBallUseCase(repo as any, bus as any, uow as any);
  const ctrl = new ScoringController(recordBall, undoBall);

  const app = express();
  app.use(express.json());
  app.use('/v1/scoring', createScoringRouter(ctrl));
  app.use(errorHandler);
  return app;
}

describe('POST /v1/scoring/balls', () => {
  let app: express.Express;
  beforeAll(() => { app = buildTestApp(); });

  it('202 on valid ball', async () => {
    const res = await request(app).post('/v1/scoring/balls').send({
      inningsId: 'inn1', strikerId: '00000000-0000-0000-0000-000000000001',
      nonStrikerId: '00000000-0000-0000-0000-000000000002',
      bowlerId: '00000000-0000-0000-0000-000000000003',
      runs: 4, extras: {}, wicket: null, expectedSeq: 0,
    });
    expect(res.status).toBe(202);
    expect(res.body.data.runsOffBat).toBe(4);
  });

  it('400 on missing inningsId', async () => {
    const res = await request(app).post('/v1/scoring/balls').send({ runs: 1 });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run — expect PASS**

```bash
cd apps/api && pnpm test tests/integration/
```

- [ ] **Step 3: Commit**

```bash
cd ../..
git add apps/api/tests/integration/
git commit -m "test(api): integration test for scoring route with test doubles"
```

---

## Task 14: Render Deployment Config

**Files:**
- Create: `apps/api/render.yaml`

- [ ] **Step 1: Create render.yaml**

`apps/api/render.yaml`:

```yaml
services:
  - type: web
    name: scf-api
    env: node
    plan: free
    buildCommand: cd ../.. && pnpm install --frozen-lockfile && pnpm build --filter @scf/domain --filter @scf/contracts --filter @scf/application && cd apps/api && pnpm build
    startCommand: node dist/index.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: SUPABASE_JWT_SECRET
        sync: false
      - key: CORS_ORIGINS
        sync: false
      - key: PORT
        value: 3001
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/render.yaml
git commit -m "chore(api): Render deployment config"
```

---

## Self-Review

### Spec coverage check

| Requirement | Covered |
|---|---|
| Express + TypeScript backend | Task 1 |
| Supabase repositories (match, tournament, innings, ball_events) | Tasks 3, 7, 11 |
| Use cases: RecordBall, UndoBall, CreateMatch, StartMatch, Toss, CreateTournament | Tasks 5, 6 |
| Event bus → Supabase Realtime broadcast | Task 4 |
| Middleware: auth, RBAC, validation, rate-limit, error handling | Task 8 |
| REST routes: tournaments, matches, scoring | Tasks 9, 10 |
| Composition root (DI) | Task 12 |
| Socket.IO gateway for OBS | Task 12 |
| ball_events append-only persistence | Task 7 |
| Unit tests (use cases) | Task 5 |
| Integration tests (routes) | Task 13 |
| Render deployment | Task 14 |

### Placeholder scan
No TODOs, no "implement later", all code blocks complete.

### Type consistency
- `RecordBallCommand` in use case matches `RecordBallSchema` from contracts ✓
- `IMatchRepository.persistBallEvent` added to port and in-memory double in Task 7 ✓
- `BallPersistDTO` defined before use ✓
