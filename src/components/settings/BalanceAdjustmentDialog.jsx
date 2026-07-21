import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/overlay';
import { Input, Label, Textarea } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { balanceAdjustmentSchema } from '@/lib/validators';
import { db } from '@/lib/db';
import { toast } from '@/components/ui/toast';
import { todayISODate } from '@/lib/utils';

export function BalanceAdjustmentDialog({ open, onClose, editing }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(balanceAdjustmentSchema),
    values: editing
      ? { label: editing.label, amount: editing.amount, date: editing.date, notes: editing.notes ?? '' }
      : { label: 'Cash in hand', amount: undefined, date: todayISODate(), notes: '' }
  });

  async function onSubmit(values) {
    if (editing?.id) {
      await db.balanceAdjustments.update(editing.id, values);
      toast('Balance entry updated');
    } else {
      await db.balanceAdjustments.add({ ...values, createdAt: new Date().toISOString() });
      toast('Balance entry added');
    }
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={editing ? 'Edit Balance Entry' : 'Add Existing Balance'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="b-label">Label</Label>
          <Input id="b-label" {...register('label')} placeholder="Cash in hand" />
          {errors.label && <p className="mt-1 text-xs text-red-600">{errors.label.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="b-amount">Amount</Label>
            <Input id="b-amount" type="number" step="0.01" {...register('amount')} placeholder="2000" />
            {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
          </div>
          <div>
            <Label htmlFor="b-date">As of Date</Label>
            <Input id="b-date" type="date" {...register('date')} />
          </div>
        </div>
        <p className="text-xs text-ink-soft">
          Use a positive amount for balance you already hold (adds to your running balance). Use a negative amount to correct the balance downward.
        </p>
        <div>
          <Label htmlFor="b-notes">Notes (optional)</Label>
          <Textarea id="b-notes" rows={2} {...register('notes')} />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {editing ? 'Save Changes' : 'Add Balance'}
        </Button>
      </form>
    </Dialog>
  );
}
