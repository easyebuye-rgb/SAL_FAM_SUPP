import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/overlay';
import { Input, Label, Select, Textarea } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { collectionSchema } from '@/lib/validators';
import { db } from '@/lib/db';
import { toast } from '@/components/ui/toast';
import { currentMonth, currentYear, monthLabel, monthsBetween, todayISODate, nowTime } from '@/lib/utils';
import { useSettings } from '@/hooks/useData';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear() - 2 + i);

export function CollectionDialog({ open, onClose, contributors, editing }) {
  const settings = useSettings();
  const currency = settings?.currency ?? 'INR';

  const [existingMonths, setExistingMonths] = useState([]);
  useEffect(() => {
    let alive = true;
    if (editing?.id) {
      db.collectionMonths
        .where('collectionId')
        .equals(editing.id)
        .toArray()
        .then((rows) => {
          if (alive) setExistingMonths(rows);
        });
    } else {
      setExistingMonths([]);
    }
    return () => {
      alive = false;
    };
  }, [editing?.id]);

  const range = useMemo(() => {
    if (!editing || !existingMonths || existingMonths.length === 0) {
      return { startMonth: currentMonth(), startYear: currentYear(), endMonth: currentMonth(), endYear: currentYear() };
    }
    const sorted = [...existingMonths].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return { startMonth: first.month, startYear: first.year, endMonth: last.month, endYear: last.year };
  }, [editing, existingMonths]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(collectionSchema),
    values: editing
      ? {
          contributorId: editing.contributorId,
          amount: editing.amount,
          paymentDate: editing.paymentDate,
          paymentTime: editing.paymentTime,
          paymentMethod: editing.paymentMethod,
          notes: editing.notes ?? '',
          ...range
        }
      : {
          contributorId: undefined,
          amount: undefined,
          paymentDate: todayISODate(),
          paymentTime: nowTime(),
          paymentMethod: 'Cash',
          notes: '',
          startMonth: currentMonth(),
          startYear: currentYear(),
          endMonth: currentMonth(),
          endYear: currentYear()
        }
  });

  const [startMonth, startYear, endMonth, endYear] = watch(['startMonth', 'startYear', 'endMonth', 'endYear']);
  const coveredMonths = useMemo(
    () => monthsBetween(Number(startMonth), Number(startYear), Number(endMonth), Number(endYear)),
    [startMonth, startYear, endMonth, endYear]
  );

  async function onSubmit(values) {
    const contributor = contributors.find((c) => c.id === Number(values.contributorId));
    if (!contributor) return;
    const months = monthsBetween(values.startMonth, values.startYear, values.endMonth, values.endYear);

    if (editing?.id) {
      await db.collections.update(editing.id, {
        contributorId: Number(values.contributorId),
        contributorName: contributor.name,
        amount: values.amount,
        paymentDate: values.paymentDate,
        paymentTime: values.paymentTime,
        paymentMethod: values.paymentMethod,
        notes: values.notes
      });
      await db.collectionMonths.where('collectionId').equals(editing.id).delete();
      await db.collectionMonths.bulkAdd(months.map((m) => ({ collectionId: editing.id, month: m.month, year: m.year })));
      toast('Collection updated');
    } else {
      const collectionId = await db.collections.add({
        contributorId: Number(values.contributorId),
        contributorName: contributor.name,
        amount: values.amount,
        paymentDate: values.paymentDate,
        paymentTime: values.paymentTime,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
        createdAt: new Date().toISOString()
      });
      await db.collectionMonths.bulkAdd(months.map((m) => ({ collectionId, month: m.month, year: m.year })));
      toast(`Collection recorded for ${months.length} month${months.length > 1 ? 's' : ''}`);
    }
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={editing ? 'Edit Collection' : 'Record Collection'}>
      {contributors.length === 0 ? (
        <p className="text-sm text-ink-soft">Add a contributor first from the Contributors tab before recording a collection.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="col-contributor">Contributor</Label>
            <Select id="col-contributor" {...register('contributorId')} defaultValue="">
              <option value="" disabled>
                Select contributor
              </option>
              {contributors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {errors.contributorId && <p className="mt-1 text-xs text-red-600">{errors.contributorId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="col-amount">Amount ({currency})</Label>
              <Input id="col-amount" type="number" step="0.01" {...register('amount')} placeholder="500" />
              {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
            </div>
            <div>
              <Label htmlFor="col-method">Payment Method</Label>
              <Select id="col-method" {...register('paymentMethod')}>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Other</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="col-date">Payment Date</Label>
              <Input id="col-date" type="date" {...register('paymentDate')} />
            </div>
            <div>
              <Label htmlFor="col-time">Payment Time</Label>
              <Input id="col-time" type="time" {...register('paymentTime')} />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-paper-dim/50 p-3.5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Covers Months</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="col-start-month">Start Month</Label>
                <div className="flex gap-2">
                  <Select {...register('startMonth')}>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {monthLabel(m, 2000).split(' ')[0]}
                      </option>
                    ))}
                  </Select>
                  <Select {...register('startYear')}>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="col-end-month">End Month</Label>
                <div className="flex gap-2">
                  <Select {...register('endMonth')}>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {monthLabel(m, 2000).split(' ')[0]}
                      </option>
                    ))}
                  </Select>
                  <Select {...register('endYear')}>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            {errors.endMonth && <p className="mt-2 text-xs text-red-600">{errors.endMonth.message}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {coveredMonths.map((m) => (
                <span key={`${m.year}-${m.month}`} className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                  ✓ {monthLabel(m.month, m.year)}
                </span>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="col-notes">Notes (optional)</Label>
            <Textarea id="col-notes" rows={2} {...register('notes')} />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {editing ? 'Save Changes' : 'Save Collection'}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
