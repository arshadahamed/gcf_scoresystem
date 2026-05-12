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
