import { ValueObject } from '../shared/value-object';

interface ScoreProps {
  runs: number;
  extras: number;
}

export class Score extends ValueObject<ScoreProps> {
  private constructor(props: ScoreProps) { super(props); }

  static zero(): Score { return new Score({ runs: 0, extras: 0 }); }

  get runs(): number { return this.props.runs; }
  get extras(): number { return this.props.extras; }
  get total(): number { return this.props.runs + this.props.extras; }

  addRuns(runs: number): Score {
    return new Score({ ...this.props, runs: this.props.runs + runs });
  }

  addExtras(ex: { wide?: number; noBall?: number; bye?: number; legBye?: number }): Score {
    const add = (ex.wide ?? 0) + (ex.noBall ?? 0) + (ex.bye ?? 0) + (ex.legBye ?? 0);
    return new Score({ ...this.props, extras: this.props.extras + add });
  }
}
