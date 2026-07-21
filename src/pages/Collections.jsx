import { useMemo, useState } from 'react';
import { Plus, Search, UserPlus, Trash2, Pencil, Phone } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/overlay';
import { ConfirmDialog } from '@/components/ui/overlay';
import { useCollections, useCollectionMonths, useContributors, useSettings, useContributorSummaries } from '@/hooks/useData';
import { CollectionDialog } from '@/components/collections/CollectionDialog';
import { ContributorDialog } from '@/components/collections/ContributorDialog';
import { ContributorSummaryList } from '@/components/collections/ContributorSummaryList';
import { db } from '@/lib/db';
import { formatCurrency, formatDate, monthLabel } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

export default function Collections() {
  const [tab, setTab] = useState('collections');
  const contributors = useContributors();
  const collections = useCollections();
  const collectionMonths = useCollectionMonths();
  const contributorSummaries = useContributorSummaries();
  const settings = useSettings();
  const currency = settings?.currency ?? 'INR';

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [contributorFilter, setContributorFilter] = useState('all');

  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [showContributorDialog, setShowContributorDialog] = useState(false);
  const [editingContributor, setEditingContributor] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const monthsByCollection = useMemo(() => {
    const map = new Map();
    (collectionMonths ?? []).forEach((cm) => {
      const list = map.get(cm.collectionId) ?? [];
      list.push({ month: cm.month, year: cm.year });
      map.set(cm.collectionId, list);
    });
    return map;
  }, [collectionMonths]);

  const filteredCollections = useMemo(() => {
    return (collections ?? []).filter((c) => {
      const matchesSearch =
        !search ||
        c.contributorName.toLowerCase().includes(search.toLowerCase()) ||
        (c.notes ?? '').toLowerCase().includes(search.toLowerCase()) ||
        String(c.amount).includes(search);
      const matchesMethod = methodFilter === 'all' || c.paymentMethod === methodFilter;
      const matchesContributor = contributorFilter === 'all' || String(c.contributorId) === contributorFilter;
      return matchesSearch && matchesMethod && matchesContributor;
    });
  }, [collections, search, methodFilter, contributorFilter]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'collection') {
      await db.collectionMonths.where('collectionId').equals(deleteTarget.id).delete();
      await db.collections.delete(deleteTarget.id);
      toast('Collection deleted', 'info');
    } else {
      await db.contributors.delete(deleteTarget.id);
      toast('Contributor deleted', 'info');
    }
    setDeleteTarget(null);
  }

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Money In"
        title="Collections"
        action={
          tab !== 'summary' && (
            <Button
              size="sm"
              onClick={() =>
                tab === 'collections'
                  ? (setEditingCollection(null), setShowCollectionDialog(true))
                  : (setEditingContributor(null), setShowContributorDialog(true))
              }
            >
              <Plus size={16} />
              {tab === 'collections' ? 'Record' : 'Add'}
            </Button>
          )
        }
      />

      <div className="mx-auto max-w-2xl px-5 pt-4">
        <div className="flex gap-1 rounded-xl bg-paper-dim p-1">
          {['collections', 'contributors', 'summary'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-white text-brand-700 shadow-soft' : 'text-ink-soft'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'collections' && (
        <div className="mx-auto max-w-2xl space-y-4 px-5 py-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contributor, notes, amount…" className="pl-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={contributorFilter} onChange={(e) => setContributorFilter(e.target.value)}>
              <option value="all">All Contributors</option>
              {(contributors ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
              <option value="all">All Methods</option>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Other</option>
            </Select>
          </div>

          {filteredCollections.length === 0 && (
            <Card className="p-8 text-center text-sm text-ink-soft">No collections match your filters yet.</Card>
          )}

          <div className="space-y-2.5">
            {filteredCollections.map((c) => {
              const months = (monthsByCollection.get(c.id) ?? []).sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
              return (
                <Card key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-sm font-semibold text-ink">{c.contributorName}</p>
                      <p className="text-xs text-ink-soft">
                        {formatDate(c.paymentDate)} · {c.paymentTime} · {c.paymentMethod}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-base font-semibold text-brand-600">{formatCurrency(c.amount, currency)}</p>
                      <button
                        onClick={() => {
                          setEditingCollection(c);
                          setShowCollectionDialog(true);
                        }}
                        className="rounded-lg p-1.5 text-ink-soft/60 hover:bg-brand-50 hover:text-brand-600"
                        aria-label="Edit collection"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'collection', id: c.id })}
                        className="rounded-lg p-1.5 text-ink-soft/60 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete collection"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  {months.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {months.map((m) => (
                        <Badge key={`${m.year}-${m.month}`}>{monthLabel(m.month, m.year)}</Badge>
                      ))}
                    </div>
                  )}
                  {c.notes && <p className="mt-2 text-xs text-ink-soft">{c.notes}</p>}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'contributors' && (
        <div className="mx-auto max-w-2xl space-y-2.5 px-5 py-5">
          {(contributors ?? []).length === 0 && (
            <Card className="flex flex-col items-center gap-2 p-8 text-center">
              <UserPlus size={22} className="text-ink-soft/50" />
              <p className="text-sm text-ink-soft">No contributors yet. Add the first one to get started.</p>
            </Card>
          )}
          {(contributors ?? []).map((c) => (
            <Card key={c.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-display text-sm font-semibold text-ink">{c.name}</p>
                {c.phone && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                    <Phone size={11} /> {c.phone}
                  </p>
                )}
                {c.notes && <p className="mt-0.5 text-xs text-ink-soft/80">{c.notes}</p>}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingContributor(c);
                    setShowContributorDialog(true);
                  }}
                  className="rounded-lg p-2 text-ink-soft/60 hover:bg-brand-50 hover:text-brand-600"
                  aria-label="Edit contributor"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeleteTarget({ type: 'contributor', id: c.id })}
                  className="rounded-lg p-2 text-ink-soft/60 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete contributor"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'summary' && (
        <div className="mx-auto max-w-2xl px-5 py-5">
          <ContributorSummaryList summaries={contributorSummaries} currency={currency} />
        </div>
      )}

      <CollectionDialog
        open={showCollectionDialog}
        onClose={() => {
          setShowCollectionDialog(false);
          setEditingCollection(null);
        }}
        contributors={contributors ?? []}
        editing={editingCollection}
      />
      <ContributorDialog
        open={showContributorDialog}
        onClose={() => {
          setShowContributorDialog(false);
          setEditingContributor(null);
        }}
        editing={editingContributor}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'collection' ? 'Delete Collection' : 'Delete Contributor'}
        description="This action cannot be undone. Related records will be permanently removed."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
