import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/uiStore';
import { RecentActivityDrawer } from '@/components/layout/RecentActivityDrawer';

export function PageHeader({ eyebrow, title, action }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useAuthStore((s) => s.role);
  const [showActivity, setShowActivity] = useState(false);
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] backdrop-blur relative">
      <div className="mx-auto max-w-2xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {!isHome && (
              <button
                onClick={() => navigate(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-dim"
                aria-label="Go back"
              >
                <ArrowLeft size={17} />
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-dim"
              aria-label="Refresh page"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          {role === 'admin' && (
            <button
              onClick={() => setShowActivity(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-dim"
              aria-label="Recent viewer activity"
            >
              <Menu size={18} />
            </button>
          )}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-500">{eyebrow}</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          </div>
          {action}
        </div>
      </div>
      <div className="absolute inset-x-0 -bottom-px h-[3px] bg-gradient-to-r from-brand-500 via-brand-400 to-gold-400 opacity-70" />
      <RecentActivityDrawer open={showActivity} onClose={() => setShowActivity(false)} />
    </header>
  );
}
