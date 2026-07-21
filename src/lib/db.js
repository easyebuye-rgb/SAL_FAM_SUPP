import { supabase } from '@/lib/supabaseClient';

// --- camelCase <-> snake_case helpers -------------------------------------
// The app's components use camelCase (e.g. c.paymentDate). Postgres/Supabase
// columns are snake_case (payment_date). These convert both ways so every
// existing component keeps working unchanged.
function toCamelKey(key) {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
function toSnakeKey(key) {
  return key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
}
function toCamel(row) {
  if (!row) return row;
  const out = {};
  for (const k in row) out[toCamelKey(k)] = row[k];
  return out;
}
function toSnake(obj) {
  const out = {};
  for (const k in obj) out[toSnakeKey(k)] = obj[k];
  return out;
}

// --- Dexie-like table wrapper over a Supabase table -----------------------
// Mirrors just enough of Dexie's table API (add/update/delete/toArray/count/
// bulkAdd/clear/where().equals()) that the rest of the app didn't need to be
// rewritten call-site by call-site.
function makeTable(tableName) {
  return {
    async add(obj) {
      const { data, error } = await supabase.from(tableName).insert(toSnake(obj)).select().single();
      if (error) throw error;
      return data.id;
    },
    async bulkAdd(items) {
      if (!items || items.length === 0) return;
      const { error } = await supabase.from(tableName).insert(items.map(toSnake));
      if (error) throw error;
    },
    async update(id, patch) {
      const { error } = await supabase.from(tableName).update(toSnake(patch)).eq('id', id);
      if (error) throw error;
    },
    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
    async clear() {
      const { error } = await supabase.from(tableName).delete().gt('id', 0);
      if (error) throw error;
    },
    async toArray() {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      return (data ?? []).map(toCamel);
    },
    async count() {
      const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    toCollection() {
      return {
        async first() {
          const { data, error } = await supabase.from(tableName).select('*').limit(1).maybeSingle();
          if (error) throw error;
          return toCamel(data);
        }
      };
    },
    where(column) {
      const snakeCol = toSnakeKey(column);
      return {
        equals(value) {
          return {
            async toArray() {
              const { data, error } = await supabase.from(tableName).select('*').eq(snakeCol, value);
              if (error) throw error;
              return (data ?? []).map(toCamel);
            },
            async delete() {
              const { error } = await supabase.from(tableName).delete().eq(snakeCol, value);
              if (error) throw error;
            }
          };
        }
      };
    }
  };
}

export const db = {
  contributors: makeTable('contributors'),
  collections: makeTable('collections'),
  collectionMonths: makeTable('collection_months'),
  transfers: makeTable('transfers'),
  balanceAdjustments: makeTable('balance_adjustments'),
  viewerActivity: makeTable('viewer_activity'),
  settings: makeTable('app_settings')
};

export { supabase };

// Simple, dependency-free hash for the local-only admin password.
// This is NOT for high-security use — it only gates casual access,
// consistent with a single shared household ledger app.
export async function hashPassword(plain) {
  const enc = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function ensureDefaultSettings() {
  const existing = await db.settings.toCollection().first();
  if (!existing) {
    const passwordHash = await hashPassword('2526');
    await db.settings.add({
      appName: 'Salahudeen Family Support',
      passwordHash,
      theme: 'light',
      sessionTimeoutMinutes: 30,
      currency: 'INR'
    });
  }
}

export async function logViewerActivity(name) {
  await db.viewerActivity.add({ name, timestamp: new Date().toISOString() });
}
