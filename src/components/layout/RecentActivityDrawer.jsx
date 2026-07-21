import { createPortal } from 'react-dom';
import { X, UserCircle2 } from 'lucide-react';
import { useViewerActivity } from '@/hooks/useData';

function formatWhen(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function RecentActivityDrawer({ open, onClose }) {
  const activity = useViewerActivity();

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end bg-ink/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-xs flex-col bg-white p-5 shadow-lift animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Recent Viewer Activity</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-soft hover:bg-paper-dim" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-xs text-ink-soft">Every time someone opens the app as a Viewer, their name and the time is logged here.</p>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {(activity ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-ink-soft">No viewer activity yet.</p>
          )}
          {(activity ?? []).map((a) => (
            <div key={a.id} className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5">
              <UserCircle2 size={18} className="shrink-0 text-brand-500" />
              <div>
                <p className="text-sm font-medium text-ink">{a.name}</p>
                <p className="text-xs text-ink-soft">{formatWhen(a.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
