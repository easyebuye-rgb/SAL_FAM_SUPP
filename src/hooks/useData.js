import { useCallback, useEffect, useState } from 'react';
import { supabase, db } from '@/lib/db';

// Must mirror the table names used inside db.js exactly.
const POSTGRES_TABLE_NAMES = {
  contributors: 'contributors',
  collections: 'collections',
  collectionMonths: 'collection_months',
  transfers: 'transfers',
  balanceAdjustments: 'balance_adjustments',
  viewerActivity: 'viewer_activity',
  settings: 'app_settings'
};

// Fetches a table once, then re-fetches automatically whenever any row in
// that table changes (insert/update/delete) — by anyone, on any device —
// via a Supabase Realtime subscription. This replaces Dexie's useLiveQuery.
function useSupabaseTable(tableName, sortFn) {
  const [rows, setRows] = useState([]);

  const fetchRows = useCallback(async () => {
    const data = await db[tableName].toArray();
    setRows(sortFn ? [...data].sort(sortFn) : data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName]);

  useEffect(() => {
    fetchRows();
    const dbTableName = POSTGRES_TABLE_NAMES[tableName];
    const channel = supabase
      .channel(`realtime:${dbTableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: dbTableName }, fetchRows)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRows, tableName]);

  return rows;
}

export function useContributors() {
  return useSupabaseTable('contributors', (a, b) => a.name.localeCompare(b.name));
}

export function useCollections() {
  return useSupabaseTable('collections', (a, b) => (a.paymentDate < b.paymentDate ? 1 : -1));
}

export function useCollectionMonths() {
  return useSupabaseTable('collectionMonths');
}

export function useTransfers() {
  return useSupabaseTable('transfers', (a, b) => (a.transferDate < b.transferDate ? 1 : -1));
}

export function useBalanceAdjustments() {
  return useSupabaseTable('balanceAdjustments', (a, b) => (a.date < b.date ? 1 : -1));
}

export function useViewerActivity() {
  return useSupabaseTable('viewerActivity', (a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

export function useSettings() {
  const rows = useSupabaseTable('settings');
  return rows[0];
}

export function useMonthlySummaries() {
  const collections = useCollections();
  const collectionMonths = useCollectionMonths();
  const transfers = useTransfers();

  const map = new Map();
  const collectionById = new Map((collections ?? []).map((c) => [c.id, c]));

  (collectionMonths ?? []).forEach((cm) => {
    const col = collectionById.get(cm.collectionId);
    if (!col) return;
    const key = `${cm.year}-${cm.month}`;
    const existing = map.get(key) ?? { month: cm.month, year: cm.year, collected: 0, transferred: 0, balance: 0 };
    // Split the collection amount evenly across the months it covers.
    const monthsForThisCollection = (collectionMonths ?? []).filter((x) => x.collectionId === cm.collectionId).length;
    existing.collected += col.amount / Math.max(1, monthsForThisCollection);
    map.set(key, existing);
  });

  (transfers ?? []).forEach((t) => {
    const d = new Date(t.transferDate + 'T00:00:00');
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const key = `${year}-${month}`;
    const existing = map.get(key) ?? { month, year, collected: 0, transferred: 0, balance: 0 };
    existing.transferred += t.amount;
    map.set(key, existing);
  });

  const list = Array.from(map.values()).map((m) => ({ ...m, balance: m.collected - m.transferred }));
  list.sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year));
  return list;
}

export function useTotals() {
  const collections = useCollections();
  const transfers = useTransfers();
  const adjustments = useBalanceAdjustments();
  const totalCollection = (collections ?? []).reduce((s, c) => s + c.amount, 0);
  const totalTransferred = (transfers ?? []).reduce((s, t) => s + t.amount, 0);
  const totalAdjustments = (adjustments ?? []).reduce((s, a) => s + a.amount, 0);
  const balance = totalCollection - totalTransferred + totalAdjustments;
  return {
    totalCollection,
    totalTransferred,
    totalAdjustments,
    balance,
    contributorCount: new Set((collections ?? []).map((c) => c.contributorId)).size,
    transactionCount: (collections ?? []).length + (transfers ?? []).length
  };
}

export function useContributorSummaries() {
  const contributors = useContributors();
  const collections = useCollections();
  const collectionMonths = useCollectionMonths();

  const monthsByCollectionId = new Map();
  (collectionMonths ?? []).forEach((cm) => {
    monthsByCollectionId.set(cm.collectionId, (monthsByCollectionId.get(cm.collectionId) ?? 0) + 1);
  });

  const map = new Map();
  (contributors ?? []).forEach((c) => {
    if (!c.id) return;
    map.set(c.id, { contributorId: c.id, name: c.name, totalAmount: 0, monthsCovered: 0, paymentCount: 0, lastPaymentDate: '' });
  });

  (collections ?? []).forEach((c) => {
    const entry = map.get(c.contributorId);
    if (!entry) return;
    entry.totalAmount += c.amount;
    entry.monthsCovered += monthsByCollectionId.get(c.id) ?? 0;
    entry.paymentCount += 1;
    if (!entry.lastPaymentDate || c.paymentDate > entry.lastPaymentDate) entry.lastPaymentDate = c.paymentDate;
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
