'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import type { WicketDTO } from '@scf/contracts';

const WICKET_KINDS: WicketDTO['kind'][] = [
  'bowled',
  'caught',
  'lbw',
  'run_out',
  'stumped',
  'hit_wicket',
  'obstructing_field',
  'retired_hurt',
];

export function WicketModal({
  open, onClose, onConfirm, strikerId, bowlerId,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (wicket: WicketDTO) => void;
  strikerId: string;
  bowlerId: string;
}) {
  const [kind, setKind] = useState<WicketDTO['kind']>('bowled');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Wicket</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <Select value={kind} onValueChange={v => setKind(v as WicketDTO['kind'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {WICKET_KINDS.map(k => (
                <SelectItem key={k} value={k}>{k.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white"
            onClick={() => onConfirm({ kind, dismissedPlayerId: strikerId, fielderId: null, bowlerId })}>
            Confirm Wicket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
