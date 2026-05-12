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
