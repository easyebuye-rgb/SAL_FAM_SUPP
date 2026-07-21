import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/overlay';
import { Input, Label, Select, Textarea } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { transferSchema } from '@/lib/validators';
import { db } from '@/lib/db';
import { toast } from '@/components/ui/toast';
import { todayISODate, nowTime } from '@/lib/utils';
import { useSettings } from '@/hooks/useData';

export function TransferDialog({ open, onClose, editing }) {
  const settings = useSettings();
  const currency = settings?.currency ?? 'INR';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(transferSchema),
    values: editing
      ? { amount: editing.amount, transferDate: editing.transferDate, transferTime: editing.transferTime, method: editing.method, notes: editing.notes ?? '' }
      : {
          amount: undefined,
          transferDate: todayISODate(),
          transferTime: nowTime(),
          method: 'Bank Transfer',
          notes: ''
        }
  });

  async function onSubmit(values) {
    if (editing?.id) {
      await db.transfers.update(editing.id, values);
      toast('Transfer updated');
    } else {
      await db.transfers.add({ ...values, createdAt: new Date().toISOString() });
      toast('Transfer recorded');
    }
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={editing ? 'Edit Transfer' : 'Record Transfer to Family'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="t-amount">Amount ({currency})</Label>
            <Input id="t-amount" type="number" step="0.01" {...register('amount')} placeholder="1000" />
            {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
          </div>
          <div>
            <Label htmlFor="t-method">Transfer Method</Label>
            <Select id="t-method" {...register('method')}>
              <option>Bank Transfer</option>
              <option>Cash</option>
              <option>UPI</option>
              <option>Other</option>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="t-date">Transfer Date</Label>
            <Input id="t-date" type="date" {...register('transferDate')} />
          </div>
          <div>
            <Label htmlFor="t-time">Transfer Time</Label>
            <Input id="t-time" type="time" {...register('transferTime')} />
          </div>
        </div>
        <div>
          <Label htmlFor="t-notes">Notes (optional)</Label>
          <Textarea id="t-notes" rows={2} {...register('notes')} />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {editing ? 'Save Changes' : 'Save Transfer'}
        </Button>
      </form>
    </Dialog>
  );
}
