import { create } from 'zustand';
import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

export const useToastStore = create((set) => ({
  toasts: [],
  push: (message, type = 'success') =>
    set((s) => ({ toasts: [...s.toasts, { id: Math.random().toString(36).slice(2), message, type }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}));

export function toast(message, type = 'success') {
  useToastStore.getState().push(message, type);
}

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const colors = {
  success: 'bg-brand-600',
  error: 'bg-red-600',
  info: 'bg-ink'
};

export function ToastViewport() {
  const { toasts, dismiss } = useToastStore();

  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), 3200));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl ${colors[t.type]} px-4 py-3 text-sm text-white shadow-lift animate-[fadeIn_0.2s_ease-out]`}
          >
            <Icon size={16} />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
