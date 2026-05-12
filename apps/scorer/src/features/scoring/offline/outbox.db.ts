import Dexie, { type Table } from 'dexie';

export interface OutboxEntry {
  id?: number;
  inningsId: string;
  seq: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  extras: { wide: number; noBall: number; bye: number; legBye: number };
  wicket: { kind: string; dismissedPlayerId: string; fielderId: string | null; bowlerId: string | null } | null;
  status: 'pending' | 'syncing' | 'failed';
  createdAt: number;
  failReason?: string;
}

export interface SyncedBall {
  id?: number;
  inningsId: string;
  seq: number;
  serverSeq: number;
  syncedAt: number;
}

class OutboxDatabase extends Dexie {
  outbox!: Table<OutboxEntry, number>;
  synced!: Table<SyncedBall, number>;

  constructor() {
    super('scf-scorer-outbox');
    this.version(1).stores({
      outbox: '++id, inningsId, seq, status, createdAt',
      synced: '++id, inningsId, seq',
    });
  }
}

export const db = new OutboxDatabase();
