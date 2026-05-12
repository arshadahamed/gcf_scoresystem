import type { SupabaseClient } from '@supabase/supabase-js';
import type { IMatchRepository, BallPersistDTO } from '@scf/application';
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
      id:             data.id,
      matchId:        data.match_id,
      number:         data.number,
      battingTeamId:  data.batting_team_id,
      bowlingTeamId:  data.bowling_team_id ?? '',
      maxOvers:       0,
    });
    Object.assign(innings, {
      _wickets:    data.total_wickets,
      _isComplete: data.is_complete,
    });
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
      const inn = Innings.start({ id: r.id, matchId: r.match_id, number: r.number, battingTeamId: r.batting_team_id, bowlingTeamId: r.bowling_team_id ?? '', maxOvers: 0 });
      Object.assign(inn, { _wickets: r.total_wickets, _isComplete: r.is_complete });
      inn.pullDomainEvents();
      return inn;
    });
  }

  async persistBallEvent(ball: BallPersistDTO): Promise<void> {
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

  async voidBallEvent(inningsId: string, seq: number, actorId: string): Promise<void> {
    const { error } = await this.client
      .from('ball_events')
      .update({ is_void: true })
      .eq('innings_id', inningsId)
      .eq('seq', seq);
    if (error) throw new Error(`Failed to void ball: ${error.message}`);
    // actorId is for audit purposes — log or store separately if needed
    void actorId;
  }
}
