import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export function ContributorSummaryList({ summaries, currency }) {
  return (
    <div className="space-y-2.5">
      <Card className="flex items-start gap-2 p-3.5 text-xs text-ink-soft">
        <Users size={15} className="mt-0.5 shrink-0 text-brand-500" />
        <span>Sorted A–Z. Months covered counts every month a contributor's payments apply to, including overlaps.</span>
      </Card>
      {summaries.length === 0 && <Card className="p-8 text-center text-sm text-ink-soft">No contributions recorded yet.</Card>}
      {summaries.map((s) => (
        <Card key={s.contributorId} className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
              {s.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-ink">{s.name}</p>
              <p className="text-xs text-ink-soft">
                {s.paymentCount} payment{s.paymentCount === 1 ? '' : 's'} · {s.monthsCovered} month{s.monthsCovered === 1 ? '' : 's'} covered
              </p>
            </div>
          </div>
          <p className="font-display text-base font-semibold text-brand-600">{formatCurrency(s.totalAmount, currency)}</p>
        </Card>
      ))}
    </div>
  );
}
