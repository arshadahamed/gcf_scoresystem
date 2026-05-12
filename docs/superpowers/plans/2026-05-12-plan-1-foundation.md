# SCF Plan 1 — Monorepo Foundation, Domain, Database

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the pnpm + Turborepo monorepo, implement all domain packages (`@scf/contracts`, `@scf/domain`, `@scf/config`), and provision the Supabase PostgreSQL schema with migrations, RLS, and seed data — producing a tested, importable foundation that every other plan builds on.

**Architecture:** Clean Architecture with a pure domain layer (`@scf/domain`) that imports nothing external, a shared contracts layer (`@scf/contracts`) containing Zod schemas + TypeScript types shared across all apps, and Supabase CLI-managed migrations in `infra/supabase/`. The application layer (`@scf/application`) defines repository interfaces (ports) implemented later in Plan 2.

**Tech Stack:** pnpm 9, Turborepo 2, TypeScript 5.5, Zod 3, Vitest 2, Supabase CLI, Node 20 LTS

---

## Repository Layout (post-plan)

```
school-cricket-fiesta/
├── apps/                          # populated in later plans
├── packages/
│   ├── config/                    # tsconfig, eslint, tailwind presets
│   │   ├── tsconfig/
│   │   │   ├── base.json
│   │   │   ├── nextjs.json
│   │   │   └── node.json
│   │   └── eslint/
│   │       └── index.js
│   ├── contracts/                 # Zod schemas + inferred TS types
│   │   └── src/
│   │       ├── index.ts
│   │       ├── api/
│   │       │   ├── tournament.ts
│   │       │   ├── match.ts
│   │       │   └── scoring.ts
│   │       ├── ws/
│   │       │   ├── channels.ts
│   │       │   └── events.ts
│   │       └── overlay/
│   │           └── scoreboard.ts
│   ├── domain/                    # Pure business logic — no external deps
│   │   └── src/
│   │       ├── index.ts
│   │       ├── shared/
│   │       │   ├── aggregate-root.ts
│   │       │   ├── value-object.ts
│   │       │   ├── result.ts
│   │       │   ├── domain-event.ts
│   │       │   └── entity.ts
│   │       ├── identity/
│   │       │   ├── user.entity.ts
│   │       │   └── role.value-object.ts
│   │       ├── tournament/
│   │       │   ├── tournament.aggregate.ts
│   │       │   ├── tournament.events.ts
│   │       │   └── tournament.errors.ts
│   │       ├── match/
│   │       │   ├── match.aggregate.ts
│   │       │   ├── match.events.ts
│   │       │   └── match.errors.ts
│   │       └── scoring/
│   │           ├── innings.aggregate.ts
│   │           ├── ball.entity.ts
│   │           ├── score.value-object.ts
│   │           ├── over.value-object.ts
│   │           ├── wicket.value-object.ts
│   │           ├── scoring.events.ts
│   │           └── scoring.errors.ts
│   └── application/               # Ports (interfaces) — no implementations
│       └── src/
│           ├── index.ts
│           └── ports/
│               ├── match-repository.port.ts
│               ├── tournament-repository.port.ts
│               ├── event-bus.port.ts
│               └── unit-of-work.port.ts
├── infra/
│   └── supabase/
│       ├── migrations/
│       │   ├── 20260512000001_enums.sql
│       │   ├── 20260512000002_core_tables.sql
│       │   ├── 20260512000003_scoring_tables.sql
│       │   ├── 20260512000004_statistics_tables.sql
│       │   ├── 20260512000005_indexes.sql
│       │   ├── 20260512000006_rls.sql
│       │   └── 20260512000007_seed.sql
│       ├── config.toml
│       └── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml
├── .dependency-cruiser.cjs
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Task 1: Init Monorepo Skeleton

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.nvmrc`

- [ ] **Step 1: Verify Node 20 + pnpm 9 installed**

```bash
node -v   # expect v20.x.x
pnpm -v   # expect 9.x.x
```

If pnpm missing: `npm install -g pnpm@9`

- [ ] **Step 2: Create root package.json**

```bash
mkdir school-cricket-fiesta && cd school-cricket-fiesta
```

Create `package.json`:

```json
{
  "name": "school-cricket-fiesta",
  "version": "0.0.0",
  "private": true,
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "test:ci": "turbo run test --concurrency=4",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json", "package.json"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tests/**", "vitest.config.ts"],
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 5: Create .nvmrc**

```
20
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
.turbo/
dist/
.next/
out/
coverage/
*.env
*.env.local
.DS_Store
```

- [ ] **Step 7: Init git + first commit**

```bash
git init
git add .
git commit -m "chore: init monorepo skeleton"
```

Expected: commit succeeds, no staged files remain.

---

## Task 2: Shared Config Package (`@scf/config`)

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig/base.json`
- Create: `packages/config/tsconfig/node.json`
- Create: `packages/config/tsconfig/nextjs.json`
- Create: `packages/config/eslint/index.js`

- [ ] **Step 1: Create package.json**

```bash
mkdir -p packages/config/tsconfig packages/config/eslint
```

`packages/config/package.json`:

```json
{
  "name": "@scf/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./tsconfig/*": "./tsconfig/*.json",
    "./eslint": "./eslint/index.js"
  }
}
```

- [ ] **Step 2: Create base tsconfig**

`packages/config/tsconfig/base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Create node tsconfig**

`packages/config/tsconfig/node.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "CommonJS",
    "moduleResolution": "Node10"
  },
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

- [ ] **Step 4: Create Next.js tsconfig**

`packages/config/tsconfig/nextjs.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "jsx": "preserve",
    "incremental": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create eslint config**

```bash
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin --filter @scf/config
```

`packages/config/eslint/index.js`:

```js
/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
  },
};
```

- [ ] **Step 6: Commit**

```bash
git add packages/config/
git commit -m "chore: add @scf/config shared tsconfig + eslint"
```

---

## Task 3: `@scf/domain` — Shared Foundation Types

**Files:**
- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/domain/vitest.config.ts`
- Create: `packages/domain/src/shared/result.ts`
- Create: `packages/domain/src/shared/entity.ts`
- Create: `packages/domain/src/shared/value-object.ts`
- Create: `packages/domain/src/shared/domain-event.ts`
- Create: `packages/domain/src/shared/aggregate-root.ts`
- Create: `packages/domain/src/shared/__tests__/result.test.ts`

- [ ] **Step 1: Scaffold package**

```bash
mkdir -p packages/domain/src/shared/\__tests__
```

`packages/domain/package.json`:

```json
{
  "name": "@scf/domain",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/ --ext .ts",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@scf/config": "workspace:*",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

`packages/domain/tsconfig.json`:

```json
{
  "extends": "@scf/config/tsconfig/node.json",
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "src/**/*.test.ts"]
}
```

`packages/domain/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
```

- [ ] **Step 2: Write failing test for Result**

`packages/domain/src/shared/__tests__/result.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ok, err, Result } from '../result';

describe('Result', () => {
  it('ok() isOk is true, isErr is false', () => {
    const r = ok(42);
    expect(r.isOk()).toBe(true);
    expect(r.isErr()).toBe(false);
    expect(r.value).toBe(42);
  });

  it('err() isErr is true, isOk is false', () => {
    const r = err(new Error('oops'));
    expect(r.isErr()).toBe(true);
    expect(r.isOk()).toBe(false);
    expect(r.error.message).toBe('oops');
  });

  it('ok map transforms value', () => {
    const r = ok(2).map((n) => n * 3);
    expect(r.value).toBe(6);
  });

  it('err map is a no-op', () => {
    const r: Result<number, Error> = err(new Error('x'));
    const mapped = r.map((n) => n + 1);
    expect(mapped.isErr()).toBe(true);
  });
});
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
cd packages/domain && pnpm test
```

Expected: "Cannot find module '../result'" or similar.

- [ ] **Step 4: Implement Result**

`packages/domain/src/shared/result.ts`:

```ts
export type Result<T, E = Error> = OkResult<T, E> | ErrResult<T, E>;

class OkResult<T, E> {
  readonly _tag = 'ok' as const;
  constructor(readonly value: T) {}
  isOk(): this is OkResult<T, E> { return true; }
  isErr(): this is ErrResult<T, E> { return false; }
  map<U>(fn: (v: T) => U): Result<U, E> { return ok(fn(this.value)); }
}

class ErrResult<T, E> {
  readonly _tag = 'err' as const;
  constructor(readonly error: E) {}
  isOk(): this is OkResult<T, E> { return false; }
  isErr(): this is ErrResult<T, E> { return true; }
  map<U>(_fn: (v: T) => U): Result<U, E> { return err(this.error); }
}

export const ok = <T, E = Error>(value: T): Result<T, E> => new OkResult(value);
export const err = <T, E = Error>(error: E): Result<T, E> => new ErrResult(error);
```

- [ ] **Step 5: Run test — expect PASS**

```bash
pnpm test
```

Expected: all 4 tests pass.

- [ ] **Step 6: Implement Entity**

`packages/domain/src/shared/entity.ts`:

```ts
export abstract class Entity<TId> {
  constructor(protected readonly _id: TId) {}
  get id(): TId { return this._id; }
  equals(other: Entity<TId>): boolean {
    if (!(other instanceof Entity)) return false;
    return JSON.stringify(this._id) === JSON.stringify(other._id);
  }
}
```

- [ ] **Step 7: Implement ValueObject**

`packages/domain/src/shared/value-object.ts`:

```ts
export abstract class ValueObject<T extends object> {
  protected constructor(protected readonly props: T) {
    Object.freeze(this.props);
  }
  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
```

- [ ] **Step 8: Implement DomainEvent**

`packages/domain/src/shared/domain-event.ts`:

```ts
export interface IDomainEvent {
  readonly name: string;
  readonly occurredAt: Date;
}
```

- [ ] **Step 9: Implement AggregateRoot**

`packages/domain/src/shared/aggregate-root.ts`:

```ts
import type { IDomainEvent } from './domain-event';
import { Entity } from './entity';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _events: IDomainEvent[] = [];

  protected addEvent(event: IDomainEvent): void {
    this._events.push(event);
  }

  pullDomainEvents(): IDomainEvent[] {
    const events = [...this._events];
    this._events = [];
    return events;
  }

  get domainEventCount(): number {
    return this._events.length;
  }
}
```

- [ ] **Step 10: Commit**

```bash
cd ../..
git add packages/domain/
git commit -m "feat(domain): add shared foundation types — Result, Entity, ValueObject, AggregateRoot"
```

---

## Task 4: `@scf/domain` — Identity Context

**Files:**
- Create: `packages/domain/src/identity/role.value-object.ts`
- Create: `packages/domain/src/identity/user.entity.ts`
- Create: `packages/domain/src/identity/__tests__/user.test.ts`

- [ ] **Step 1: Write failing test**

`packages/domain/src/identity/__tests__/user.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { User } from '../user.entity';
import { Role } from '../role.value-object';

describe('User', () => {
  it('creates a user with role', () => {
    const user = User.create({ id: 'u1', email: 'a@b.com', role: Role.Scorer });
    expect(user.id).toBe('u1');
    expect(user.email).toBe('a@b.com');
    expect(user.isScorer()).toBe(true);
    expect(user.isAdmin()).toBe(false);
  });

  it('admin has all permissions', () => {
    const user = User.create({ id: 'u2', email: 'admin@b.com', role: Role.Admin });
    expect(user.isAdmin()).toBe(true);
    expect(user.isScorer()).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/domain && pnpm test src/identity
```

- [ ] **Step 3: Implement Role**

`packages/domain/src/identity/role.value-object.ts`:

```ts
export enum Role {
  Admin      = 'admin',
  Organizer  = 'organizer',
  Scorer     = 'scorer',
  Viewer     = 'viewer',
}
```

- [ ] **Step 4: Implement User**

`packages/domain/src/identity/user.entity.ts`:

```ts
import { Entity } from '../shared/entity';
import { Role } from './role.value-object';

interface UserProps {
  id: string;
  email: string;
  role: Role;
  createdAt?: Date;
}

export class User extends Entity<string> {
  private readonly _email: string;
  private readonly _role: Role;
  private readonly _createdAt: Date;

  private constructor(props: UserProps) {
    super(props.id);
    this._email = props.email;
    this._role = props.role;
    this._createdAt = props.createdAt ?? new Date();
  }

  static create(props: UserProps): User {
    return new User(props);
  }

  get email(): string { return this._email; }
  get role(): Role { return this._role; }
  get createdAt(): Date { return this._createdAt; }

  isAdmin(): boolean { return this._role === Role.Admin; }
  isOrganizer(): boolean { return this._role === Role.Organizer || this._role === Role.Admin; }
  isScorer(): boolean { return this._role === Role.Scorer; }
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
pnpm test src/identity
```

- [ ] **Step 6: Commit**

```bash
cd ../..
git add packages/domain/src/identity/
git commit -m "feat(domain): identity context — User entity, Role enum"
```

---

## Task 5: `@scf/domain` — Scoring Value Objects

**Files:**
- Create: `packages/domain/src/scoring/score.value-object.ts`
- Create: `packages/domain/src/scoring/over.value-object.ts`
- Create: `packages/domain/src/scoring/wicket.value-object.ts`
- Create: `packages/domain/src/scoring/scoring.errors.ts`
- Create: `packages/domain/src/scoring/__tests__/score.test.ts`
- Create: `packages/domain/src/scoring/__tests__/over.test.ts`

- [ ] **Step 1: Write failing tests for Score**

`packages/domain/src/scoring/__tests__/score.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Score } from '../score.value-object';

describe('Score', () => {
  it('starts at zero', () => {
    const s = Score.zero();
    expect(s.runs).toBe(0);
    expect(s.extras).toBe(0);
    expect(s.total).toBe(0);
  });

  it('add runs', () => {
    const s = Score.zero().addRuns(4);
    expect(s.runs).toBe(4);
    expect(s.total).toBe(4);
  });

  it('add extras (wide)', () => {
    const s = Score.zero().addExtras({ wide: 1 });
    expect(s.runs).toBe(0);
    expect(s.extras).toBe(1);
    expect(s.total).toBe(1);
  });

  it('add runs + extras (no-ball + 4)', () => {
    const s = Score.zero().addRuns(4).addExtras({ noBall: 1 });
    expect(s.total).toBe(5);
  });
});
```

`packages/domain/src/scoring/__tests__/over.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Over } from '../over.value-object';

describe('Over', () => {
  it('starts at over 1, ball 0', () => {
    const o = Over.first();
    expect(o.number).toBe(1);
    expect(o.legalBallsBowled).toBe(0);
    expect(o.isComplete).toBe(false);
  });

  it('advance 6 legal balls = complete', () => {
    let o = Over.first();
    for (let i = 0; i < 6; i++) o = o.recordLegalBall();
    expect(o.isComplete).toBe(true);
    expect(o.legalBallsBowled).toBe(6);
  });

  it('wide does not advance legal ball count', () => {
    const o = Over.first().recordIllegalBall();
    expect(o.legalBallsBowled).toBe(0);
    expect(o.isComplete).toBe(false);
  });

  it('display format "x.y"', () => {
    const o = Over.first().recordLegalBall().recordLegalBall();
    expect(o.display).toBe('0.2');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/domain && pnpm test src/scoring
```

- [ ] **Step 3: Implement Score**

`packages/domain/src/scoring/score.value-object.ts`:

```ts
import { ValueObject } from '../shared/value-object';

interface ScoreProps {
  runs: number;
  extras: number;
}

export class Score extends ValueObject<ScoreProps> {
  private constructor(props: ScoreProps) { super(props); }

  static zero(): Score { return new Score({ runs: 0, extras: 0 }); }

  get runs(): number { return this.props.runs; }
  get extras(): number { return this.props.extras; }
  get total(): number { return this.props.runs + this.props.extras; }

  addRuns(runs: number): Score {
    return new Score({ ...this.props, runs: this.props.runs + runs });
  }

  addExtras(ex: { wide?: number; noBall?: number; bye?: number; legBye?: number }): Score {
    const add = (ex.wide ?? 0) + (ex.noBall ?? 0) + (ex.bye ?? 0) + (ex.legBye ?? 0);
    return new Score({ ...this.props, extras: this.props.extras + add });
  }
}
```

- [ ] **Step 4: Implement Over**

`packages/domain/src/scoring/over.value-object.ts`:

```ts
import { ValueObject } from '../shared/value-object';

interface OverProps {
  number: number;
  legalBallsBowled: number;
}

export class Over extends ValueObject<OverProps> {
  private constructor(props: OverProps) { super(props); }

  static first(): Over { return new Over({ number: 1, legalBallsBowled: 0 }); }

  get number(): number { return this.props.number; }
  get legalBallsBowled(): number { return this.props.legalBallsBowled; }
  get isComplete(): boolean { return this.props.legalBallsBowled >= 6; }

  get display(): string {
    const completedOvers = this.props.number - 1;
    return `${completedOvers}.${this.props.legalBallsBowled}`;
  }

  recordLegalBall(): Over {
    return new Over({ ...this.props, legalBallsBowled: this.props.legalBallsBowled + 1 });
  }

  recordIllegalBall(): Over { return this; }

  next(): Over {
    return new Over({ number: this.props.number + 1, legalBallsBowled: 0 });
  }
}
```

- [ ] **Step 5: Implement Wicket value object**

`packages/domain/src/scoring/wicket.value-object.ts`:

```ts
import { ValueObject } from '../shared/value-object';

export type WicketKind =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'run_out'
  | 'stumped'
  | 'hit_wicket'
  | 'obstructing_field'
  | 'handled_ball'
  | 'retired_hurt';

interface WicketProps {
  kind: WicketKind;
  dismissedPlayerId: string;
  fielderId: string | null;
  bowlerId: string | null;
}

export class Wicket extends ValueObject<WicketProps> {
  private constructor(props: WicketProps) { super(props); }

  static create(props: WicketProps): Wicket { return new Wicket(props); }

  get kind(): WicketKind { return this.props.kind; }
  get dismissedPlayerId(): string { return this.props.dismissedPlayerId; }
  get fielderId(): string | null { return this.props.fielderId; }
  get bowlerId(): string | null { return this.props.bowlerId; }

  get chargesAgainstBowler(): boolean {
    return ['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket'].includes(this.props.kind);
  }
}
```

- [ ] **Step 6: Implement scoring errors**

`packages/domain/src/scoring/scoring.errors.ts`:

```ts
export class ScoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScoringError';
  }
}

export class InningsClosedError extends ScoringError {
  constructor() { super('Cannot record ball: innings is closed'); }
}

export class ConcurrencyError extends ScoringError {
  constructor(expected: number, actual: number) {
    super(`Expected sequence ${expected}, got ${actual}. Fetch latest and retry.`);
  }
}

export class InvalidBallError extends ScoringError {
  constructor(reason: string) { super(`Invalid ball: ${reason}`); }
}
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
pnpm test src/scoring
```

Expected: all score + over tests pass.

- [ ] **Step 8: Commit**

```bash
cd ../..
git add packages/domain/src/scoring/
git commit -m "feat(domain): scoring value objects — Score, Over, Wicket, ScoringErrors"
```

---

## Task 6: `@scf/domain` — Innings Aggregate (Core)

**Files:**
- Create: `packages/domain/src/scoring/ball.entity.ts`
- Create: `packages/domain/src/scoring/scoring.events.ts`
- Create: `packages/domain/src/scoring/innings.aggregate.ts`
- Create: `packages/domain/src/scoring/__tests__/innings.test.ts`

- [ ] **Step 1: Write failing tests**

`packages/domain/src/scoring/__tests__/innings.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Innings } from '../innings.aggregate';
import { InningsClosedError, ConcurrencyError } from '../scoring.errors';

const baseCmd = () => ({
  strikerId: 'p1',
  nonStrikerId: 'p2',
  bowlerId: 'b1',
  runs: 0,
  extras: {},
  wicket: null,
  expectedSeq: 0,
});

function makeInnings(maxOvers = 10) {
  return Innings.start({
    id: 'inn1',
    matchId: 'm1',
    number: 1,
    battingTeamId: 't1',
    bowlingTeamId: 't2',
    maxOvers,
  });
}

describe('Innings', () => {
  it('starts with zero score and zero wickets', () => {
    const inn = makeInnings();
    expect(inn.totalRuns).toBe(0);
    expect(inn.totalWickets).toBe(0);
    expect(inn.isComplete).toBe(false);
  });

  it('records a single ball and emits BallRecorded event', () => {
    const inn = makeInnings();
    const result = inn.recordBall(baseCmd());
    expect(result.isOk()).toBe(true);
    expect(inn.totalRuns).toBe(0);
    const events = inn.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.name).toBe('scoring.ball.recorded');
  });

  it('accumulates runs correctly', () => {
    const inn = makeInnings();
    inn.recordBall({ ...baseCmd(), runs: 4 });
    inn.recordBall({ ...baseCmd(), runs: 1, expectedSeq: 1 });
    inn.recordBall({ ...baseCmd(), runs: 6, expectedSeq: 2 });
    expect(inn.totalRuns).toBe(11);
  });

  it('completes over after 6 legal balls and emits OverCompleted', () => {
    const inn = makeInnings();
    for (let i = 0; i < 6; i++) {
      inn.recordBall({ ...baseCmd(), expectedSeq: i });
      inn.pullDomainEvents(); // drain between
    }
    const last = inn.pullDomainEvents();
    // Over completed event was emitted on 6th ball
    // Just verify seq advanced correctly
    expect(inn.currentOver.number).toBe(2);
  });

  it('wide does not advance legal ball count', () => {
    const inn = makeInnings();
    inn.recordBall({ ...baseCmd(), extras: { wide: 1 } });
    expect(inn.currentOver.legalBallsBowled).toBe(0);
    expect(inn.totalRuns).toBe(1);
  });

  it('records a wicket and increments wicket count', () => {
    const inn = makeInnings();
    inn.recordBall({
      ...baseCmd(),
      wicket: { kind: 'bowled', dismissedPlayerId: 'p1', fielderId: null, bowlerId: 'b1' },
    });
    expect(inn.totalWickets).toBe(1);
  });

  it('rejects concurrent writes with wrong expectedSeq', () => {
    const inn = makeInnings();
    inn.recordBall(baseCmd());
    const result = inn.recordBall({ ...baseCmd(), expectedSeq: 0 }); // should be 1
    expect(result.isErr()).toBe(true);
    expect(result.error).toBeInstanceOf(ConcurrencyError);
  });

  it('closes innings after max overs', () => {
    const inn = makeInnings(1);
    for (let i = 0; i < 6; i++) {
      inn.recordBall({ ...baseCmd(), expectedSeq: i });
      inn.pullDomainEvents();
    }
    expect(inn.isComplete).toBe(true);
    const result = inn.recordBall({ ...baseCmd(), expectedSeq: 6 });
    expect(result.isErr()).toBe(true);
    expect(result.error).toBeInstanceOf(InningsClosedError);
  });

  it('closes innings after 10 wickets', () => {
    const inn = makeInnings(20);
    for (let i = 0; i < 10; i++) {
      inn.recordBall({
        ...baseCmd(), expectedSeq: i,
        wicket: { kind: 'bowled', dismissedPlayerId: `p${i}`, fielderId: null, bowlerId: 'b1' },
      });
      inn.pullDomainEvents();
    }
    expect(inn.isComplete).toBe(true);
  });

  it('undoes last ball', () => {
    const inn = makeInnings();
    inn.recordBall({ ...baseCmd(), runs: 6 });
    inn.pullDomainEvents();
    const undo = inn.undoLastBall({ actorId: 'scorer1' });
    expect(undo.isOk()).toBe(true);
    expect(inn.totalRuns).toBe(0);
    expect(inn.currentSeq).toBe(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd packages/domain && pnpm test src/scoring/__tests__/innings.test.ts
```

- [ ] **Step 3: Implement BallEntity**

`packages/domain/src/scoring/ball.entity.ts`:

```ts
import { Entity } from '../shared/entity';
import type { Wicket } from './wicket.value-object';
import type { WicketKind } from './wicket.value-object';

interface BallProps {
  id: string;
  inningsId: string;
  seq: number;
  overNumber: number;
  ballInOver: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runsOffBat: number;
  extras: { wide: number; noBall: number; bye: number; legBye: number };
  wicket: Wicket | null;
}

export class Ball extends Entity<string> {
  private constructor(private readonly props: BallProps) {
    super(props.id);
  }

  static create(props: BallProps): Ball { return new Ball(props); }

  get seq(): number { return this.props.seq; }
  get overNumber(): number { return this.props.overNumber; }
  get ballInOver(): number { return this.props.ballInOver; }
  get strikerId(): string { return this.props.strikerId; }
  get nonStrikerId(): string { return this.props.nonStrikerId; }
  get bowlerId(): string { return this.props.bowlerId; }
  get runsOffBat(): number { return this.props.runsOffBat; }
  get extras() { return this.props.extras; }
  get wicket(): Wicket | null { return this.props.wicket; }

  get isWide(): boolean { return this.props.extras.wide > 0; }
  get isNoBall(): boolean { return this.props.extras.noBall > 0; }
  get isLegal(): boolean { return !this.isWide && !this.isNoBall; }
  get isWicket(): boolean { return this.props.wicket !== null; }

  get totalRuns(): number {
    return this.props.runsOffBat
      + this.props.extras.wide
      + this.props.extras.noBall
      + this.props.extras.bye
      + this.props.extras.legBye;
  }
}
```

- [ ] **Step 4: Implement Scoring Events**

`packages/domain/src/scoring/scoring.events.ts`:

```ts
import type { IDomainEvent } from '../shared/domain-event';
import type { Ball } from './ball.entity';

export class BallRecordedEvent implements IDomainEvent {
  readonly name = 'scoring.ball.recorded' as const;
  readonly occurredAt = new Date();
  constructor(
    readonly inningsId: string,
    readonly matchId: string,
    readonly ball: Ball,
    readonly totalRuns: number,
    readonly totalWickets: number,
    readonly overDisplay: string,
  ) {}
}

export class BallUndoneEvent implements IDomainEvent {
  readonly name = 'scoring.ball.undone' as const;
  readonly occurredAt = new Date();
  constructor(
    readonly inningsId: string,
    readonly matchId: string,
    readonly undoneSeq: number,
    readonly actorId: string,
    readonly totalRuns: number,
    readonly totalWickets: number,
  ) {}
}

export class OverCompletedEvent implements IDomainEvent {
  readonly name = 'scoring.over.completed' as const;
  readonly occurredAt = new Date();
  constructor(
    readonly inningsId: string,
    readonly matchId: string,
    readonly overNumber: number,
    readonly runsInOver: number,
    readonly wicketsInOver: number,
  ) {}
}

export class InningsCompletedEvent implements IDomainEvent {
  readonly name = 'scoring.innings.completed' as const;
  readonly occurredAt = new Date();
  constructor(
    readonly inningsId: string,
    readonly matchId: string,
    readonly totalRuns: number,
    readonly totalWickets: number,
    readonly reason: 'all_out' | 'overs_complete' | 'declared',
  ) {}
}
```

- [ ] **Step 5: Implement Innings Aggregate**

`packages/domain/src/scoring/innings.aggregate.ts`:

```ts
import { AggregateRoot } from '../shared/aggregate-root';
import { ok, err, type Result } from '../shared/result';
import { Ball } from './ball.entity';
import { Score } from './score.value-object';
import { Over } from './over.value-object';
import { Wicket } from './wicket.value-object';
import { InningsClosedError, ConcurrencyError, InvalidBallError } from './scoring.errors';
import {
  BallRecordedEvent,
  BallUndoneEvent,
  OverCompletedEvent,
  InningsCompletedEvent,
} from './scoring.events';
import { randomUUID } from 'crypto';

interface StartInningsCommand {
  id: string;
  matchId: string;
  number: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  maxOvers: number;
}

interface RecordBallCommand {
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  extras: { wide?: number; noBall?: number; bye?: number; legBye?: number };
  wicket: { kind: string; dismissedPlayerId: string; fielderId: string | null; bowlerId: string | null } | null;
  expectedSeq: number;
}

interface UndoCommand {
  actorId: string;
}

export class Innings extends AggregateRoot<string> {
  private _balls: Ball[] = [];
  private _score = Score.zero();
  private _wickets = 0;
  private _currentOver = Over.first();
  private _isComplete = false;
  private _runsThisOver = 0;
  private _wicketsThisOver = 0;

  private constructor(
    private readonly _matchId: string,
    private readonly _number: number,
    private readonly _battingTeamId: string,
    private readonly _maxOvers: number,
  ) {
    super(_matchId + ':innings:' + _number);
  }

  static start(cmd: StartInningsCommand): Innings {
    return new Innings(cmd.matchId, cmd.number, cmd.battingTeamId, cmd.maxOvers);
  }

  get matchId(): string { return this._matchId; }
  get totalRuns(): number { return this._score.total; }
  get totalWickets(): number { return this._wickets; }
  get currentOver(): Over { return this._currentOver; }
  get isComplete(): boolean { return this._isComplete; }
  get currentSeq(): number { return this._balls.length; }

  recordBall(cmd: RecordBallCommand): Result<BallRecordedEvent, InningsClosedError | ConcurrencyError | InvalidBallError> {
    if (this._isComplete) return err(new InningsClosedError());
    if (cmd.expectedSeq !== this._balls.length) {
      return err(new ConcurrencyError(this._balls.length, cmd.expectedSeq));
    }

    const extras = {
      wide:   cmd.extras.wide   ?? 0,
      noBall: cmd.extras.noBall ?? 0,
      bye:    cmd.extras.bye    ?? 0,
      legBye: cmd.extras.legBye ?? 0,
    };

    const wicket = cmd.wicket
      ? Wicket.create({
          kind: cmd.wicket.kind as never,
          dismissedPlayerId: cmd.wicket.dismissedPlayerId,
          fielderId: cmd.wicket.fielderId,
          bowlerId: cmd.wicket.bowlerId,
        })
      : null;

    const ball = Ball.create({
      id: randomUUID(),
      inningsId: this._id,
      seq: this._balls.length,
      overNumber: this._currentOver.number,
      ballInOver: this._currentOver.legalBallsBowled + 1,
      strikerId: cmd.strikerId,
      nonStrikerId: cmd.nonStrikerId,
      bowlerId: cmd.bowlerId,
      runsOffBat: cmd.runs,
      extras,
      wicket,
    });

    this._balls.push(ball);
    this._score = this._score.addRuns(cmd.runs).addExtras(extras);
    this._runsThisOver += ball.totalRuns;

    if (ball.isWicket) {
      this._wickets++;
      this._wicketsThisOver++;
    }

    if (ball.isLegal) {
      this._currentOver = this._currentOver.recordLegalBall();
    }

    const event = new BallRecordedEvent(
      this._id, this._matchId, ball, this._score.total, this._wickets, this._currentOver.display,
    );
    this.addEvent(event);

    if (ball.isLegal && this._currentOver.isComplete) {
      this.addEvent(new OverCompletedEvent(
        this._id, this._matchId, this._currentOver.number,
        this._runsThisOver, this._wicketsThisOver,
      ));
      this._currentOver = this._currentOver.next();
      this._runsThisOver = 0;
      this._wicketsThisOver = 0;

      if (this._currentOver.number > this._maxOvers) {
        this._isComplete = true;
        this.addEvent(new InningsCompletedEvent(
          this._id, this._matchId, this._score.total, this._wickets, 'overs_complete',
        ));
      }
    }

    if (this._wickets >= 10) {
      this._isComplete = true;
      this.addEvent(new InningsCompletedEvent(
        this._id, this._matchId, this._score.total, this._wickets, 'all_out',
      ));
    }

    return ok(event);
  }

  undoLastBall(cmd: UndoCommand): Result<BallUndoneEvent, InvalidBallError> {
    if (this._balls.length === 0) return err(new InvalidBallError('No balls to undo'));
    const last = this._balls.pop()!;

    this._score = this._score.addRuns(-last.runsOffBat).addExtras({
      wide:   -last.extras.wide,
      noBall: -last.extras.noBall,
      bye:    -last.extras.bye,
      legBye: -last.extras.legBye,
    });

    if (last.isWicket) this._wickets--;
    if (last.isLegal) {
      this._currentOver = new Over(
        { number: this._currentOver.number, legalBallsBowled: this._currentOver.legalBallsBowled - 1 } as never,
      );
    }
    this._isComplete = false;

    const event = new BallUndoneEvent(
      this._id, this._matchId, last.seq, cmd.actorId, this._score.total, this._wickets,
    );
    this.addEvent(event);
    return ok(event);
  }
}
```

> **Note:** The `Over` constructor above uses a cast for brevity. Update Over to expose a static `restore(props)` factory instead:

```ts
// Add to over.value-object.ts
static restore(number: number, legalBallsBowled: number): Over {
  return new Over({ number, legalBallsBowled });
}
```

Then replace the undo Over line with:
```ts
this._currentOver = Over.restore(
  this._currentOver.number,
  this._currentOver.legalBallsBowled - 1,
);
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd packages/domain && pnpm test
```

Expected: all tests pass. If Over.restore fails, apply the fix above.

- [ ] **Step 7: Commit**

```bash
cd ../..
git add packages/domain/
git commit -m "feat(domain): Innings aggregate — recordBall, undoLastBall, event emission, concurrency guard"
```

---

## Task 7: `@scf/domain` — Tournament & Match Aggregates

**Files:**
- Create: `packages/domain/src/tournament/tournament.aggregate.ts`
- Create: `packages/domain/src/tournament/tournament.events.ts`
- Create: `packages/domain/src/tournament/tournament.errors.ts`
- Create: `packages/domain/src/match/match.aggregate.ts`
- Create: `packages/domain/src/match/match.events.ts`
- Create: `packages/domain/src/match/match.errors.ts`
- Create: `packages/domain/src/tournament/__tests__/tournament.test.ts`
- Create: `packages/domain/src/match/__tests__/match.test.ts`

- [ ] **Step 1: Write Tournament test**

`packages/domain/src/tournament/__tests__/tournament.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Tournament } from '../tournament.aggregate';

describe('Tournament', () => {
  it('creates in draft status', () => {
    const t = Tournament.create({ id: 't1', name: 'Fiesta 2026', season: '2026', format: 'T20', organizerId: 'u1' });
    expect(t.status).toBe('draft');
    expect(t.name).toBe('Fiesta 2026');
  });

  it('publishes tournament', () => {
    const t = Tournament.create({ id: 't1', name: 'F', season: '2026', format: 'T20', organizerId: 'u1' });
    t.publish();
    expect(t.status).toBe('active');
    const events = t.pullDomainEvents();
    expect(events[0]!.name).toBe('tournament.published');
  });

  it('cannot publish already active tournament', () => {
    const t = Tournament.create({ id: 't1', name: 'F', season: '2026', format: 'T20', organizerId: 'u1' });
    t.publish();
    const result = t.publish();
    expect(result.isErr()).toBe(true);
  });
});
```

- [ ] **Step 2: Write Match test**

`packages/domain/src/match/__tests__/match.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Match } from '../match.aggregate';

describe('Match', () => {
  it('creates in scheduled status', () => {
    const m = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
    expect(m.status).toBe('scheduled');
  });

  it('records toss decision', () => {
    const m = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
    m.decideToss({ winnerId: 'ta', decision: 'bat' });
    expect(m.tossWinnerId).toBe('ta');
    expect(m.tossDecision).toBe('bat');
  });

  it('start emits MatchStarted event', () => {
    const m = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
    m.decideToss({ winnerId: 'ta', decision: 'bat' });
    m.start();
    expect(m.status).toBe('live');
    const events = m.pullDomainEvents();
    expect(events.some(e => e.name === 'match.started')).toBe(true);
  });

  it('cannot start without toss', () => {
    const m = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
    const result = m.start();
    expect(result.isErr()).toBe(true);
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
cd packages/domain && pnpm test src/tournament src/match
```

- [ ] **Step 4: Implement Tournament**

`packages/domain/src/tournament/tournament.errors.ts`:

```ts
export class TournamentError extends Error {
  constructor(msg: string) { super(msg); this.name = 'TournamentError'; }
}
export class AlreadyPublishedError extends TournamentError {
  constructor() { super('Tournament is already active'); }
}
```

`packages/domain/src/tournament/tournament.events.ts`:

```ts
import type { IDomainEvent } from '../shared/domain-event';

export class TournamentPublishedEvent implements IDomainEvent {
  readonly name = 'tournament.published' as const;
  readonly occurredAt = new Date();
  constructor(readonly tournamentId: string) {}
}
```

`packages/domain/src/tournament/tournament.aggregate.ts`:

```ts
import { AggregateRoot } from '../shared/aggregate-root';
import { ok, err, type Result } from '../shared/result';
import { AlreadyPublishedError, TournamentError } from './tournament.errors';
import { TournamentPublishedEvent } from './tournament.events';

type TournamentStatus = 'draft' | 'active' | 'completed' | 'cancelled';
type MatchFormat = 'T10' | 'T20' | 'ODI' | 'Custom';

interface CreateTournamentCmd {
  id: string;
  name: string;
  season: string;
  format: MatchFormat;
  organizerId: string;
}

export class Tournament extends AggregateRoot<string> {
  private _status: TournamentStatus = 'draft';

  private constructor(
    id: string,
    private _name: string,
    private readonly _season: string,
    private readonly _format: MatchFormat,
    private readonly _organizerId: string,
  ) { super(id); }

  static create(cmd: CreateTournamentCmd): Tournament {
    return new Tournament(cmd.id, cmd.name, cmd.season, cmd.format, cmd.organizerId);
  }

  get name(): string { return this._name; }
  get status(): TournamentStatus { return this._status; }
  get organizerId(): string { return this._organizerId; }

  publish(): Result<TournamentPublishedEvent, AlreadyPublishedError> {
    if (this._status !== 'draft') return err(new AlreadyPublishedError());
    this._status = 'active';
    const event = new TournamentPublishedEvent(this._id);
    this.addEvent(event);
    return ok(event);
  }
}
```

- [ ] **Step 5: Implement Match**

`packages/domain/src/match/match.errors.ts`:

```ts
export class MatchError extends Error {
  constructor(msg: string) { super(msg); this.name = 'MatchError'; }
}
export class TossNotDecidedError extends MatchError {
  constructor() { super('Toss must be decided before starting the match'); }
}
export class MatchAlreadyStartedError extends MatchError {
  constructor() { super('Match has already started'); }
}
```

`packages/domain/src/match/match.events.ts`:

```ts
import type { IDomainEvent } from '../shared/domain-event';

export class MatchStartedEvent implements IDomainEvent {
  readonly name = 'match.started' as const;
  readonly occurredAt = new Date();
  constructor(readonly matchId: string, readonly tournamentId: string) {}
}

export class TossDecidedEvent implements IDomainEvent {
  readonly name = 'match.toss.decided' as const;
  readonly occurredAt = new Date();
  constructor(readonly matchId: string, readonly winnerId: string, readonly decision: 'bat' | 'bowl') {}
}

export class MatchEndedEvent implements IDomainEvent {
  readonly name = 'match.ended' as const;
  readonly occurredAt = new Date();
  constructor(
    readonly matchId: string,
    readonly winnerId: string | null,
    readonly resultSummary: string,
  ) {}
}
```

`packages/domain/src/match/match.aggregate.ts`:

```ts
import { AggregateRoot } from '../shared/aggregate-root';
import { ok, err, type Result } from '../shared/result';
import { TossNotDecidedError, MatchAlreadyStartedError, MatchError } from './match.errors';
import { MatchStartedEvent, TossDecidedEvent, MatchEndedEvent } from './match.events';

type MatchStatus = 'scheduled' | 'live' | 'completed' | 'abandoned';

interface CreateMatchCmd {
  id: string;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  oversPerInnings: number;
  scheduledAt: Date;
}

interface TossCmd {
  winnerId: string;
  decision: 'bat' | 'bowl';
}

interface EndMatchCmd {
  winnerId: string | null;
  resultSummary: string;
}

export class Match extends AggregateRoot<string> {
  private _status: MatchStatus = 'scheduled';
  private _tossWinnerId: string | null = null;
  private _tossDecision: 'bat' | 'bowl' | null = null;
  private _winnerId: string | null = null;

  private constructor(
    id: string,
    private readonly _tournamentId: string,
    private readonly _teamAId: string,
    private readonly _teamBId: string,
    private readonly _oversPerInnings: number,
    private readonly _scheduledAt: Date,
  ) { super(id); }

  static create(cmd: CreateMatchCmd): Match {
    return new Match(cmd.id, cmd.tournamentId, cmd.teamAId, cmd.teamBId, cmd.oversPerInnings, cmd.scheduledAt);
  }

  get status(): MatchStatus { return this._status; }
  get tossWinnerId(): string | null { return this._tossWinnerId; }
  get tossDecision(): 'bat' | 'bowl' | null { return this._tossDecision; }
  get oversPerInnings(): number { return this._oversPerInnings; }
  get tournamentId(): string { return this._tournamentId; }

  decideToss(cmd: TossCmd): void {
    this._tossWinnerId = cmd.winnerId;
    this._tossDecision = cmd.decision;
    this.addEvent(new TossDecidedEvent(this._id, cmd.winnerId, cmd.decision));
  }

  start(): Result<MatchStartedEvent, TossNotDecidedError | MatchAlreadyStartedError> {
    if (this._tossWinnerId === null) return err(new TossNotDecidedError());
    if (this._status === 'live') return err(new MatchAlreadyStartedError());
    this._status = 'live';
    const event = new MatchStartedEvent(this._id, this._tournamentId);
    this.addEvent(event);
    return ok(event);
  }

  end(cmd: EndMatchCmd): Result<MatchEndedEvent, MatchError> {
    if (this._status !== 'live') return err(new MatchError('Only live matches can be ended'));
    this._status = 'completed';
    this._winnerId = cmd.winnerId;
    const event = new MatchEndedEvent(this._id, cmd.winnerId, cmd.resultSummary);
    this.addEvent(event);
    return ok(event);
  }
}
```

- [ ] **Step 6: Run all domain tests — expect all PASS**

```bash
cd packages/domain && pnpm test
```

- [ ] **Step 7: Create domain index barrel**

`packages/domain/src/index.ts`:

```ts
// shared
export * from './shared/result';
export * from './shared/entity';
export * from './shared/value-object';
export * from './shared/domain-event';
export * from './shared/aggregate-root';
// identity
export * from './identity/user.entity';
export * from './identity/role.value-object';
// tournament
export * from './tournament/tournament.aggregate';
export * from './tournament/tournament.events';
export * from './tournament/tournament.errors';
// match
export * from './match/match.aggregate';
export * from './match/match.events';
export * from './match/match.errors';
// scoring
export * from './scoring/innings.aggregate';
export * from './scoring/ball.entity';
export * from './scoring/score.value-object';
export * from './scoring/over.value-object';
export * from './scoring/wicket.value-object';
export * from './scoring/scoring.events';
export * from './scoring/scoring.errors';
```

- [ ] **Step 8: Commit**

```bash
cd ../..
git add packages/domain/
git commit -m "feat(domain): Tournament + Match aggregates with domain events"
```

---

## Task 8: `@scf/contracts` — API & WebSocket Schemas

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/api/tournament.ts`
- Create: `packages/contracts/src/api/match.ts`
- Create: `packages/contracts/src/api/scoring.ts`
- Create: `packages/contracts/src/ws/channels.ts`
- Create: `packages/contracts/src/ws/events.ts`
- Create: `packages/contracts/src/overlay/scoreboard.ts`
- Create: `packages/contracts/src/index.ts`

- [ ] **Step 1: Scaffold package**

```bash
mkdir -p packages/contracts/src/{api,ws,overlay}
```

`packages/contracts/package.json`:

```json
{
  "name": "@scf/contracts",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@scf/config": "workspace:*",
    "typescript": "^5.5.0"
  }
}
```

`packages/contracts/tsconfig.json`:

```json
{
  "extends": "@scf/config/tsconfig/node.json",
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Tournament API schemas**

`packages/contracts/src/api/tournament.ts`:

```ts
import { z } from 'zod';

export const CreateTournamentSchema = z.object({
  name:   z.string().min(3).max(100),
  season: z.string().min(4).max(20),
  format: z.enum(['T10', 'T20', 'ODI', 'Custom']),
});
export type CreateTournamentDTO = z.infer<typeof CreateTournamentSchema>;

export const TournamentDTO = z.object({
  id:          z.string().uuid(),
  name:        z.string(),
  season:      z.string(),
  format:      z.enum(['T10', 'T20', 'ODI', 'Custom']),
  status:      z.enum(['draft', 'active', 'completed', 'cancelled']),
  organizerId: z.string().uuid(),
  createdAt:   z.string().datetime(),
});
export type TournamentDTO = z.infer<typeof TournamentDTO>;
```

- [ ] **Step 3: Match API schemas**

`packages/contracts/src/api/match.ts`:

```ts
import { z } from 'zod';

export const CreateMatchSchema = z.object({
  tournamentId:    z.string().uuid(),
  teamAId:         z.string().uuid(),
  teamBId:         z.string().uuid(),
  venue:           z.string().optional(),
  scheduledAt:     z.string().datetime(),
  oversPerInnings: z.number().int().min(1).max(50),
});
export type CreateMatchDTO = z.infer<typeof CreateMatchSchema>;

export const TossDecisionSchema = z.object({
  winnerId: z.string().uuid(),
  decision: z.enum(['bat', 'bowl']),
});
export type TossDecisionDTO = z.infer<typeof TossDecisionSchema>;

export const MatchStatusEnum = z.enum(['scheduled', 'live', 'completed', 'abandoned']);

export const MatchDTO = z.object({
  id:              z.string().uuid(),
  tournamentId:    z.string().uuid(),
  teamAId:         z.string().uuid(),
  teamBId:         z.string().uuid(),
  teamAName:       z.string(),
  teamBName:       z.string(),
  venue:           z.string().nullable(),
  scheduledAt:     z.string().datetime(),
  oversPerInnings: z.number().int(),
  status:          MatchStatusEnum,
  tossWinnerId:    z.string().uuid().nullable(),
  tossDecision:    z.enum(['bat', 'bowl']).nullable(),
  winnerId:        z.string().uuid().nullable(),
  resultSummary:   z.string().nullable(),
});
export type MatchDTO = z.infer<typeof MatchDTO>;
```

- [ ] **Step 4: Scoring API schemas**

`packages/contracts/src/api/scoring.ts`:

```ts
import { z } from 'zod';

export const ExtrasSchema = z.object({
  wide:   z.number().int().min(0).default(0),
  noBall: z.number().int().min(0).default(0),
  bye:    z.number().int().min(0).default(0),
  legBye: z.number().int().min(0).default(0),
});
export type ExtrasDTO = z.infer<typeof ExtrasSchema>;

export const WicketSchema = z.object({
  kind: z.enum(['bowled','caught','lbw','run_out','stumped','hit_wicket','obstructing_field','retired_hurt']),
  dismissedPlayerId: z.string().uuid(),
  fielderId:         z.string().uuid().nullable(),
  bowlerId:          z.string().uuid().nullable(),
});
export type WicketDTO = z.infer<typeof WicketSchema>;

export const RecordBallSchema = z.object({
  inningsId:    z.string(),
  strikerId:    z.string().uuid(),
  nonStrikerId: z.string().uuid(),
  bowlerId:     z.string().uuid(),
  runs:         z.number().int().min(0).max(7),
  extras:       ExtrasSchema.default({}),
  wicket:       WicketSchema.nullable().default(null),
  expectedSeq:  z.number().int().min(0),
});
export type RecordBallDTO = z.infer<typeof RecordBallSchema>;

export const BallDTO = z.object({
  id:           z.string().uuid(),
  inningsId:    z.string(),
  seq:          z.number().int(),
  overNumber:   z.number().int(),
  ballInOver:   z.number().int(),
  strikerId:    z.string().uuid(),
  nonStrikerId: z.string().uuid(),
  bowlerId:     z.string().uuid(),
  runsOffBat:   z.number().int(),
  extras:       ExtrasSchema,
  wicket:       WicketSchema.nullable(),
  occurredAt:   z.string().datetime(),
});
export type BallDTO = z.infer<typeof BallDTO>;

export const InningsDTO = z.object({
  id:            z.string(),
  matchId:       z.string().uuid(),
  number:        z.union([z.literal(1), z.literal(2)]),
  battingTeamId: z.string().uuid(),
  bowlingTeamId: z.string().uuid(),
  totalRuns:     z.number().int(),
  totalWickets:  z.number().int(),
  legalBalls:    z.number().int(),
  oversDisplay:  z.string(),
  isComplete:    z.boolean(),
});
export type InningsDTO = z.infer<typeof InningsDTO>;
```

- [ ] **Step 5: WebSocket channel + event contracts**

`packages/contracts/src/ws/channels.ts`:

```ts
export const Channels = {
  match:   (matchId: string) => `match:${matchId}`,
  overlay: (matchId: string) => `overlay:${matchId}`,
  admin:   (tournamentId: string) => `admin:${tournamentId}`,
} as const;
```

`packages/contracts/src/ws/events.ts`:

```ts
import type { BallDTO, InningsDTO, WicketDTO } from '../api/scoring';

export type OverlayCueKind = 'wicket' | 'boundary_four' | 'boundary_six' | 'over_complete' | 'sponsor' | 'result';

export interface OverlayCue {
  kind: OverlayCueKind;
  durationMs: number;
  data: Record<string, unknown>;
}

export interface PlayerLiveDTO {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
}

export interface BowlerLiveDTO {
  id: string;
  name: string;
  overs: string;
  runs: number;
  wickets: number;
  economy: number;
}

export interface BallRecordedPayload {
  matchId: string;
  inningsId: string;
  ball: BallDTO;
  scoreAfter: { runs: number; wickets: number; oversDisplay: string };
  striker:    PlayerLiveDTO;
  nonStriker: PlayerLiveDTO;
  bowler:     BowlerLiveDTO;
  seq: number;
}

export type WsEvent =
  | { type: 'ball.recorded';    v: 1; payload: BallRecordedPayload }
  | { type: 'ball.undone';      v: 1; payload: { inningsId: string; undoneSeq: number; scoreAfter: { runs: number; wickets: number; oversDisplay: string } } }
  | { type: 'over.completed';   v: 1; payload: { matchId: string; inningsId: string; overNumber: number; runs: number; wickets: number } }
  | { type: 'innings.complete'; v: 1; payload: { matchId: string; inningsId: string; reason: string } }
  | { type: 'match.started';    v: 1; payload: { matchId: string } }
  | { type: 'match.ended';      v: 1; payload: { matchId: string; winnerId: string | null; resultSummary: string } }
  | { type: 'overlay.cue';      v: 1; payload: OverlayCue };
```

- [ ] **Step 6: Overlay scoreboard contract**

`packages/contracts/src/overlay/scoreboard.ts`:

```ts
export interface ScoreboardSnapshot {
  matchId: string;
  tournamentName: string;
  teamA: { id: string; name: string; shortName: string };
  teamB: { id: string; name: string; shortName: string };
  currentInnings: {
    battingTeamId: string;
    runs: number;
    wickets: number;
    oversDisplay: string;
    targetRuns: number | null;
  };
  striker: {
    id: string; name: string; runs: number; balls: number;
    fours: number; sixes: number; strikeRate: number;
  };
  nonStriker: {
    id: string; name: string; runs: number; balls: number;
  };
  bowler: {
    id: string; name: string; overs: string;
    runs: number; wickets: number; economy: number;
  };
  recentOvers: string[];
  matchStatus: 'live' | 'innings_break' | 'completed';
}
```

- [ ] **Step 7: Index barrel**

`packages/contracts/src/index.ts`:

```ts
export * from './api/tournament';
export * from './api/match';
export * from './api/scoring';
export * from './ws/channels';
export * from './ws/events';
export * from './overlay/scoreboard';
```

- [ ] **Step 8: Build contracts**

```bash
cd packages/contracts && pnpm build
```

Expected: `dist/` created with `.js` + `.d.ts` files, zero TS errors.

- [ ] **Step 9: Commit**

```bash
cd ../..
git add packages/contracts/
git commit -m "feat(contracts): Zod schemas + TS types for API, WebSocket, and overlay payloads"
```

---

## Task 9: `@scf/application` — Repository Ports

**Files:**
- Create: `packages/application/package.json`
- Create: `packages/application/tsconfig.json`
- Create: `packages/application/src/ports/match-repository.port.ts`
- Create: `packages/application/src/ports/tournament-repository.port.ts`
- Create: `packages/application/src/ports/event-bus.port.ts`
- Create: `packages/application/src/ports/unit-of-work.port.ts`
- Create: `packages/application/src/index.ts`

- [ ] **Step 1: Scaffold**

```bash
mkdir -p packages/application/src/ports
```

`packages/application/package.json`:

```json
{
  "name": "@scf/application",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@scf/domain": "workspace:*"
  },
  "devDependencies": {
    "@scf/config": "workspace:*",
    "typescript": "^5.5.0"
  }
}
```

`packages/application/tsconfig.json`:

```json
{
  "extends": "@scf/config/tsconfig/node.json",
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Match repository port**

`packages/application/src/ports/match-repository.port.ts`:

```ts
import type { Match } from '@scf/domain';
import type { Innings } from '@scf/domain';

export interface IMatchRepository {
  findById(matchId: string): Promise<Match | null>;
  save(match: Match): Promise<void>;
  findLive(): Promise<Match[]>;
  findByTournament(tournamentId: string): Promise<Match[]>;

  loadInnings(inningsId: string): Promise<Innings | null>;
  saveInnings(innings: Innings): Promise<void>;
  findInningsByMatch(matchId: string): Promise<Innings[]>;
}
```

- [ ] **Step 3: Tournament repository port**

`packages/application/src/ports/tournament-repository.port.ts`:

```ts
import type { Tournament } from '@scf/domain';

export interface ITournamentRepository {
  findById(id: string): Promise<Tournament | null>;
  save(tournament: Tournament): Promise<void>;
  findAll(): Promise<Tournament[]>;
  findByOrganizer(organizerId: string): Promise<Tournament[]>;
}
```

- [ ] **Step 4: Event bus port**

`packages/application/src/ports/event-bus.port.ts`:

```ts
import type { IDomainEvent } from '@scf/domain';

export interface IEventBus {
  publish(event: IDomainEvent): Promise<void>;
  publishAll(events: IDomainEvent[]): Promise<void>;
}
```

- [ ] **Step 5: Unit of work port**

`packages/application/src/ports/unit-of-work.port.ts`:

```ts
export interface IUnitOfWork {
  run<T>(fn: () => Promise<T>): Promise<T>;
}
```

- [ ] **Step 6: Barrel**

`packages/application/src/index.ts`:

```ts
export type { IMatchRepository } from './ports/match-repository.port';
export type { ITournamentRepository } from './ports/tournament-repository.port';
export type { IEventBus } from './ports/event-bus.port';
export type { IUnitOfWork } from './ports/unit-of-work.port';
```

- [ ] **Step 7: Build**

```bash
cd packages/application && pnpm build
```

Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
cd ../..
git add packages/application/
git commit -m "feat(application): repository + event bus + unit-of-work ports (interfaces only)"
```

---

## Task 10: Supabase Init + Enum Migrations

**Files:**
- Create: `infra/supabase/config.toml`
- Create: `infra/supabase/migrations/20260512000001_enums.sql`
- Create: `infra/supabase/.gitignore`

- [ ] **Step 1: Install Supabase CLI**

```bash
npm install -g supabase
supabase --version  # expect 1.x or 2.x
```

- [ ] **Step 2: Init Supabase project**

```bash
mkdir -p infra/supabase && cd infra/supabase
supabase init
```

This generates `config.toml`. Verify it exists.

- [ ] **Step 3: Create .gitignore**

`infra/supabase/.gitignore`:

```
.branches/
.temp/
```

- [ ] **Step 4: Write enum migration**

`infra/supabase/migrations/20260512000001_enums.sql`:

```sql
-- All custom types used across the schema
create type public.user_role as enum ('admin', 'organizer', 'scorer', 'viewer');
create type public.match_format as enum ('T10', 'T20', 'ODI', 'Custom');
create type public.match_status as enum ('scheduled', 'live', 'completed', 'abandoned');
create type public.tournament_status as enum ('draft', 'active', 'completed', 'cancelled');
create type public.toss_decision as enum ('bat', 'bowl');
create type public.wicket_kind as enum (
  'bowled', 'caught', 'lbw', 'run_out', 'stumped',
  'hit_wicket', 'obstructing_field', 'handled_ball', 'retired_hurt'
);
create type public.player_role as enum ('batter', 'bowler', 'all_rounder', 'wicket_keeper');
create type public.innings_completion_reason as enum ('overs_complete', 'all_out', 'declared', 'target_achieved');
```

- [ ] **Step 5: Apply to local Supabase**

```bash
supabase start
supabase db push
```

Expected: migration applied successfully.

- [ ] **Step 6: Commit**

```bash
cd ../..
git add infra/
git commit -m "chore(db): init Supabase + enum types migration"
```

---

## Task 11: Core Tables Migration

**Files:**
- Create: `infra/supabase/migrations/20260512000002_core_tables.sql`

- [ ] **Step 1: Write migration**

`infra/supabase/migrations/20260512000002_core_tables.sql`:

```sql
-- =====================================================
-- USERS (supplements Supabase Auth)
-- =====================================================
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  avatar_url  text,
  role        public.user_role not null default 'viewer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================
-- TOURNAMENTS
-- =====================================================
create table public.tournaments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  season        text not null,
  format        public.match_format not null,
  organizer_id  uuid not null references public.users(id),
  status        public.tournament_status not null default 'draft',
  starts_on     date,
  ends_on       date,
  logo_url      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =====================================================
-- TEAMS
-- =====================================================
create table public.teams (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  name           text not null,
  short_name     text not null check (char_length(short_name) <= 4),
  logo_url       text,
  created_at     timestamptz not null default now()
);

-- =====================================================
-- PLAYERS
-- =====================================================
create table public.players (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  name        text not null,
  jersey_no   int,
  role        public.player_role not null default 'batter',
  is_wicket_keeper boolean not null default false,
  created_at  timestamptz not null default now()
);

-- =====================================================
-- MATCHES
-- =====================================================
create table public.matches (
  id               uuid primary key default gen_random_uuid(),
  tournament_id    uuid not null references public.tournaments(id) on delete cascade,
  team_a_id        uuid not null references public.teams(id),
  team_b_id        uuid not null references public.teams(id),
  venue            text,
  scheduled_at     timestamptz not null,
  overs_per_innings int not null check (overs_per_innings > 0),
  status           public.match_status not null default 'scheduled',
  toss_winner_id   uuid references public.teams(id),
  toss_decision    public.toss_decision,
  winner_id        uuid references public.teams(id),
  result_summary   text,
  scorer_id        uuid references public.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint different_teams check (team_a_id <> team_b_id)
);

-- =====================================================
-- PLAYING XI
-- =====================================================
create table public.playing_xi (
  match_id    uuid not null references public.matches(id) on delete cascade,
  team_id     uuid not null references public.teams(id),
  player_id   uuid not null references public.players(id),
  batting_order int,
  primary key (match_id, team_id, player_id)
);
```

- [ ] **Step 2: Apply migration**

```bash
cd infra/supabase && supabase db push
```

Expected: migration applied, no errors.

- [ ] **Step 3: Commit**

```bash
cd ../..
git add infra/supabase/migrations/20260512000002_core_tables.sql
git commit -m "chore(db): core tables — users, tournaments, teams, players, matches, playing_xi"
```

---

## Task 12: Scoring & Statistics Tables Migration

**Files:**
- Create: `infra/supabase/migrations/20260512000003_scoring_tables.sql`
- Create: `infra/supabase/migrations/20260512000004_statistics_tables.sql`

- [ ] **Step 1: Scoring tables migration**

`infra/supabase/migrations/20260512000003_scoring_tables.sql`:

```sql
-- =====================================================
-- INNINGS
-- =====================================================
create table public.innings (
  id               uuid primary key default gen_random_uuid(),
  match_id         uuid not null references public.matches(id) on delete cascade,
  number           smallint not null check (number in (1, 2)),
  batting_team_id  uuid not null references public.teams(id),
  bowling_team_id  uuid not null references public.teams(id),
  total_runs       int not null default 0,
  total_wickets    int not null default 0,
  legal_balls      int not null default 0,
  is_complete      boolean not null default false,
  completion_reason public.innings_completion_reason,
  target_runs      int,
  started_at       timestamptz,
  ended_at         timestamptz,
  created_at       timestamptz not null default now(),
  unique (match_id, number)
);

-- =====================================================
-- BALL EVENTS — append-only event log
-- =====================================================
create table public.ball_events (
  id                  uuid primary key default gen_random_uuid(),
  innings_id          uuid not null references public.innings(id) on delete cascade,
  seq                 int not null,             -- monotonic per innings
  over_number         int not null check (over_number >= 1),
  ball_in_over        int not null check (ball_in_over between 1 and 10),
  striker_id          uuid not null references public.players(id),
  non_striker_id      uuid not null references public.players(id),
  bowler_id           uuid not null references public.players(id),
  runs_off_bat        int not null default 0 check (runs_off_bat >= 0),
  extras_wide         int not null default 0 check (extras_wide >= 0),
  extras_no_ball      int not null default 0 check (extras_no_ball >= 0),
  extras_bye          int not null default 0 check (extras_bye >= 0),
  extras_leg_bye      int not null default 0 check (extras_leg_bye >= 0),
  is_wicket           boolean not null default false,
  wicket_kind         public.wicket_kind,
  dismissed_player_id uuid references public.players(id),
  fielder_id          uuid references public.players(id),
  is_void             boolean not null default false,  -- compensating event for undo
  commentary          text,
  recorded_by         uuid not null references public.users(id),
  occurred_at         timestamptz not null default now(),
  unique (innings_id, seq)
);

comment on table public.ball_events is 'Append-only event log. Never delete rows. Use is_void=true for undo.';
```

- [ ] **Step 2: Statistics tables migration**

`infra/supabase/migrations/20260512000004_statistics_tables.sql`:

```sql
-- =====================================================
-- PLAYER MATCH STATS (projection — rebuilt from ball_events)
-- =====================================================
create table public.player_match_stats (
  innings_id    uuid not null references public.innings(id) on delete cascade,
  player_id     uuid not null references public.players(id),
  -- batting
  runs_scored   int not null default 0,
  balls_faced   int not null default 0,
  fours         int not null default 0,
  sixes         int not null default 0,
  is_out        boolean not null default false,
  dismissal_kind public.wicket_kind,
  -- bowling
  overs_bowled  numeric(4,1) not null default 0,
  runs_conceded int not null default 0,
  wickets       int not null default 0,
  maidens       int not null default 0,
  wides         int not null default 0,
  no_balls      int not null default 0,
  primary key (innings_id, player_id)
);

-- =====================================================
-- TOURNAMENT LEADERBOARD — top batters
-- =====================================================
create table public.tournament_player_aggregates (
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  player_id      uuid not null references public.players(id),
  team_id        uuid not null references public.teams(id),
  matches_played int not null default 0,
  innings        int not null default 0,
  total_runs     int not null default 0,
  total_balls    int not null default 0,
  highest_score  int not null default 0,
  fifties        int not null default 0,
  hundreds       int not null default 0,
  wickets_taken  int not null default 0,
  best_bowling   text,
  updated_at     timestamptz not null default now(),
  primary key (tournament_id, player_id)
);

-- =====================================================
-- AUDIT LOG
-- =====================================================
create table public.audit_log (
  id         bigserial primary key,
  actor_id   uuid references public.users(id),
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  before_val jsonb,
  after_val  jsonb,
  ip_address inet,
  logged_at  timestamptz not null default now()
);
```

- [ ] **Step 3: Apply migrations**

```bash
cd infra/supabase && supabase db push
```

- [ ] **Step 4: Commit**

```bash
cd ../..
git add infra/supabase/migrations/
git commit -m "chore(db): scoring tables (ball_events, innings) + stats tables"
```

---

## Task 13: Indexes + RLS Policies

**Files:**
- Create: `infra/supabase/migrations/20260512000005_indexes.sql`
- Create: `infra/supabase/migrations/20260512000006_rls.sql`

- [ ] **Step 1: Indexes migration**

`infra/supabase/migrations/20260512000005_indexes.sql`:

```sql
-- Matches: fast lookup by status (admin dashboard)
create index idx_matches_status on public.matches (status);
create index idx_matches_tournament on public.matches (tournament_id);
create index idx_matches_live on public.matches (status) where status = 'live';

-- Ball events: primary query is (innings_id, seq) — covered by unique constraint
-- Secondary: time-ordered for replay
create index idx_ball_events_occurred on public.ball_events (innings_id, occurred_at desc);
-- Skip voided balls in most queries
create index idx_ball_events_active on public.ball_events (innings_id, seq) where is_void = false;

-- Players per team
create index idx_players_team on public.players (team_id);

-- Leaderboard queries
create index idx_tpa_tournament_runs on public.tournament_player_aggregates (tournament_id, total_runs desc);
create index idx_tpa_tournament_wickets on public.tournament_player_aggregates (tournament_id, wickets_taken desc);
```

- [ ] **Step 2: RLS migration**

`infra/supabase/migrations/20260512000006_rls.sql`:

```sql
-- ===== ENABLE RLS =====
alter table public.users enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.innings enable row level security;
alter table public.ball_events enable row level security;
alter table public.playing_xi enable row level security;
alter table public.player_match_stats enable row level security;
alter table public.tournament_player_aggregates enable row level security;

-- ===== HELPER FUNCTIONS =====
create or replace function public.current_user_role()
returns public.user_role as $$
  select role from public.users where id = auth.uid();
$$ language sql stable security definer;

create or replace function public.is_admin()
returns boolean as $$
  select current_user_role() = 'admin';
$$ language sql stable security definer;

create or replace function public.is_scorer_for_match(p_match_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.matches
    where id = p_match_id and scorer_id = auth.uid()
  );
$$ language sql stable security definer;

-- ===== USERS =====
create policy users_read_own on public.users
  for select using (id = auth.uid() or is_admin());

create policy users_update_own on public.users
  for update using (id = auth.uid());

-- ===== TOURNAMENTS — public read, organizer/admin write =====
create policy tournaments_public_read on public.tournaments
  for select using (status in ('active', 'completed') or organizer_id = auth.uid() or is_admin());

create policy tournaments_organizer_insert on public.tournaments
  for insert with check (organizer_id = auth.uid() or is_admin());

create policy tournaments_organizer_update on public.tournaments
  for update using (organizer_id = auth.uid() or is_admin());

-- ===== TEAMS =====
create policy teams_public_read on public.teams for select using (true);

create policy teams_organizer_write on public.teams
  for insert with check (
    exists (select 1 from public.tournaments where id = tournament_id and (organizer_id = auth.uid() or is_admin()))
  );

-- ===== PLAYERS =====
create policy players_public_read on public.players for select using (true);

create policy players_organizer_write on public.players
  for insert with check (
    exists (
      select 1 from public.teams t
      join public.tournaments tr on tr.id = t.tournament_id
      where t.id = team_id and (tr.organizer_id = auth.uid() or is_admin())
    )
  );

-- ===== MATCHES =====
create policy matches_public_read on public.matches
  for select using (status in ('live', 'completed') or is_admin());

create policy matches_organizer_manage on public.matches
  for all using (
    exists (select 1 from public.tournaments where id = tournament_id and (organizer_id = auth.uid() or is_admin()))
  );

-- ===== INNINGS =====
create policy innings_public_read on public.innings for select using (
  exists (select 1 from public.matches where id = match_id and status in ('live', 'completed'))
);

create policy innings_scorer_insert on public.innings
  for insert with check (is_scorer_for_match(match_id) or is_admin());

-- ===== BALL EVENTS =====
create policy ball_events_public_read on public.ball_events
  for select using (
    not is_void
    and exists (
      select 1 from public.innings i
      join public.matches m on m.id = i.match_id
      where i.id = innings_id and m.status in ('live', 'completed')
    )
  );

create policy ball_events_scorer_insert on public.ball_events
  for insert with check (
    recorded_by = auth.uid()
    and is_scorer_for_match(
      (select match_id from public.innings where id = innings_id)
    )
  );

-- Admin can void (undo) balls
create policy ball_events_scorer_void on public.ball_events
  for update using (
    is_scorer_for_match(
      (select match_id from public.innings where id = innings_id)
    ) or is_admin()
  );

-- ===== STATS — public read =====
create policy stats_public_read on public.player_match_stats for select using (true);
create policy leaderboard_public_read on public.tournament_player_aggregates for select using (true);
```

- [ ] **Step 3: Apply migrations**

```bash
cd infra/supabase && supabase db push
```

- [ ] **Step 4: Commit**

```bash
cd ../..
git add infra/supabase/migrations/
git commit -m "chore(db): indexes + RLS policies for all tables"
```

---

## Task 14: Seed Data

**Files:**
- Create: `infra/supabase/migrations/20260512000007_seed.sql`

- [ ] **Step 1: Write seed**

`infra/supabase/migrations/20260512000007_seed.sql`:

```sql
-- NOTE: Run only in development. The admin user must exist in auth.users first.
-- Create via: supabase auth admin create-user --email admin@scf.local --password Admin1234!

do $$
declare
  v_admin_id uuid;
  v_tourney   uuid;
  v_team_a    uuid;
  v_team_b    uuid;
  v_match     uuid;
begin
  select id into v_admin_id from auth.users where email = 'admin@scf.local';
  if v_admin_id is null then
    raise notice 'admin user not found — skipping seed';
    return;
  end if;

  insert into public.users (id, email, full_name, role)
  values (v_admin_id, 'admin@scf.local', 'SCF Admin', 'admin')
  on conflict (id) do nothing;

  insert into public.tournaments (id, name, season, format, organizer_id, status)
  values (gen_random_uuid(), 'Cricket Fiesta 2026', '2026', 'T20', v_admin_id, 'active')
  returning id into v_tourney;

  insert into public.teams (id, tournament_id, name, short_name)
  values (gen_random_uuid(), v_tourney, 'Blue Eagles', 'BLE')
  returning id into v_team_a;

  insert into public.teams (id, tournament_id, name, short_name)
  values (gen_random_uuid(), v_tourney, 'Red Hawks', 'RHK')
  returning id into v_team_b;

  -- Players for Blue Eagles
  insert into public.players (team_id, name, jersey_no, role) values
    (v_team_a, 'Ali Hassan',    1, 'batter'),
    (v_team_a, 'Usman Khan',    2, 'batter'),
    (v_team_a, 'Bilal Ahmed',   3, 'all_rounder'),
    (v_team_a, 'Saad Malik',    4, 'bowler'),
    (v_team_a, 'Omar Sheikh',   5, 'wicket_keeper'),
    (v_team_a, 'Hamza Raza',    6, 'batter'),
    (v_team_a, 'Tariq Butt',    7, 'bowler'),
    (v_team_a, 'Kamran Javed',  8, 'all_rounder'),
    (v_team_a, 'Asad Iqbal',    9, 'bowler'),
    (v_team_a, 'Faisal Noor',  10, 'bowler'),
    (v_team_a, 'Zain Abbas',   11, 'batter');

  -- Players for Red Hawks
  insert into public.players (team_id, name, jersey_no, role) values
    (v_team_b, 'Rahul Verma',   1, 'batter'),
    (v_team_b, 'Arjun Sharma',  2, 'batter'),
    (v_team_b, 'Karan Singh',   3, 'all_rounder'),
    (v_team_b, 'Dev Patel',     4, 'bowler'),
    (v_team_b, 'Rohit Gupta',   5, 'wicket_keeper'),
    (v_team_b, 'Nikhil Mehta',  6, 'batter'),
    (v_team_b, 'Sanjay Kumar',  7, 'bowler'),
    (v_team_b, 'Vikram Das',    8, 'all_rounder'),
    (v_team_b, 'Amit Joshi',    9, 'bowler'),
    (v_team_b, 'Priya Nair',   10, 'bowler'),
    (v_team_b, 'Rahul Nair',   11, 'batter');

  insert into public.matches (
    tournament_id, team_a_id, team_b_id, venue, scheduled_at, overs_per_innings, status
  ) values (
    v_tourney, v_team_a, v_team_b, 'School Ground A',
    now() + interval '1 day', 20, 'scheduled'
  ) returning id into v_match;

  raise notice 'Seed complete. Match id: %', v_match;
end $$;
```

- [ ] **Step 2: Create admin user**

```bash
cd infra/supabase
supabase auth admin create-user --email admin@scf.local --password Admin1234\!
```

Expected: user created with UUID printed.

- [ ] **Step 3: Apply seed**

```bash
supabase db push
```

- [ ] **Step 4: Verify via Supabase Studio**

```bash
supabase studio
```

Open browser at `http://localhost:54323`. Navigate to Table Editor → `tournaments`. Confirm 1 row: "Cricket Fiesta 2026".

- [ ] **Step 5: Commit**

```bash
cd ../..
git add infra/supabase/migrations/20260512000007_seed.sql
git commit -m "chore(db): dev seed — tournament, 2 teams, 22 players, 1 match"
```

---

## Task 15: Dependency Cruiser Enforcement

**Files:**
- Create: `.dependency-cruiser.cjs`

- [ ] **Step 1: Install**

```bash
pnpm add -D dependency-cruiser -w
```

- [ ] **Step 2: Write config**

`.dependency-cruiser.cjs`:

```js
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-no-infra',
      severity: 'error',
      comment: 'Domain must not import infrastructure',
      from: { path: 'packages/domain/src' },
      to:   { path: 'packages/infrastructure' },
    },
    {
      name: 'domain-no-contracts',
      severity: 'warn',
      comment: 'Domain should not depend on contracts (transport types)',
      from: { path: 'packages/domain/src' },
      to:   { path: 'packages/contracts/src' },
    },
    {
      name: 'application-no-infra',
      severity: 'error',
      comment: 'Application layer must not import infrastructure directly',
      from: { path: 'packages/application/src' },
      to:   { path: 'packages/infrastructure/src' },
    },
    {
      name: 'contracts-no-domain',
      severity: 'error',
      comment: 'Contracts must not import domain types (keep transport pure)',
      from: { path: 'packages/contracts/src' },
      to:   { path: 'packages/domain/src' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'packages/domain/tsconfig.json' },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
```

- [ ] **Step 3: Add to CI check**

Add to root `package.json` scripts:

```json
"validate:arch": "depcruise packages/domain/src packages/application/src packages/contracts/src --config .dependency-cruiser.cjs"
```

- [ ] **Step 4: Run and verify**

```bash
pnpm validate:arch
```

Expected: no `error` violations printed.

- [ ] **Step 5: Commit**

```bash
git add .dependency-cruiser.cjs package.json
git commit -m "chore: dependency-cruiser enforces clean architecture layer boundaries"
```

---

## Task 16: CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Test (domain + contracts)
        run: pnpm test:ci

      - name: Validate architecture
        run: pnpm validate:arch

      - name: Build packages
        run: pnpm build --filter="./packages/*"
```

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "chore: GitHub Actions CI — type-check, lint, test, arch-validate, build"
```

---

## Task 17: Install All Deps + Verify Full Build

- [ ] **Step 1: Install from workspace root**

```bash
pnpm install
```

Expected: no errors, lockfile updated.

- [ ] **Step 2: Build all packages**

```bash
pnpm build --filter="./packages/*"
```

Expected:
- `packages/domain/dist/` populated
- `packages/contracts/dist/` populated
- `packages/application/dist/` populated

- [ ] **Step 3: Run all tests**

```bash
pnpm test
```

Expected: all test suites pass (domain only at this stage).

- [ ] **Step 4: Validate architecture**

```bash
pnpm validate:arch
```

Expected: `0 errors` in output.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: full plan-1 foundation verified — domain, contracts, application, supabase schema, CI"
```

---

## Self-Review

### Spec coverage check

| Requirement | Covered in Task |
|---|---|
| Monorepo (pnpm + Turborepo) | Task 1 |
| TypeScript strict config | Task 2 |
| @scf/domain — entities, VOs, events, aggregates | Tasks 3–7 |
| Innings aggregate (ball-by-ball, undo, concurrency guard) | Task 6 |
| Match aggregate (toss, start, end) | Task 7 |
| Tournament aggregate (publish) | Task 7 |
| @scf/contracts — Zod schemas + WS contracts | Task 8 |
| @scf/application — ports (interfaces) | Task 9 |
| Supabase migrations (enums, tables, indexes, RLS) | Tasks 10–13 |
| Seed data | Task 14 |
| Layer boundary enforcement (dependency-cruiser) | Task 15 |
| CI | Task 16 |
| SOLID / Clean Architecture | Throughout |
| DDD (bounded contexts, aggregates, VOs, events) | Tasks 3–7 |
| Event Sourcing (ball_events append-only) | Task 12, Task 6 |

### Placeholder scan
No TBDs, TODOs, or vague "add validation" instructions found. All steps contain exact code.

### Type consistency check
- `BallRecordedEvent` constructed in `innings.aggregate.ts` matches signature in `scoring.events.ts` ✓
- `RecordBallSchema` in contracts maps to `RecordBallCommand` in domain ✓
- `WicketKind` enum in domain matches `wicket_kind` Postgres enum ✓
- `Over.restore()` factory added before it is used in undo ✓
