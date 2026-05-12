'use client';
import { useCallback } from 'react';
import { useInningsStore } from '../stores/innings.store';
import { db } from '../offline/outbox.db';
import { drainOutbox } from '../offline/sync.service';
import { useOnlineStatus } from './useOnlineStatus';
import type { RecordBallDTO } from '@scf/contracts';

export function useBallSubmit() {
  const store = useInningsStore();
  const online = useOnlineStatus();

  const submitBall = useCallback(async (dto: Omit<RecordBallDTO, 'inningsId' | 'expectedSeq'>) => {
    if (!store.inningsId) throw new Error('No active innings');

    const extras = {
      wide:   dto.extras?.wide   ?? 0,
      noBall: dto.extras?.noBall ?? 0,
      bye:    dto.extras?.bye    ?? 0,
      legBye: dto.extras?.legBye ?? 0,
    };

    // 1. Apply optimistically to local state immediately
    store.applyBall({
      runs:     dto.runs,
      extras,
      isWicket: dto.wicket !== null,
    });

    // 2. Queue in IndexedDB outbox
    await db.outbox.add({
      inningsId:    store.inningsId,
      seq:          store.seq - 1, // seq was incremented by applyBall
      strikerId:    dto.strikerId,
      nonStrikerId: dto.nonStrikerId,
      bowlerId:     dto.bowlerId,
      runs:         dto.runs,
      extras,
      wicket:       dto.wicket ?? null,
      status:       'pending',
      createdAt:    Date.now(),
    });

    // 3. Drain immediately if online
    if (online) {
      await drainOutbox().catch(console.error);
    }
  }, [store, online]);

  const undoBall = useCallback(async () => {
    if (!store.inningsId) return;
    store.undoLastBall();
    // Remove last pending entry from outbox
    const lastPending = await db.outbox
      .where({ inningsId: store.inningsId, status: 'pending' })
      .last();
    if (lastPending?.id !== undefined) await db.outbox.delete(lastPending.id);
    // If online, send undo to API
    if (online) {
      const { getAccessToken } = await import('@/shared/lib/supabase');
      const { apiRequest } = await import('@/shared/lib/api-client');
      const token = await getAccessToken();
      await apiRequest(`/v1/scoring/innings/${store.inningsId}/balls/last`, {
        method: 'DELETE',
        ...(token ? { token } : {}),
      }).catch(console.error);
    }
  }, [store, online]);

  return { submitBall, undoBall };
}
