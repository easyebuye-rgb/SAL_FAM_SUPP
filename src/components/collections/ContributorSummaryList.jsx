import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency, monthLabel, cn } from '@/lib/utils';

export function ContributorSummaryList({ summaries, currency }) {
  return (
    <div className="space-y-2.5">
      <Card className="flex items-start gap-2 p-3.5 text-xs text-ink-soft">
        <Users size={15} className="mt-0.5 shrink-0 text-brand-500" />
        <span>
          Sorted A–Z, with (OTS) and (Stopped) contributors grouped at the bottom. "Due" and the payment line turn red
          when someone hasn't paid through the current month — (OTS) and (Stopped) names are never counted as due.
        </span>
      </Card>
      {summaries.length === 0 && <Card className="p-8 text-center text-sm text-ink-soft">No contributions recorded yet.</Card>}
      {summaries.map((s) => (
        <Card key={s.contributorId} className={cn('flex items-center justify-between p-4', s.isExempt && 'opacity-55')}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
              {s.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-display text-sm font-semibold text-ink">{s.name}</p>
                {s.isDue && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">Due</span>
                )}
              </div>
              <p className={cn('text-xs', s.isDue ? 'text-red-600' : 'text-ink-soft')}>
                {s.paymentCount} payment{s.paymentCount === 1 ? '' : 's'}
                {s.lastCoveredMonth != null ? ` · paid until ${monthLabel(s.lastCoveredMonth, s.lastCoveredYear)}` : ' · no payments yet'}
              </p>
            </div>
          </div>
          <p className="font-display text-base font-semibold text-brand-600">{formatCurrency(s.totalAmount, currency)}</p>
        </Card>
      ))}
    </div>
  );
}
