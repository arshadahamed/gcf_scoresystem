export class TournamentError extends Error {
  constructor(msg: string) { super(msg); this.name = 'TournamentError'; }
}
export class AlreadyPublishedError extends TournamentError {
  constructor() { super('Tournament is already active'); }
}
