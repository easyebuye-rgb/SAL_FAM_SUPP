import { AlertTriangle } from 'lucide-react';

export default function ConfigError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertTriangle size={26} />
      </div>
      <h1 className="font-display text-lg font-semibold text-ink">Supabase isn't connected yet</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">
        This site is missing its database connection settings. In Netlify, go to{' '}
        <span className="font-medium text-ink">Site configuration → Environment variables</span> and add both:
      </p>
      <div className="mt-4 space-y-2 rounded-xl border border-line bg-white px-4 py-3 text-left font-mono text-xs text-ink">
        <p>VITE_SUPABASE_URL</p>
        <p>VITE_SUPABASE_ANON_KEY</p>
      </div>
      <p className="mt-4 max-w-sm text-xs text-ink-soft/70">
        Copy both values from your Supabase project's Settings → API page, then trigger a new deploy in Netlify.
      </p>
    </div>
  );
}
