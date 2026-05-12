import { AggregateRoot } from '../shared/aggregate-root';
import { ok, err, type Result } from '../shared/result';
import { Ball } from './ball.entity';
import { Score } from './score.value-object';
import { Over } from './over.value-object';
import { Wicket } from './wicket.value-object';
import type { WicketKind } from './wicket.value-object';
import { InningsClosedError, ConcurrencyError, InvalidBallError } from './scoring.errors';
import {
  BallRecordedEvent,
  BallUndoneEvent,
  OverCompletedEvent,
  InningsCompletedEvent,
} from './scoring.events';
import { randomUUID } from 'crypto';

interface StartInningsCommand {
  id: string;
  matchId: string;
  number: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  maxOvers: number;
}

interface RecordBallCommand {
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  extras: { wide?: number; noBall?: number; bye?: number; legBye?: number };
  wicket: { kind: string; dismissedPlayerId: string; fielderId: string | null; bowlerId: string | null } | null;
  expectedSeq: number;
}

interface UndoCommand {
  actorId: string;
}

export class Innings extends AggregateRoot<string> {
  private _balls: Ball[] = [];
  private _score = Score.zero();
  private _wickets = 0;
  private _currentOver = Over.first();
  private _isComplete = false;
  private _runsThisOver = 0;
  private _wicketsThisOver = 0;

  private constructor(
    private readonly _matchId: string,
    private readonly _number: number,
    private readonly _battingTeamId: string,
    private readonly _maxOvers: number,
  ) {
    super(_matchId + ':innings:' + _number);
  }

  static start(cmd: StartInningsCommand): Innings {
    return new Innings(cmd.matchId, cmd.number, cmd.battingTeamId, cmd.maxOvers);
  }

  get matchId(): string { return this._matchId; }
  get totalRuns(): number { return this._score.total; }
  get totalWickets(): number { return this._wickets; }
  get currentOver(): Over { return this._currentOver; }
  get isComplete(): boolean { return this._isComplete; }
  get currentSeq(): number { return this._balls.length; }

  recordBall(cmd: RecordBallCommand): Result<BallRecordedEvent, InningsClosedError | ConcurrencyError | InvalidBallError> {
    if (this._isComplete) return err(new InningsClosedError());
    if (cmd.expectedSeq !== this._balls.length) {
      return err(new ConcurrencyError(this._balls.length, cmd.expectedSeq));
    }

    const extras = {
      wide:   cmd.extras.wide   ?? 0,
      noBall: cmd.extras.noBall ?? 0,
      bye:    cmd.extras.bye    ?? 0,
      legBye: cmd.extras.legBye ?? 0,
    };

    const wicket = cmd.wicket
      ? Wicket.create({
          kind: cmd.wicket.kind as WicketKind,
          dismissedPlayerId: cmd.wicket.dismissedPlayerId,
          fielderId: cmd.wicket.fielderId,
          bowlerId: cmd.wicket.bowlerId,
        })
      : null;

    const ball = Ball.create({
      id: randomUUID(),
      inningsId: this._id,
      seq: this._balls.length,
      overNumber: this._currentOver.number,
      ballInOver: this._currentOver.legalBallsBowled + 1,
      strikerId: cmd.strikerId,
      nonStrikerId: cmd.nonStrikerId,
      bowlerId: cmd.bowlerId,
      runsOffBat: cmd.runs,
      extras,
      wicket,
    });

    this._balls.push(ball);
    this._score = this._score.addRuns(cmd.runs).addExtras(extras);
    this._runsThisOver += ball.totalRuns;

    if (ball.isWicket) {
      this._wickets++;
      this._wicketsThisOver++;
    }

    if (ball.isLegal) {
      this._currentOver = this._currentOver.recordLegalBall();
    }

    const event = new BallRecordedEvent(
      this._id, this._matchId, ball, this._score.total, this._wickets, this._currentOver.display,
    );
    this.addEvent(event);

    if (ball.isLegal && this._currentOver.isComplete) {
      this.addEvent(new OverCompletedEvent(
        this._id, this._matchId, this._currentOver.number,
        this._runsThisOver, this._wicketsThisOver,
      ));
      this._currentOver = this._currentOver.next();
      this._runsThisOver = 0;
      this._wicketsThisOver = 0;

      if (this._currentOver.number > this._maxOvers) {
        this._isComplete = true;
        this.addEvent(new InningsCompletedEvent(
          this._id, this._matchId, this._score.total, this._wickets, 'overs_complete',
        ));
      }
    }

    if (!this._isComplete && this._wickets >= 10) {
      this._isComplete = true;
      this.addEvent(new InningsCompletedEvent(
        this._id, this._matchId, this._score.total, this._wickets, 'all_out',
      ));
    }

    return ok(event);
  }

  undoLastBall(cmd: UndoCommand): Result<BallUndoneEvent, InvalidBallError> {
    if (this._balls.length === 0) return err(new InvalidBallError('No balls to undo'));
    const last = this._balls.pop()!;

    this._score = this._score.addRuns(-last.runsOffBat).addExtras({
      wide:   -last.extras.wide,
      noBall: -last.extras.noBall,
      bye:    -last.extras.bye,
      legBye: -last.extras.legBye,
    });

    if (last.isWicket) this._wickets--;
    if (last.isLegal) {
      this._currentOver = Over.restore(
        this._currentOver.number,
        this._currentOver.legalBallsBowled - 1,
      );
    }
    this._isComplete = false;

    // Rebuild per-over counters from remaining balls in current over
    const currentOverNum = this._currentOver.number;
    this._runsThisOver = 0;
    this._wicketsThisOver = 0;
    for (const b of this._balls) {
      if (b.overNumber === currentOverNum) {
        this._runsThisOver += b.totalRuns;
        if (b.isWicket) this._wicketsThisOver++;
      }
    }

    const event = new BallUndoneEvent(
      this._id, this._matchId, last.seq, cmd.actorId, this._score.total, this._wickets,
    );
    this.addEvent(event);
    return ok(event);
  }
}
