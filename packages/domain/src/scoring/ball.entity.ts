import { Entity } from '../shared/entity';
import type { Wicket } from './wicket.value-object';

interface BallProps {
  id: string;
  inningsId: string;
  seq: number;
  overNumber: number;
  ballInOver: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runsOffBat: number;
  extras: { wide: number; noBall: number; bye: number; legBye: number };
  wicket: Wicket | null;
}

export class Ball extends Entity<string> {
  private constructor(private readonly props: BallProps) {
    super(props.id);
  }

  static create(props: BallProps): Ball { return new Ball(props); }

  get seq(): number { return this.props.seq; }
  get overNumber(): number { return this.props.overNumber; }
  get ballInOver(): number { return this.props.ballInOver; }
  get strikerId(): string { return this.props.strikerId; }
  get nonStrikerId(): string { return this.props.nonStrikerId; }
  get bowlerId(): string { return this.props.bowlerId; }
  get runsOffBat(): number { return this.props.runsOffBat; }
  get extras() { return this.props.extras; }
  get wicket(): Wicket | null { return this.props.wicket; }

  get isWide(): boolean { return this.props.extras.wide > 0; }
  get isNoBall(): boolean { return this.props.extras.noBall > 0; }
  get isLegal(): boolean { return !this.isWide && !this.isNoBall; }
  get isWicket(): boolean { return this.props.wicket !== null; }

  get totalRuns(): number {
    return this.props.runsOffBat
      + this.props.extras.wide
      + this.props.extras.noBall
      + this.props.extras.bye
      + this.props.extras.legBye;
  }
}
