import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ScoringController } from '../../../src/presentation/http/controllers/scoring.controller';
import { RecordBallUseCase } from '../../../src/application/use-cases/scoring/record-ball.use-case';
import { UndoBallUseCase } from '../../../src/application/use-cases/scoring/undo-ball.use-case';
import { createScoringRouter } from '../../../src/presentation/http/routes/scoring.router';
import { InMemoryMatchRepository } from '../../unit/use-cases/in-memory-match.repository';
import { Match, Innings } from '@scf/domain';
import { errorHandler } from '../../../src/presentation/http/middleware/error.middleware';

vi.mock('../../../src/presentation/http/middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: 'scorer-user', email: 'scorer@test.com', role: 'scorer' };
    next();
  },
}));

vi.mock('../../../src/config', () => ({
  config: {
    PORT: 3001,
    NODE_ENV: 'test',
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    SUPABASE_JWT_SECRET: 'test-secret',
    CORS_ORIGINS: 'http://localhost:3000',
  },
}));

// Innings.start ignores the `id` param and computes: matchId + ':innings:' + number
// So Innings.start({ id: 'inn1', matchId: 'm1', number: 1, ... }).id === 'm1:innings:1'
const INNINGS_ID = 'm1:innings:1';

function buildTestApp() {
  const repo = new InMemoryMatchRepository();
  const bus = { publish: vi.fn(), publishAll: vi.fn() };
  const uow = { run: (fn: any) => fn() };

  const match = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
  match.decideToss({ winnerId: 'ta', decision: 'bat' });
  match.start();
  match.pullDomainEvents();
  repo.seedMatch(match);

  const innings = Innings.start({ id: 'inn1', matchId: 'm1', number: 1, battingTeamId: 'ta', bowlingTeamId: 'tb', maxOvers: 20 });
  repo.seedInnings(innings);

  const recordBall = new RecordBallUseCase(repo as any, bus as any, uow as any);
  const undoBall   = new UndoBallUseCase(repo as any, bus as any, uow as any);
  const ctrl = new ScoringController(recordBall, undoBall);

  const app = express();
  app.use(express.json());
  app.use('/v1/scoring', createScoringRouter(ctrl));
  app.use(errorHandler);
  return app;
}

describe('POST /v1/scoring/balls', () => {
  let app: ReturnType<typeof express>;
  beforeAll(() => { app = buildTestApp(); });

  it('202 on valid ball', async () => {
    const res = await request(app).post('/v1/scoring/balls').send({
      inningsId: INNINGS_ID,
      strikerId: '00000000-0000-0000-0000-000000000001',
      nonStrikerId: '00000000-0000-0000-0000-000000000002',
      bowlerId: '00000000-0000-0000-0000-000000000003',
      runs: 4, extras: {}, wicket: null, expectedSeq: 0,
    });
    expect(res.status).toBe(202);
    expect(res.body.data.runsOffBat).toBe(4);
  });

  it('400 on missing inningsId', async () => {
    const res = await request(app).post('/v1/scoring/balls').send({ runs: 1 });
    expect(res.status).toBe(400);
  });
});
