export class ScoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScoringError';
  }
}

export class InningsClosedError extends ScoringError {
  constructor() { super('Cannot record ball: innings is closed'); }
}

export class ConcurrencyError extends ScoringError {
  constructor(expected: number, actual: number) {
    super(`Expected sequence ${expected}, got ${actual}. Fetch latest and retry.`);
  }
}

export class InvalidBallError extends ScoringError {
  constructor(reason: string) { super(`Invalid ball: ${reason}`); }
}
