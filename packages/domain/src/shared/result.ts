export type Result<T, E = Error> = OkResult<T, E> | ErrResult<T, E>;

class OkResult<T, E> {
  readonly _tag = 'ok' as const;
  constructor(readonly value: T) {}
  isOk(): this is OkResult<T, E> { return true; }
  isErr(): this is ErrResult<T, E> { return false; }
  map<U>(fn: (v: T) => U): Result<U, E> { return ok(fn(this.value)); }
  flatMap<U>(fn: (v: T) => Result<U, E>): Result<U, E> { return fn(this.value); }
}

class ErrResult<T, E> {
  readonly _tag = 'err' as const;
  constructor(readonly error: E) {}
  isOk(): this is OkResult<T, E> { return false; }
  isErr(): this is ErrResult<T, E> { return true; }
  map<U>(_fn: (v: T) => U): Result<U, E> { return err(this.error); }
  flatMap<U>(_fn: (v: T) => Result<U, E>): Result<U, E> { return err(this.error); }
}

export const ok = <T, E = Error>(value: T): Result<T, E> => new OkResult(value);
export const err = <T, E = Error>(error: E): Result<T, E> => new ErrResult(error);
