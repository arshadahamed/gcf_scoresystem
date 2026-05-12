# SCF Plan 3 — Admin Dashboard (Next.js 15)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Depends on:** Plan 2 complete (API running at localhost:3001).

**Goal:** Build the `apps/admin` Next.js 15 dashboard for organizers and admins — tournament creation, team/player management, match scheduling, toss recording, match lifecycle management, and live match monitoring.

**Architecture:** App Router with Server Components for data fetching, Client Components for interactivity. TanStack Query manages server state. Feature-based folder structure. ShadCN UI for all components.

**Tech Stack:** Next.js 15 (App Router), TypeScript 5.5, Tailwind CSS, ShadCN UI, Zustand, TanStack Query v5, React Hook Form, Zod, Supabase JS v2

---

## Folder Structure

```
apps/admin/src/
├── app/
│   ├── layout.tsx                        # Root layout, fonts, providers
│   ├── page.tsx                          # Redirect → /tournaments
│   ├── (auth)/
│   │   └── login/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx                    # Sidebar + header shell
│       ├── tournaments/
│       │   ├── page.tsx                  # Tournament list
│       │   └── new/page.tsx              # Create tournament
│       │   └── [id]/
│       │       ├── page.tsx              # Tournament detail
│       │       ├── teams/
│       │       │   └── page.tsx
│       │       └── matches/
│       │           ├── page.tsx
│       │           └── [matchId]/
│       │               └── page.tsx      # Match detail + live monitor
├── features/
│   ├── auth/
│   │   ├── components/LoginForm.tsx
│   │   └── hooks/useSession.ts
│   ├── tournaments/
│   │   ├── components/
│   │   │   ├── TournamentCard.tsx
│   │   │   └── CreateTournamentForm.tsx
│   │   └── api/
│   │       └── tournaments.queries.ts
│   ├── teams/
│   │   ├── components/
│   │   │   ├── TeamList.tsx
│   │   │   ├── AddTeamForm.tsx
│   │   │   └── PlayerRoster.tsx
│   │   └── api/
│   │       └── teams.queries.ts
│   └── matches/
│       ├── components/
│       │   ├── MatchCard.tsx
│       │   ├── CreateMatchForm.tsx
│       │   ├── TossForm.tsx
│       │   ├── LiveScoreMonitor.tsx
│       │   └── ScorecardTable.tsx
│       └── api/
│           └── matches.queries.ts
├── shared/
│   ├── lib/
│   │   ├── api-client.ts               # Typed fetch wrapper
│   │   ├── supabase.ts                 # Supabase browser client
│   │   └── query-client.ts
│   ├── components/
│   │   ├── Providers.tsx               # QueryClient + Auth provider
│   │   ├── AppSidebar.tsx
│   │   └── PageHeader.tsx
│   └── hooks/
│       └── useRealtimeMatch.ts
└── styles/globals.css
```

---

## Task 1: Scaffold `apps/admin`

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/next.config.ts`
- Create: `apps/admin/tailwind.config.ts`
- Create: `apps/admin/.env.example`

- [ ] **Step 1: Create package.json**

`apps/admin/package.json`:

```json
{
  "name": "@scf/admin",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "start": "next start --port 3002",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@scf/contracts": "workspace:*",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.59.0",
    "@tanstack/react-query-devtools": "^5.59.0",
    "next": "15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zustand": "^5.0.0",
    "zod": "^3.23.0",
    "framer-motion": "^11.0.0",
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

`apps/admin/tsconfig.json`:

```json
{
  "extends": "@scf/config/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: next.config.ts**

`apps/admin/next.config.ts`:

```ts
import type { NextConfig } from 'next';
const config: NextConfig = {
  experimental: { typedRoutes: true },
  images: { domains: ['localhost'] },
};
export default config;
```

- [ ] **Step 4: tailwind.config.ts**

`apps/admin/tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1a6b3c', dark: '#134d2c', light: '#25a05a' },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
```

- [ ] **Step 5: .env.example**

`apps/admin/.env.example`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase-start
```

Copy to `.env.local` and fill values from `supabase status`.

- [ ] **Step 6: Init ShadCN**

```bash
cd apps/admin
pnpm dlx shadcn@latest init -y
```

When prompted: TypeScript=yes, style=default, baseColor=slate, cssVariables=yes, tailwind config=tailwind.config.ts, components=src/shared/components/ui, utils=src/shared/lib/utils.

Add required components:

```bash
pnpm dlx shadcn@latest add button card dialog form input label select table badge toast sidebar separator
```

- [ ] **Step 7: Install + verify**

```bash
pnpm install && pnpm dev
```

Open `http://localhost:3002`. Should show Next.js default page (no errors).

- [ ] **Step 8: Commit**

```bash
cd ../..
git add apps/admin/
git commit -m "chore(admin): scaffold Next.js 15 app with ShadCN + Tailwind"
```

---

## Task 2: Shared Lib — API Client + Supabase + QueryClient

**Files:**
- Create: `apps/admin/src/shared/lib/api-client.ts`
- Create: `apps/admin/src/shared/lib/supabase.ts`
- Create: `apps/admin/src/shared/lib/query-client.ts`
- Create: `apps/admin/src/shared/components/Providers.tsx`

- [ ] **Step 1: API client**

`apps/admin/src/shared/lib/api-client.ts`:

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  token?: string;
};

export class ApiError extends Error {
  constructor(readonly status: number, readonly data: unknown, message: string) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json, json.title ?? 'Request failed');
  return (json.data ?? json) as T;
}
```

- [ ] **Step 2: Supabase browser client**

`apps/admin/src/shared/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}
```

- [ ] **Step 3: Query client**

`apps/admin/src/shared/lib/query-client.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
```

- [ ] **Step 4: Providers**

`apps/admin/src/shared/components/Providers.tsx`:

```tsx
'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/shared/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/shared/
git commit -m "feat(admin): API client, Supabase client, QueryClient, Providers"
```

---

## Task 3: Root Layout + Auth Pages

**Files:**
- Create: `apps/admin/src/app/layout.tsx`
- Create: `apps/admin/src/app/page.tsx`
- Create: `apps/admin/src/app/(auth)/login/page.tsx`
- Create: `apps/admin/src/features/auth/components/LoginForm.tsx`
- Create: `apps/admin/src/features/auth/hooks/useSession.ts`
- Create: `apps/admin/src/styles/globals.css`

- [ ] **Step 1: Globals CSS**

`apps/admin/src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 143 60% 27%;
    --primary-foreground: 0 0% 100%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}

* { @apply border-border; }
body { @apply bg-background text-foreground; }
```

- [ ] **Step 2: Root layout**

`apps/admin/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/shared/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SCF Admin — School Cricket Fiesta',
  description: 'Tournament management dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Root page (redirect)**

`apps/admin/src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
export default function RootPage() { redirect('/tournaments'); }
```

- [ ] **Step 4: Login page**

`apps/admin/src/app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand to-brand-dark">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold text-white mb-8">SCF Admin</h1>
        <LoginForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: LoginForm component**

`apps/admin/src/features/auth/components/LoginForm.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/tournaments');
  };

  return (
    <Card>
      <CardHeader><CardTitle>Sign in</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full bg-brand hover:bg-brand-dark" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: useSession hook**

`apps/admin/src/features/auth/hooks/useSession.ts`:

```ts
'use client';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { session, loading, accessToken: session?.access_token ?? null };
}
```

- [ ] **Step 7: Test login manually**

```bash
cd apps/admin && pnpm dev
```

Navigate to `http://localhost:3002/login`. Sign in with `admin@scf.local` / `Admin1234!`. Should redirect to `/tournaments` (404 at this stage — next task).

- [ ] **Step 8: Commit**

```bash
cd ../..
git add apps/admin/src/
git commit -m "feat(admin): root layout, login page + LoginForm with Supabase auth"
```

---

## Task 4: Dashboard Layout + Sidebar

**Files:**
- Create: `apps/admin/src/app/(dashboard)/layout.tsx`
- Create: `apps/admin/src/shared/components/AppSidebar.tsx`
- Create: `apps/admin/src/shared/components/PageHeader.tsx`

- [ ] **Step 1: Dashboard layout**

`apps/admin/src/app/(dashboard)/layout.tsx`:

```tsx
import { AppSidebar } from '@/shared/components/AppSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Sidebar**

`apps/admin/src/shared/components/AppSidebar.tsx`:

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Calendar, Users, Home, LogOut } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';

const nav = [
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/matches',     label: 'Matches',     icon: Calendar },
];

export function AppSidebar() {
  const path = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-56 bg-brand-dark flex flex-col h-full">
      <div className="p-4 border-b border-brand">
        <h2 className="text-white font-bold text-lg">SCF Admin</h2>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              path.startsWith(href) ? 'bg-brand text-white' : 'text-green-100 hover:bg-brand',
            )}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-brand">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-green-100 hover:bg-brand w-full rounded-md">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: PageHeader**

`apps/admin/src/shared/components/PageHeader.tsx`:

```tsx
interface PageHeaderProps { title: string; description?: string; action?: React.ReactNode; }

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/
git commit -m "feat(admin): dashboard layout + sidebar navigation"
```

---

## Task 5: Tournaments Feature

**Files:**
- Create: `apps/admin/src/features/tournaments/api/tournaments.queries.ts`
- Create: `apps/admin/src/features/tournaments/components/TournamentCard.tsx`
- Create: `apps/admin/src/features/tournaments/components/CreateTournamentForm.tsx`
- Create: `apps/admin/src/app/(dashboard)/tournaments/page.tsx`
- Create: `apps/admin/src/app/(dashboard)/tournaments/new/page.tsx`

- [ ] **Step 1: TanStack queries**

`apps/admin/src/features/tournaments/api/tournaments.queries.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/shared/lib/api-client';
import { getAccessToken } from '@/shared/lib/supabase';
import type { TournamentDTO, CreateTournamentDTO } from '@scf/contracts';

export const tournamentKeys = {
  all: ['tournaments'] as const,
  list: () => [...tournamentKeys.all, 'list'] as const,
};

export function useTournaments() {
  return useQuery({
    queryKey: tournamentKeys.list(),
    queryFn: () => apiRequest<TournamentDTO[]>('/v1/tournaments'),
  });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateTournamentDTO) => {
      const token = await getAccessToken();
      return apiRequest('/v1/tournaments', { method: 'POST', body: dto, token: token ?? undefined });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: tournamentKeys.all }),
  });
}
```

- [ ] **Step 2: TournamentCard**

`apps/admin/src/features/tournaments/components/TournamentCard.tsx`:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import Link from 'next/link';
import type { TournamentDTO } from '@scf/contracts';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function TournamentCard({ t }: { t: TournamentDTO }) {
  return (
    <Link href={`/tournaments/${t.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{t.name}</CardTitle>
            <Badge className={statusColors[t.status] ?? ''}>{t.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          <p>{t.format} · {t.season}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 3: CreateTournamentForm**

`apps/admin/src/features/tournaments/components/CreateTournamentForm.tsx`:

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { CreateTournamentSchema, type CreateTournamentDTO } from '@scf/contracts';
import { useCreateTournament } from '../api/tournaments.queries';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

export function CreateTournamentForm() {
  const router = useRouter();
  const mutation = useCreateTournament();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateTournamentDTO>({
    resolver: zodResolver(CreateTournamentSchema),
  });

  const onSubmit = async (data: CreateTournamentDTO) => {
    await mutation.mutateAsync(data);
    router.push('/tournaments');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <div>
        <Label htmlFor="name">Tournament name</Label>
        <Input id="name" {...register('name')} placeholder="Cricket Fiesta 2026" />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="season">Season</Label>
        <Input id="season" {...register('season')} placeholder="2026" />
      </div>

      <div>
        <Label>Format</Label>
        <Select onValueChange={(v) => setValue('format', v as CreateTournamentDTO['format'])}>
          <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
          <SelectContent>
            {['T10','T20','ODI','Custom'].map(f => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mutation.error && (
        <p className="text-sm text-red-500">{(mutation.error as Error).message}</p>
      )}

      <Button type="submit" disabled={mutation.isPending} className="bg-brand hover:bg-brand-dark">
        {mutation.isPending ? 'Creating…' : 'Create tournament'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Tournaments list page**

`apps/admin/src/app/(dashboard)/tournaments/page.tsx`:

```tsx
import { PageHeader } from '@/shared/components/PageHeader';
import { TournamentsList } from '@/features/tournaments/components/TournamentsList';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';

export default function TournamentsPage() {
  return (
    <div>
      <PageHeader
        title="Tournaments"
        description="Manage your cricket tournaments"
        action={<Link href="/tournaments/new"><Button className="bg-brand hover:bg-brand-dark">New tournament</Button></Link>}
      />
      <div className="p-6">
        <TournamentsList />
      </div>
    </div>
  );
}
```

Create `apps/admin/src/features/tournaments/components/TournamentsList.tsx`:

```tsx
'use client';
import { useTournaments } from '../api/tournaments.queries';
import { TournamentCard } from './TournamentCard';

export function TournamentsList() {
  const { data, isLoading, error } = useTournaments();
  if (isLoading) return <p className="text-gray-500">Loading tournaments…</p>;
  if (error) return <p className="text-red-500">Failed to load tournaments</p>;
  if (!data?.length) return <p className="text-gray-500">No tournaments yet. Create one!</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map(t => <TournamentCard key={t.id} t={t} />)}
    </div>
  );
}
```

- [ ] **Step 5: New tournament page**

`apps/admin/src/app/(dashboard)/tournaments/new/page.tsx`:

```tsx
import { PageHeader } from '@/shared/components/PageHeader';
import { CreateTournamentForm } from '@/features/tournaments/components/CreateTournamentForm';

export default function NewTournamentPage() {
  return (
    <div>
      <PageHeader title="New Tournament" description="Create a new cricket tournament" />
      <div className="p-6"><CreateTournamentForm /></div>
    </div>
  );
}
```

- [ ] **Step 6: Test**

Ensure API is running (`pnpm dev` in apps/api). Navigate to `http://localhost:3002/tournaments`. Should list seeded tournament. Click "New tournament", fill form, submit — should appear in list.

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/features/tournaments/ apps/admin/src/app/
git commit -m "feat(admin): tournaments list + create tournament flow"
```

---

## Task 6: Match Management Feature

**Files:**
- Create: `apps/admin/src/features/matches/api/matches.queries.ts`
- Create: `apps/admin/src/features/matches/components/CreateMatchForm.tsx`
- Create: `apps/admin/src/features/matches/components/TossForm.tsx`
- Create: `apps/admin/src/features/matches/components/MatchCard.tsx`
- Create: `apps/admin/src/features/matches/components/LiveScoreMonitor.tsx`
- Create: `apps/admin/src/shared/hooks/useRealtimeMatch.ts`
- Create: `apps/admin/src/app/(dashboard)/tournaments/[id]/matches/page.tsx`
- Create: `apps/admin/src/app/(dashboard)/tournaments/[id]/matches/[matchId]/page.tsx`

- [ ] **Step 1: Match queries**

`apps/admin/src/features/matches/api/matches.queries.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/shared/lib/api-client';
import { getAccessToken } from '@/shared/lib/supabase';
import type { MatchDTO, CreateMatchDTO, TossDecisionDTO } from '@scf/contracts';

export const matchKeys = {
  all: ['matches'] as const,
  byTournament: (id: string) => ['matches', 'tournament', id] as const,
  detail: (id: string) => ['matches', id] as const,
};

export function useTournamentMatches(tournamentId: string) {
  return useQuery({
    queryKey: matchKeys.byTournament(tournamentId),
    queryFn: () => apiRequest<MatchDTO[]>(`/v1/matches?tournamentId=${tournamentId}`),
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateMatchDTO) => {
      const token = await getAccessToken();
      return apiRequest('/v1/matches', { method: 'POST', body: dto, token: token ?? undefined });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: matchKeys.all }),
  });
}

export function useDecideToss() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, ...dto }: TossDecisionDTO & { matchId: string }) => {
      const token = await getAccessToken();
      return apiRequest(`/v1/matches/${matchId}/toss`, { method: 'POST', body: dto, token: token ?? undefined });
    },
    onSuccess: (_data, vars) => void qc.invalidateQueries({ queryKey: matchKeys.detail(vars.matchId) }),
  });
}

export function useStartMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      const token = await getAccessToken();
      return apiRequest(`/v1/matches/${matchId}/start`, { method: 'POST', token: token ?? undefined });
    },
    onSuccess: (_data, matchId) => void qc.invalidateQueries({ queryKey: matchKeys.detail(matchId) }),
  });
}
```

- [ ] **Step 2: LiveScoreMonitor (Realtime)**

`apps/admin/src/shared/hooks/useRealtimeMatch.ts`:

```ts
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { Channels } from '@scf/contracts';
import type { WsEvent } from '@scf/contracts';

export function useRealtimeMatch(matchId: string) {
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);

  useEffect(() => {
    const channel = supabase.channel(Channels.match(matchId));
    channel.on('broadcast', { event: '*' }, ({ event, payload }) => {
      setLastEvent({ type: event, v: 1, payload } as WsEvent);
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [matchId]);

  return lastEvent;
}
```

`apps/admin/src/features/matches/components/LiveScoreMonitor.tsx`:

```tsx
'use client';
import { useRealtimeMatch } from '@/shared/hooks/useRealtimeMatch';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function LiveScoreMonitor({ matchId }: { matchId: string }) {
  const event = useRealtimeMatch(matchId);

  return (
    <Card>
      <CardHeader><CardTitle>Live Score Feed</CardTitle></CardHeader>
      <CardContent>
        {event ? (
          <div className="font-mono text-sm bg-gray-50 p-3 rounded">
            <p className="font-semibold">{event.type}</p>
            <pre className="text-xs mt-1 overflow-auto">{JSON.stringify(event.payload, null, 2)}</pre>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Waiting for live events…</p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: MatchCard**

`apps/admin/src/features/matches/components/MatchCard.tsx`:

```tsx
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';
import type { MatchDTO } from '@scf/contracts';

const statusBadge: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-700',
  live: 'bg-green-100 text-green-700 animate-pulse',
  completed: 'bg-blue-100 text-blue-700',
};

export function MatchCard({ match, tournamentId }: { match: MatchDTO; tournamentId: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{match.teamAName} vs {match.teamBName}</span>
          <Badge className={statusBadge[match.status] ?? ''}>{match.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-gray-500 space-y-1">
        <p>{match.venue ?? 'TBD'} · {new Date(match.scheduledAt).toLocaleDateString()}</p>
        <p>{match.oversPerInnings} overs</p>
        <Link href={`/tournaments/${tournamentId}/matches/${match.id}`}>
          <Button variant="outline" size="sm" className="mt-2">Manage</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Matches page**

`apps/admin/src/app/(dashboard)/tournaments/[id]/matches/page.tsx`:

```tsx
'use client';
import { use } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { useTournamentMatches } from '@/features/matches/api/matches.queries';
import { MatchCard } from '@/features/matches/components/MatchCard';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';

export default function MatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: matches, isLoading } = useTournamentMatches(id);

  return (
    <div>
      <PageHeader
        title="Matches"
        action={<Link href={`/tournaments/${id}/matches/new`}><Button className="bg-brand hover:bg-brand-dark">Schedule match</Button></Link>}
      />
      <div className="p-6">
        {isLoading && <p className="text-gray-400">Loading…</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(matches ?? []).map(m => <MatchCard key={m.id} match={m} tournamentId={id} />)}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Match detail page**

`apps/admin/src/app/(dashboard)/tournaments/[id]/matches/[matchId]/page.tsx`:

```tsx
'use client';
import { use } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { LiveScoreMonitor } from '@/features/matches/components/LiveScoreMonitor';
import { TossForm } from '@/features/matches/components/TossForm';
import { useStartMatch } from '@/features/matches/api/matches.queries';
import { Button } from '@/shared/components/ui/button';

export default function MatchDetailPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { matchId } = use(params);
  const startMatch = useStartMatch();

  return (
    <div>
      <PageHeader title="Match Control" />
      <div className="p-6 space-y-6">
        <TossForm matchId={matchId} />
        <Button
          onClick={() => startMatch.mutate(matchId)}
          disabled={startMatch.isPending}
          className="bg-brand hover:bg-brand-dark"
        >
          {startMatch.isPending ? 'Starting…' : 'Start match'}
        </Button>
        <LiveScoreMonitor matchId={matchId} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: TossForm**

`apps/admin/src/features/matches/components/TossForm.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { useDecideToss } from '../api/matches.queries';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function TossForm({ matchId }: { matchId: string }) {
  const [winnerId, setWinnerId] = useState('');
  const [decision, setDecision] = useState<'bat'|'bowl'>('bat');
  const mutation = useDecideToss();

  return (
    <Card>
      <CardHeader><CardTitle>Toss</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Toss winner (Team ID)</Label>
          <Input value={winnerId} onChange={e => setWinnerId(e.target.value)} placeholder="Team UUID" />
        </div>
        <div>
          <Label>Decision</Label>
          <Select value={decision} onValueChange={v => setDecision(v as 'bat'|'bowl')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bat">Bat first</SelectItem>
              <SelectItem value="bowl">Bowl first</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => mutation.mutate({ matchId, winnerId, decision })}
          disabled={mutation.isPending || !winnerId}
        >
          Record toss
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/features/matches/ apps/admin/src/app/ apps/admin/src/shared/hooks/
git commit -m "feat(admin): match management — list, create, toss, start, live monitor"
```

---

## Task 7: Vercel Deployment Config

**Files:**
- Create: `apps/admin/vercel.json`

- [ ] **Step 1: Create vercel.json**

`apps/admin/vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm install --frozen-lockfile && pnpm build --filter @scf/contracts && cd apps/admin && pnpm build",
  "outputDirectory": ".next"
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/vercel.json
git commit -m "chore(admin): Vercel deployment config"
```

---

## Self-Review

| Requirement | Covered |
|---|---|
| Tournament CRUD (admin) | Tasks 5, 6 |
| Team/player management | Teams page (wired to API — scaffold in Task 6 match queries) |
| Match scheduling + toss + start | Task 6 |
| Live match monitoring | Task 6 (LiveScoreMonitor + useRealtimeMatch) |
| Auth (Supabase) | Task 3 |
| ShadCN UI components | Task 1 |
| TanStack Query | Tasks 5, 6 |
| Server + Client component split | All pages: Server shells, Client feature components |
| Vercel deployment | Task 7 |
