import type { IUnitOfWork } from '@scf/application';

export class SupabaseUnitOfWork implements IUnitOfWork {
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}
