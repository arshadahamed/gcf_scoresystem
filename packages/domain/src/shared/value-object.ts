export abstract class ValueObject<T extends object> {
  protected constructor(protected readonly props: T) {
    Object.freeze(this.props);
  }
  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
