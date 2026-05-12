import { AggregateRoot } from '../shared/aggregate-root';
import { ok, err, type Result } from '../shared/result';
import { AlreadyPublishedError, TournamentError } from './tournament.errors';
import { TournamentPublishedEvent } from './tournament.events';

type TournamentStatus = 'draft' | 'active' | 'completed' | 'cancelled';
type MatchFormat = 'T10' | 'T20' | 'ODI' | 'Custom';

interface CreateTournamentCmd {
  id: string;
  name: string;
  season: string;
  format: MatchFormat;
  organizerId: string;
}

export class Tournament extends AggregateRoot<string> {
  private _status: TournamentStatus = 'draft';

  private constructor(
    id: string,
    private _name: string,
    private readonly _season: string,
    private readonly _format: MatchFormat,
    private readonly _organizerId: string,
  ) { super(id); }

  static create(cmd: CreateTournamentCmd): Tournament {
    return new Tournament(cmd.id, cmd.name, cmd.season, cmd.format, cmd.organizerId);
  }

  get name(): string { return this._name; }
  get season(): string { return this._season; }
  get format(): MatchFormat { return this._format; }
  get status(): TournamentStatus { return this._status; }
  get organizerId(): string { return this._organizerId; }

  publish(): Result<TournamentPublishedEvent, AlreadyPublishedError> {
    if (this._status !== 'draft') return err(new AlreadyPublishedError());
    this._status = 'active';
    const event = new TournamentPublishedEvent(this._id);
    this.addEvent(event);
    return ok(event);
  }
}
