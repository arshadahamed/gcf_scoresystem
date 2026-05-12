export class MatchError extends Error {
  constructor(msg: string) { super(msg); this.name = 'MatchError'; }
}
export class TossNotDecidedError extends MatchError {
  constructor() { super('Toss must be decided before starting the match'); }
}
export class MatchAlreadyStartedError extends MatchError {
  constructor() { super('Match has already started'); }
}
