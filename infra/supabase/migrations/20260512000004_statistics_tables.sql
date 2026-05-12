-- =====================================================
-- PLAYER MATCH STATS (projection — rebuilt from ball_events)
-- =====================================================
create table public.player_match_stats (
  innings_id    uuid not null references public.innings(id) on delete cascade,
  player_id     uuid not null references public.players(id),
  runs_scored   int not null default 0,
  balls_faced   int not null default 0,
  fours         int not null default 0,
  sixes         int not null default 0,
  is_out        boolean not null default false,
  dismissal_kind public.wicket_kind,
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
