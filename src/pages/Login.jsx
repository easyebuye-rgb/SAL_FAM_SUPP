import { useState } from 'react';
import { Coins, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { hashPassword, logViewerActivity } from '@/lib/db';
import { useSettings } from '@/hooks/useData';
import { useAuthStore } from '@/store/uiStore';
import { Input, Label } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

export default function Login() {
  const settings = useSettings();
  const login = useAuthStore((s) => s.login);
  const [tab, setTab] = useState('admin'); // 'admin' | 'viewer'
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [remember, setRemember] = useState(true);
  const [viewerName, setViewerName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAdminSubmit(e) {
    e.preventDefault();
    if (!settings) return;
    setBusy(true);
    setError('');
    const hash = await hashPassword(pin);
    if (hash === settings.passwordHash) {
      login('admin', '', remember);
      toast('Welcome back');
    } else {
      setError('Incorrect PIN.');
    }
    setBusy(false);
  }

  async function handleViewerSubmit(e) {
    e.preventDefault();
    const name = viewerName.trim();
    if (!name) {
      setError('Please enter your name.');
      return;
    }
    setBusy(true);
    await logViewerActivity(name);
    login('viewer', name, remember);
    toast(`Welcome, ${name}`);
    setBusy(false);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 px-6">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />

      <button
        onClick={() => window.location.reload()}
        className="absolute right-5 top-[calc(env(safe-area-inset-top)+1.25rem)] flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
        aria-label="Refresh page"
      >
        <RefreshCw size={16} />
      </button>

      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lift">
            <Coins size={26} className="text-brand-600" />
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-white">Salahudeen Family Support</h1>
          <p className="mt-1 text-sm text-white/70">Monthly contributions &amp; transfers</p>
        </div>

        <div className="rounded-xl2 border border-white/10 bg-white p-6 shadow-lift">
          <div className="mb-5 flex gap-1 rounded-xl bg-paper-dim p-1">
            <button
              onClick={() => {
                setTab('admin');
                setError('');
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                tab === 'admin' ? 'bg-white text-brand-700 shadow-soft' : 'text-ink-soft'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => {
                setTab('viewer');
                setError('');
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                tab === 'viewer' ? 'bg-white text-brand-700 shadow-soft' : 'text-ink-soft'
              }`}
            >
              Viewer
            </button>
          </div>

          {tab === 'admin' ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <Label htmlFor="pin">Admin PIN</Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN"
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-soft/60 hover:bg-paper-dim"
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-300"
                />
                Stay signed in on this device
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? 'Signing in…' : 'Log In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleViewerSubmit} className="space-y-4">
              <div>
                <Label htmlFor="viewerName">Your Name</Label>
                <Input
                  id="viewerName"
                  autoFocus
                  value={viewerName}
                  onChange={(e) => setViewerName(e.target.value)}
                  placeholder="e.g. Fatima"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-300"
                />
                Stay signed in on this device
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? 'Continuing…' : 'Continue as Viewer'}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-white/50">Salahudeen Family Support — private household tool</p>
      </div>
    </div>
  );
}
