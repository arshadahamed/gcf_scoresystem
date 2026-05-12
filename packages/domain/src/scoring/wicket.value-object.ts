import { ValueObject } from '../shared/value-object';

export type WicketKind =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'run_out'
  | 'stumped'
  | 'hit_wicket'
  | 'obstructing_field'
  | 'handled_ball'
  | 'retired_hurt';

interface WicketProps {
  kind: WicketKind;
  dismissedPlayerId: string;
  fielderId: string | null;
  bowlerId: string | null;
}

export class Wicket extends ValueObject<WicketProps> {
  private constructor(props: WicketProps) { super(props); }

  static create(props: WicketProps): Wicket { return new Wicket(props); }

  get kind(): WicketKind { return this.props.kind; }
  get dismissedPlayerId(): string { return this.props.dismissedPlayerId; }
  get fielderId(): string | null { return this.props.fielderId; }
  get bowlerId(): string | null { return this.props.bowlerId; }

  get chargesAgainstBowler(): boolean {
    return ['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket'].includes(this.props.kind);
  }
}
