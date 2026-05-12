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
