import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Upload, LogOut, Moon, Sun, Info, KeyRound, Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/form';
import { ConfirmDialog } from '@/components/ui/overlay';
import { db, hashPassword, supabase } from '@/lib/db';
import { seedSampleData } from '@/lib/seed';
import { useSettings, useBalanceAdjustments } from '@/hooks/useData';
import { useAuthStore, useUIStore } from '@/store/uiStore';
import { settingsSchema, passwordChangeSchema } from '@/lib/validators';
import { toast } from '@/components/ui/toast';
import { BalanceAdjustmentDialog } from '@/components/settings/BalanceAdjustmentDialog';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function Settings() {
  const settings = useSettings();
  const adjustments = useBalanceAdjustments();
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useUIStore();
  const fileInputRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [editingBalance, setEditingBalance] = useState(null);
  const [deleteBalanceId, setDeleteBalanceId] = useState(null);
  const currency = settings?.currency ?? 'INR';

  const {
    register: registerSettings,
    handleSubmit: handleSettingsSubmit
  } = useForm({
    resolver: zodResolver(settingsSchema),
    values: settings ? { appName: settings.appName, currency: settings.currency, sessionTimeoutMinutes: settings.sessionTimeoutMinutes } : undefined
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors }
  } = useForm({ resolver: zodResolver(passwordChangeSchema) });

  async function onSaveSettings(values) {
    if (!settings?.id) return;
    await db.settings.update(settings.id, values);
    toast('Settings saved');
  }

  async function onChangePassword(values) {
    if (!settings?.id) return;
    const currentHash = await hashPassword(values.currentPassword);
    if (currentHash !== settings.passwordHash) {
      toast('Current password is incorrect', 'error');
      return;
    }
    const newHash = await hashPassword(values.newPassword);
    await db.settings.update(settings.id, { passwordHash: newHash });
    toast('Password updated');
    resetPassword();
  }

  async function exportBackup() {
    const data = {
      contributors: await db.contributors.toArray(),
      collections: await db.collections.toArray(),
      collectionMonths: await db.collectionMonths.toArray(),
      transfers: await db.transfers.toArray(),
      balanceAdjustments: await db.balanceAdjustments.toArray(),
      exportedAt: new Date().toISOString(),
      version: 2
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sfs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Backup exported');
  }

  async function importBackup(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.contributors || !data.collections) throw new Error('This file is missing contributors/collections — it may not be a Salahudeen Family Support backup.');
      await db.contributors.clear();
      await db.collections.clear();
      await db.collectionMonths.clear();
      await db.transfers.clear();
      await db.balanceAdjustments.clear();
      await db.contributors.bulkAdd(data.contributors);
      await db.collections.bulkAdd(data.collections);
      await db.collectionMonths.bulkAdd(data.collectionMonths);
      await db.transfers.bulkAdd(data.transfers ?? []);
      await db.balanceAdjustments.bulkAdd(data.balanceAdjustments ?? []);
      // The backup re-inserts rows with their original IDs. Postgres's
      // auto-increment counters don't know about those IDs, so without this,
      // the next manually-added record could collide with a restored one.
      const { error: seqError } = await supabase.rpc('fix_all_sequences');
      if (seqError) console.warn('Sequence reset after restore failed (non-fatal):', seqError.message);
      toast('Backup restored successfully');
    } catch (err) {
      toast(`Restore failed: ${err.message || 'unknown error — check the browser console'}`, 'error');
      console.error('Backup restore error:', err);
    }
  }

  async function confirmDeleteBalance() {
    if (deleteBalanceId == null) return;
    await db.balanceAdjustments.delete(deleteBalanceId);
    toast('Balance entry deleted', 'info');
    setDeleteBalanceId(null);
  }

  return (
    <div className="pb-24">
      <PageHeader eyebrow="Configuration" title="Settings" />
      <div className="mx-auto max-w-2xl space-y-5 px-5 py-5">
        <Card>
          <CardHeader>
            <CardTitle>Application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSettingsSubmit(onSaveSettings)} className="space-y-3">
              <div>
                <Label htmlFor="appName">Application Name</Label>
                <Input id="appName" {...registerSettings('appName')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" {...registerSettings('currency')} placeholder="INR" />
                </div>
                <div>
                  <Label htmlFor="sessionTimeoutMinutes">Session Timeout (min)</Label>
                  <Input id="sessionTimeoutMinutes" type="number" {...registerSettings('sessionTimeoutMinutes')} />
                </div>
              </div>
              <Button type="submit" size="sm">
                Save
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-ink-soft">Theme</p>
            <div className="flex gap-1 rounded-xl bg-paper-dim p-1">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${theme === 'light' ? 'bg-white text-brand-700 shadow-soft' : 'text-ink-soft'}`}
              >
                <Sun size={14} /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${theme === 'dark' ? 'bg-white text-brand-700 shadow-soft' : 'text-ink-soft'}`}
              >
                <Moon size={14} /> Dark
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup &amp; Restore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-ink-soft">Export a full JSON backup of contributors, collections and transfers, or restore from a previous backup file.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={exportBackup}>
                <Download size={14} /> Export Backup (JSON)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} /> Import Backup
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importBackup(file);
                  e.target.value = '';
                }}
              />
            </div>
            <p className="text-xs text-ink-soft/70">Restoring a backup replaces all current data on this device.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const seeded = await seedSampleData();
                toast(seeded ? 'Sample data loaded' : 'Sample data only loads into an empty app', seeded ? 'success' : 'info');
              }}
            >
              Load Sample Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Existing Balance</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingBalance(null);
                setShowBalanceDialog(true);
              }}
            >
              <Plus size={14} /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-ink-soft">
              Record cash or bank balance you already hold (before you started tracking here). It's added straight into your running balance
              on the Dashboard and Transfers.
            </p>
            {(adjustments ?? []).length === 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3.5 py-3 text-xs text-ink-soft">
                <Wallet size={15} className="shrink-0" /> No existing balance recorded yet.
              </div>
            )}
            <div className="space-y-2">
              {(adjustments ?? []).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink">{a.label}</p>
                    <p className="text-xs text-ink-soft">
                      As of {formatDate(a.date)}
                      {a.notes ? ` · ${a.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className={`font-display text-sm font-semibold ${a.amount >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
                      {formatCurrency(a.amount, currency)}
                    </p>
                    <button
                      onClick={() => {
                        setEditingBalance(a);
                        setShowBalanceDialog(true);
                      }}
                      className="rounded-lg p-1.5 text-ink-soft/60 hover:bg-brand-50 hover:text-brand-600"
                      aria-label="Edit balance entry"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteBalanceId(a.id)}
                      className="rounded-lg p-1.5 text-ink-soft/60 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete balance entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Admin Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-3">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" {...registerPassword('currentPassword')} />
                {passwordErrors.currentPassword && <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" {...registerPassword('newPassword')} />
                  {passwordErrors.newPassword && <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword.message}</p>}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" {...registerPassword('confirmPassword')} />
                  {passwordErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword.message}</p>}
                </div>
              </div>
              <Button type="submit" size="sm">
                <KeyRound size={14} /> Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="flex items-start gap-2 text-sm text-ink-soft">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p>
              Salahudeen Family Support v1.0 — an offline-first record-keeping app for tracking monthly support contributions and family
              transfers. All data is stored locally on this device using IndexedDB; nothing is sent to a server.
            </p>
          </CardContent>
        </Card>

        <Button variant="secondary" className="w-full" onClick={() => setShowLogoutConfirm(true)}>
          <LogOut size={16} /> Sign Out
        </Button>
      </div>

      <BalanceAdjustmentDialog
        open={showBalanceDialog}
        onClose={() => {
          setShowBalanceDialog(false);
          setEditingBalance(null);
        }}
        editing={editingBalance}
      />
      <ConfirmDialog
        open={deleteBalanceId != null}
        title="Delete Balance Entry"
        description="This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeleteBalance}
        onCancel={() => setDeleteBalanceId(null)}
      />
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Sign Out"
        description="You will need to sign in again to access the app."
        confirmLabel="Sign Out"
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
