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
  seq                 int not null,
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
  is_void             boolean not null default false,
  commentary          text,
  recorded_by         uuid not null references public.users(id),
  occurred_at         timestamptz not null default now(),
  unique (innings_id, seq)
);

comment on table public.ball_events is 'Append-only event log. Never delete rows. Use is_void=true for undo.';
