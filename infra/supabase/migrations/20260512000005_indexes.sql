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
