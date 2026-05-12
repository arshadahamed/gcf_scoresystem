import { ValueObject } from '../shared/value-object';

interface OverProps {
  number: number;
  legalBallsBowled: number;
}

export class Over extends ValueObject<OverProps> {
  private constructor(props: OverProps) { super(props); }

  static first(): Over { return new Over({ number: 1, legalBallsBowled: 0 }); }

  static restore(number: number, legalBallsBowled: number): Over {
    return new Over({ number, legalBallsBowled });
  }

  get number(): number { return this.props.number; }
  get legalBallsBowled(): number { return this.props.legalBallsBowled; }
  get isComplete(): boolean { return this.props.legalBallsBowled >= 6; }

  get display(): string {
    const completedOvers = this.props.number - 1;
    return `${completedOvers}.${this.props.legalBallsBowled}`;
  }

  recordLegalBall(): Over {
    return new Over({ ...this.props, legalBallsBowled: this.props.legalBallsBowled + 1 });
  }

  recordIllegalBall(): Over { return this; }

  next(): Over {
    return new Over({ number: this.props.number + 1, legalBallsBowled: 0 });
  }
}
