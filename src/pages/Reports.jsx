import { useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet, Printer, FileText, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Label } from '@/components/ui/form';
import { useCollections, useTransfers, useSettings, useMonthlySummaries, useBalanceAdjustments } from '@/hooks/useData';
import { formatCurrency, formatDate, currentYear, monthLabel } from '@/lib/utils';
import { exportLedgerCSV, exportLedgerExcel, exportLedgerPDF } from '@/lib/exports';

const PIE_COLORS = ['#0F6B5C', '#3D9382', '#E3A008', '#EBC24A', '#4A5751', '#9ECEC0'];

export default function Reports() {
  const collections = useCollections();
  const transfers = useTransfers();
  const adjustments = useBalanceAdjustments();
  const settings = useSettings();
  const summaries = useMonthlySummaries();
  const currency = settings?.currency ?? 'INR';

  const [mode, setMode] = useState('yearly');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    const colEntries = (collections ?? []).map((c) => ({
      id: `col-${c.id}`,
      type: 'Collection',
      date: c.paymentDate,
      time: c.paymentTime,
      amount: c.amount,
      notes: c.notes,
      meta: `${c.contributorName} · ${c.paymentMethod}`
    }));
    const trEntries = (transfers ?? []).map((t) => ({
      id: `tr-${t.id}`,
      type: 'Transfer',
      date: t.transferDate,
      time: t.transferTime,
      amount: t.amount,
      notes: t.notes,
      meta: t.method
    }));
    const adjEntries = (adjustments ?? []).map((a) => ({
      id: `adj-${a.id}`,
      type: 'Adjustment',
      date: a.date,
      time: '00:00',
      amount: a.amount,
      notes: a.notes,
      meta: a.label
    }));
    return [...colEntries, ...trEntries, ...adjEntries].sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));
  }, [collections, transfers, adjustments]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      let inRange = true;
      if (mode === 'monthly') inRange = d.getMonth() + 1 === month && d.getFullYear() === year;
      if (mode === 'yearly') inRange = d.getFullYear() === year;
      if (mode === 'custom' && from && to) inRange = e.date >= from && e.date <= to;
      const matchesSearch = !search || e.meta.toLowerCase().includes(search.toLowerCase()) || (e.notes ?? '').toLowerCase().includes(search.toLowerCase());
      return inRange && matchesSearch;
    });
  }, [entries, mode, month, year, from, to, search]);

  const totals = useMemo(() => {
    const collected = filtered.filter((e) => e.type === 'Collection').reduce((s, e) => s + e.amount, 0);
    const transferred = filtered.filter((e) => e.type === 'Transfer').reduce((s, e) => s + e.amount, 0);
    return { collected, transferred, balance: collected - transferred };
  }, [filtered]);

  const reportTitle =
    mode === 'yearly' ? `Yearly Report — ${year}` : mode === 'monthly' ? `Monthly Report — ${monthLabel(month, year)}` : `Custom Report — ${from || '…'} to ${to || '…'}`;

  const contributorStats = useMemo(() => {
    const map = new Map();
    (collections ?? []).forEach((c) => map.set(c.contributorName, (map.get(c.contributorName) ?? 0) + c.amount));
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [collections]);

  const yearlyComparison = useMemo(() => {
    const map = new Map();
    summaries.forEach((s) => {
      const e = map.get(s.year) ?? { year: s.year, collected: 0, transferred: 0 };
      e.collected += s.collected;
      e.transferred += s.transferred;
      map.set(s.year, e);
    });
    return Array.from(map.values()).sort((a, b) => a.year - b.year);
  }, [summaries]);

  return (
    <div className="pb-24">
      <PageHeader eyebrow="Analysis" title="Reports" />
      <div className="mx-auto max-w-2xl space-y-5 px-5 py-5 print:px-0">
        <Card className="p-4 print:hidden">
          <div className="mb-3 flex gap-1 rounded-xl bg-paper-dim p-1">
            {['yearly', 'monthly', 'custom'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize ${mode === m ? 'bg-white text-brand-700 shadow-soft' : 'text-ink-soft'}`}
              >
                {m}
              </button>
            ))}
          </div>

          {mode === 'yearly' && (
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 7 }, (_, i) => currentYear() - 2 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          )}
          {mode === 'monthly' && (
            <div className="grid grid-cols-2 gap-2">
              <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m, 2000).split(' ')[0]}
                  </option>
                ))}
              </Select>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {Array.from({ length: 7 }, (_, i) => currentYear() - 2 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {mode === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="from">From</Label>
                <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-3 gap-2.5">
          <Card className="p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-ink-soft">Collected</p>
            <p className="mt-1 font-display text-sm font-semibold text-brand-600">{formatCurrency(totals.collected, currency)}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-ink-soft">Transferred</p>
            <p className="mt-1 font-display text-sm font-semibold text-gold-600">{formatCurrency(totals.transferred, currency)}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] font-semibold uppercase text-ink-soft">Balance</p>
            <p className="mt-1 font-display text-sm font-semibold text-ink">{formatCurrency(totals.balance, currency)}</p>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" size="sm" onClick={() => exportLedgerCSV(filtered, `${reportTitle}.csv`)}>
            <FileDown size={14} /> CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportLedgerExcel(filtered, `${reportTitle}.xlsx`)}>
            <FileSpreadsheet size={14} /> Excel
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportLedgerPDF(filtered, reportTitle, currency, `${reportTitle}.pdf`)}>
            <FileText size={14} /> PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer size={14} /> Print
          </Button>
        </div>

        <Card className="p-4 print:hidden">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search this report…" className="pl-9" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Ledger — {reportTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.length === 0 && <p className="py-6 text-center text-sm text-ink-soft">No transactions in this range.</p>}
            {filtered.map((e) => (
              <div key={e.id} className="flex items-center justify-between border-b border-line/70 py-2.5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {e.type} <span className="text-ink-soft">· {e.meta}</span>
                  </p>
                  <p className="text-xs text-ink-soft">
                    {formatDate(e.date)} · {e.time}
                  </p>
                </div>
                <p className={`font-display text-sm font-semibold ${e.type === 'Collection' ? 'text-brand-600' : e.type === 'Transfer' ? 'text-gold-600' : e.amount >= 0 ? 'text-ink' : 'text-red-600'}`}>
                  {e.type === 'Collection' ? '+' : e.type === 'Transfer' ? '−' : e.amount >= 0 ? '+' : '−'}
                  {formatCurrency(Math.abs(e.amount), currency)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {contributorStats.length > 0 && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Contributor Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={contributorStats} dataKey="amount" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {contributorStats.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {contributorStats.map((c, i) => (
                  <span key={c.name} className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {c.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {yearlyComparison.length > 1 && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Yearly Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer>
                  <BarChart data={yearlyComparison} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D6" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#4A5751' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#4A5751' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                    <Bar dataKey="collected" name="Collected" fill="#0F6B5C" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="transferred" name="Transferred" fill="#E3A008" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
