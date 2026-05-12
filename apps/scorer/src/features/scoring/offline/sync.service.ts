import { db, type OutboxEntry } from './outbox.db';
import { apiRequest } from '@/shared/lib/api-client';
import { getAccessToken } from '@/shared/lib/supabase';

let isSyncing = false;

export async function drainOutbox(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const pending = await db.outbox
      .where('status').equals('pending')
      .sortBy('createdAt');

    for (const entry of pending) {
      await syncEntry(entry);
    }
  } finally {
    isSyncing = false;
  }
}

async function syncEntry(entry: OutboxEntry): Promise<void> {
  if (entry.id === undefined) return;
  await db.outbox.update(entry.id, { status: 'syncing' });

  try {
    const token = await getAccessToken();
    await apiRequest('/v1/scoring/balls', {
      method: 'POST',
      ...(token ? { token } : {}),
      body: {
        inningsId:    entry.inningsId,
        strikerId:    entry.strikerId,
        nonStrikerId: entry.nonStrikerId,
        bowlerId:     entry.bowlerId,
        runs:         entry.runs,
        extras:       entry.extras,
        wicket:       entry.wicket,
        expectedSeq:  entry.seq,
      },
    });

    await db.outbox.delete(entry.id);
    await db.synced.add({
      inningsId: entry.inningsId,
      seq:       entry.seq,
      serverSeq: entry.seq,
      syncedAt:  Date.now(),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown error';
    await db.outbox.update(entry.id, { status: 'failed', failReason: reason });
    throw err;
  }
}

export async function pendingCount(inningsId: string): Promise<number> {
  return db.outbox.where({ inningsId, status: 'pending' }).count();
}

export async function failedEntries(inningsId: string): Promise<OutboxEntry[]> {
  return db.outbox.where({ inningsId, status: 'failed' }).toArray();
}

export async function retryFailed(inningsId: string): Promise<void> {
  await db.outbox.where({ inningsId, status: 'failed' }).modify({ status: 'pending' });
  await drainOutbox();
}
