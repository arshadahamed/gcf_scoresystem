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
