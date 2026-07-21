import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/overlay';
import { useTransfers, useTotals, useSettings } from '@/hooks/useData';
import { TransferDialog } from '@/components/transfers/TransferDialog';
import { db } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

export default function Transfers() {
  const transfers = useTransfers();
  const totals = useTotals();
  const settings = useSettings();
  const currency = settings?.currency ?? 'INR';
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  async function confirmDelete() {
    if (deleteId == null) return;
    await db.transfers.delete(deleteId);
    toast('Transfer deleted', 'info');
    setDeleteId(null);
  }

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Money Out"
        title="Transfers"
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setShowDialog(true);
            }}
          >
            <Plus size={16} /> Record
          </Button>
        }
      />
      <div className="mx-auto max-w-2xl space-y-4 px-5 py-5">
        <Card className="grid grid-cols-2 divide-x divide-line p-0">
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Total Transferred</p>
            <p className="mt-1 font-display text-lg font-semibold text-gold-600">{formatCurrency(totals.totalTransferred, currency)}</p>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Running Balance</p>
            <p className="mt-1 font-display text-lg font-semibold text-brand-600">{formatCurrency(totals.balance, currency)}</p>
          </div>
        </Card>
        {totals.totalAdjustments !== 0 && (
          <p className="px-1 text-xs text-ink-soft">
            Includes {formatCurrency(totals.totalAdjustments, currency)} of existing balance you added in Settings.
          </p>
        )}

        {(transfers ?? []).length === 0 && <Card className="p-8 text-center text-sm text-ink-soft">No transfers recorded yet.</Card>}

        <div className="space-y-2.5">
          {(transfers ?? []).map((t) => (
            <Card key={t.id} className="flex items-start justify-between p-4">
              <div>
                <p className="font-display text-sm font-semibold text-ink">{t.method}</p>
                <p className="text-xs text-ink-soft">
                  {formatDate(t.transferDate)} · {t.transferTime}
                </p>
                {t.notes && <p className="mt-1 text-xs text-ink-soft/80">{t.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <p className="font-display text-base font-semibold text-gold-600">{formatCurrency(t.amount, currency)}</p>
                <button
                  onClick={() => {
                    setEditing(t);
                    setShowDialog(true);
                  }}
                  className="rounded-lg p-1.5 text-ink-soft/60 hover:bg-brand-50 hover:text-brand-600"
                  aria-label="Edit transfer"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteId(t.id)}
                  className="rounded-lg p-1.5 text-ink-soft/60 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete transfer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <TransferDialog
        open={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditing(null);
        }}
        editing={editing}
      />
      <ConfirmDialog
        open={deleteId != null}
        title="Delete Transfer"
        description="This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
