import { Entity } from '../shared/entity';
import { Role } from './role.value-object';

interface UserProps {
  id: string;
  email: string;
  role: Role;
  createdAt?: Date;
}

export class User extends Entity<string> {
  private readonly _email: string;
  private readonly _role: Role;
  private readonly _createdAt: Date;

  private constructor(props: UserProps) {
    super(props.id);
    this._email = props.email;
    this._role = props.role;
    this._createdAt = props.createdAt ?? new Date();
  }

  static create(props: UserProps): User {
    return new User(props);
  }

  get email(): string { return this._email; }
  get role(): Role { return this._role; }
  get createdAt(): Date { return this._createdAt; }

  isAdmin(): boolean { return this._role === Role.Admin; }
  isOrganizer(): boolean { return this._role === Role.Organizer || this._role === Role.Admin; }
  isScorer(): boolean { return this._role === Role.Scorer; }
}
