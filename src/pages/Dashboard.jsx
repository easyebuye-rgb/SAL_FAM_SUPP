import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Users2, Receipt, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMonthlySummaries, useTotals, useSettings } from '@/hooks/useData';
import { formatCurrency, monthLabel } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/uiStore';

function StatCard({ icon: Icon, label, value, tone }) {
  const toneClasses = {
    brand: 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lift',
    gold: 'bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-lift',
    ink: 'bg-gradient-to-br from-ink-soft to-ink text-white shadow-lift'
  }[tone];
  return (
    <Card className="p-4">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses}`}>
        <Icon size={18} />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft/80">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">{value}</p>
    </Card>
  );
}

export default function Dashboard() {
  const summaries = useMonthlySummaries();
  const totals = useTotals();
  const settings = useSettings();
  const role = useAuthStore((s) => s.role);
  const currency = settings?.currency ?? 'INR';

  const recentMonths = useMemo(() => summaries.slice(-6), [summaries]);
  const chartData = recentMonths.map((m) => ({
    name: monthLabel(m.month, m.year).replace(' ' + m.year, ''),
    Collected: Math.round(m.collected),
    Transferred: Math.round(m.transferred)
  }));

  if (!settings) {
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader eyebrow="Overview" title="Dashboard" />
      <div className="mx-auto max-w-2xl space-y-6 px-5 py-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={TrendingUp} label="Total Collected" value={formatCurrency(totals.totalCollection, currency)} tone="brand" />
          <StatCard icon={TrendingDown} label="Total Transferred" value={formatCurrency(totals.totalTransferred, currency)} tone="gold" />
          <StatCard icon={Wallet} label="Current Balance" value={formatCurrency(totals.balance, currency)} tone="ink" />
          <StatCard icon={Users2} label="Contributors" value={String(totals.contributorCount)} tone="brand" />
        </div>

        {role === 'viewer' && (
          <Link
            to="/contributors-summary"
            className="flex items-center justify-between rounded-xl2 border border-line bg-white p-4 shadow-soft transition-colors hover:border-brand-300 hover:bg-brand-50/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Users2 size={18} />
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-ink">Contributors</p>
                <p className="text-xs text-ink-soft">See who's given and how many months are covered</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-ink-soft/60" />
          </Link>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Collection vs Transfer Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <EmptyChartState />
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="collectedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F6B5C" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0F6B5C" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="transferredFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E3A008" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#E3A008" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4A5751' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#4A5751' }} axisLine={false} tickLine={false} width={0} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #E4E1D6', fontSize: 12 }}
                      formatter={(v) => formatCurrency(v, currency)}
                    />
                    <Area type="monotone" dataKey="Collected" stroke="#0F6B5C" fill="url(#collectedFill)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Transferred" stroke="#E3A008" fill="url(#transferredFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summaries.length === 0 && <EmptyChartState label="No monthly activity recorded yet." />}
            {[...summaries].reverse().slice(0, 8).map((m) => {
              const content = (
                <>
                  <div>
                    <p className="text-sm font-medium text-ink">{monthLabel(m.month, m.year)}</p>
                    <p className="text-xs text-ink-soft">
                      Collected {formatCurrency(m.collected, currency)} · Transferred {formatCurrency(m.transferred, currency)}
                    </p>
                  </div>
                  <span className={`font-display text-sm font-semibold ${m.balance >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
                    {formatCurrency(m.balance, currency)}
                  </span>
                </>
              );
              return role === 'admin' ? (
                <Link
                  key={`${m.year}-${m.month}`}
                  to={`/collections/${m.year}/${m.month}`}
                  className="flex items-center justify-between rounded-xl border border-line px-3.5 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                >
                  {content}
                </Link>
              ) : (
                <div key={`${m.year}-${m.month}`} className="flex items-center justify-between rounded-xl border border-line px-3.5 py-3">
                  {content}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 rounded-xl2 border border-dashed border-line px-4 py-3 text-xs text-ink-soft">
          <Receipt size={16} className="shrink-0" />
          <span>{totals.transactionCount} transactions recorded across collections and transfers.</span>
        </div>
      </div>
    </div>
  );
}

function EmptyChartState({ label = 'Record your first collection to see trends here.' }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center rounded-xl bg-paper-dim/60 text-center">
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}
