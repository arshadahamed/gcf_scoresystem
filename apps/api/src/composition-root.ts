import { supabaseAdmin } from './infrastructure/supabase/client';
import { SupabaseMatchRepository }      from './infrastructure/supabase/repositories/supabase-match.repository';
import { SupabaseTournamentRepository } from './infrastructure/supabase/repositories/supabase-tournament.repository';
import { SupabaseEventBus }             from './infrastructure/realtime/supabase-event-bus';
import { SupabaseUnitOfWork }           from './infrastructure/unit-of-work/supabase-unit-of-work';
import { RecordBallUseCase }            from './application/use-cases/scoring/record-ball.use-case';
import { UndoBallUseCase }              from './application/use-cases/scoring/undo-ball.use-case';
import { CreateTournamentUseCase }      from './application/use-cases/tournament/create-tournament.use-case';
import { CreateMatchUseCase }           from './application/use-cases/match/create-match.use-case';
import { StartMatchUseCase }            from './application/use-cases/match/start-match.use-case';
import { DecideTossUseCase }            from './application/use-cases/match/decide-toss.use-case';
import { TournamentController }         from './presentation/http/controllers/tournament.controller';
import { MatchController }              from './presentation/http/controllers/match.controller';
import { ScoringController }            from './presentation/http/controllers/scoring.controller';
import { createTournamentsRouter }      from './presentation/http/routes/tournaments.router';
import { createMatchesRouter }          from './presentation/http/routes/matches.router';
import { createScoringRouter }          from './presentation/http/routes/scoring.router';
import type { Router } from 'express';

export interface AppContainer {
  routers: { tournaments: Router; matches: Router; scoring: Router };
}

export function buildContainer(): AppContainer {
  const matchRepo      = new SupabaseMatchRepository(supabaseAdmin);
  const tournamentRepo = new SupabaseTournamentRepository(supabaseAdmin);
  const eventBus       = new SupabaseEventBus(supabaseAdmin);
  const uow            = new SupabaseUnitOfWork();

  const recordBall       = new RecordBallUseCase(matchRepo, eventBus, uow);
  const undoBall         = new UndoBallUseCase(matchRepo, eventBus, uow);
  const createTournament = new CreateTournamentUseCase(tournamentRepo, eventBus);
  const createMatch      = new CreateMatchUseCase(matchRepo, eventBus);
  const startMatch       = new StartMatchUseCase(matchRepo, eventBus);
  const decideToss       = new DecideTossUseCase(matchRepo, eventBus);

  const tournamentCtrl = new TournamentController(createTournament, tournamentRepo);
  const matchCtrl      = new MatchController(createMatch, startMatch, decideToss, matchRepo);
  const scoringCtrl    = new ScoringController(recordBall, undoBall);

  return {
    routers: {
      tournaments: createTournamentsRouter(tournamentCtrl),
      matches:     createMatchesRouter(matchCtrl),
      scoring:     createScoringRouter(scoringCtrl),
    },
  };
}
