import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { useCollections, useCollectionMonths, useSettings } from '@/hooks/useData';
import { formatCurrency, formatDate, monthLabel } from '@/lib/utils';

export default function MonthDetail() {
  const { year, month } = useParams();
  const y = Number(year);
  const m = Number(month);
  const collections = useCollections();
  const collectionMonths = useCollectionMonths();
  const settings = useSettings();
  const currency = settings?.currency ?? 'INR';

  const idsForMonth = new Set((collectionMonths ?? []).filter((cm) => cm.year === y && cm.month === m).map((cm) => cm.collectionId));
  const relevant = (collections ?? []).filter((c) => idsForMonth.has(c.id));
  const total = relevant.reduce((s, c) => {
    const monthsForThisCollection = (collectionMonths ?? []).filter((x) => x.collectionId === c.id).length;
    return s + c.amount / Math.max(1, monthsForThisCollection);
  }, 0);

  return (
    <div className="pb-24">
      <PageHeader eyebrow="Monthly View" title={monthLabel(m, y)} />
      <div className="mx-auto max-w-2xl space-y-4 px-5 py-5">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Total Collected (share for this month)</p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand-600">{formatCurrency(total, currency)}</p>
        </Card>

        {relevant.length === 0 && <Card className="p-8 text-center text-sm text-ink-soft">No collections cover this month.</Card>}

        <div className="space-y-2.5">
          {relevant.map((c) => {
            const monthsForThisCollection = (collectionMonths ?? []).filter((x) => x.collectionId === c.id).map((x) => ({ month: x.month, year: x.year }));
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">{c.contributorName}</p>
                    <p className="text-xs text-ink-soft">
                      Paid {formatDate(c.paymentDate)} · {c.paymentTime} · {c.paymentMethod}
                    </p>
                  </div>
                  <p className="font-display text-base font-semibold text-brand-600">{formatCurrency(c.amount, currency)}</p>
                </div>
                <p className="mt-2 text-xs text-ink-soft">
                  Covers: {monthsForThisCollection.map((mm) => monthLabel(mm.month, mm.year)).join(', ')}
                </p>
                {c.notes && <p className="mt-1 text-xs text-ink-soft/80">{c.notes}</p>}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
