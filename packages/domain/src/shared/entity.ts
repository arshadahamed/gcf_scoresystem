export abstract class Entity<TId> {
  constructor(protected readonly _id: TId) {}
  get id(): TId { return this._id; }
  equals(other: Entity<TId>): boolean {
    if (!(other instanceof Entity)) return false;
    return JSON.stringify(this._id) === JSON.stringify(other._id);
  }
}
