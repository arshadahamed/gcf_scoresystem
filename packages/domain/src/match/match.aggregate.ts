import { AggregateRoot } from '../shared/aggregate-root';
import { ok, err, type Result } from '../shared/result';
import { TossNotDecidedError, MatchAlreadyStartedError, MatchError } from './match.errors';
import { MatchStartedEvent, TossDecidedEvent, MatchEndedEvent } from './match.events';

type MatchStatus = 'scheduled' | 'live' | 'completed' | 'abandoned';

interface CreateMatchCmd {
  id: string;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  oversPerInnings: number;
  scheduledAt: Date;
}

interface TossCmd {
  winnerId: string;
  decision: 'bat' | 'bowl';
}

interface EndMatchCmd {
  winnerId: string | null;
  resultSummary: string;
}

export class Match extends AggregateRoot<string> {
  private _status: MatchStatus = 'scheduled';
  private _tossWinnerId: string | null = null;
  private _tossDecision: 'bat' | 'bowl' | null = null;
  private _winnerId: string | null = null;

  private constructor(
    id: string,
    private readonly _tournamentId: string,
    private readonly _teamAId: string,
    private readonly _teamBId: string,
    private readonly _oversPerInnings: number,
    private readonly _scheduledAt: Date,
  ) { super(id); }

  static create(cmd: CreateMatchCmd): Match {
    return new Match(cmd.id, cmd.tournamentId, cmd.teamAId, cmd.teamBId, cmd.oversPerInnings, cmd.scheduledAt);
  }

  get status(): MatchStatus { return this._status; }
  get tossWinnerId(): string | null { return this._tossWinnerId; }
  get tossDecision(): 'bat' | 'bowl' | null { return this._tossDecision; }
  get oversPerInnings(): number { return this._oversPerInnings; }
  get tournamentId(): string { return this._tournamentId; }

  decideToss(cmd: TossCmd): void {
    this._tossWinnerId = cmd.winnerId;
    this._tossDecision = cmd.decision;
    this.addEvent(new TossDecidedEvent(this._id, cmd.winnerId, cmd.decision));
  }

  start(): Result<MatchStartedEvent, TossNotDecidedError | MatchAlreadyStartedError> {
    if (this._tossWinnerId === null) return err(new TossNotDecidedError());
    if (this._status === 'live') return err(new MatchAlreadyStartedError());
    this._status = 'live';
    const event = new MatchStartedEvent(this._id, this._tournamentId);
    this.addEvent(event);
    return ok(event);
  }

  end(cmd: EndMatchCmd): Result<MatchEndedEvent, MatchError> {
    if (this._status !== 'live') return err(new MatchError('Only live matches can be ended'));
    this._status = 'completed';
    this._winnerId = cmd.winnerId;
    const event = new MatchEndedEvent(this._id, cmd.winnerId, cmd.resultSummary);
    this.addEvent(event);
    return ok(event);
  }
}
