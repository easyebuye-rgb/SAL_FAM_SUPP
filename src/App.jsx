import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { ToastViewport } from '@/components/ui/toast';
import { useAuthStore, useUIStore } from '@/store/uiStore';
import { useSettings } from '@/hooks/useData';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Collections from '@/pages/Collections';
import MonthDetail from '@/pages/MonthDetail';
import Transfers from '@/pages/Transfers';
import Reports from '@/pages/Reports';
import SettingsPage from '@/pages/Settings';
import ContributorsSummary from '@/pages/ContributorsSummary';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const lastActivity = useAuthStore((s) => s.lastActivity);
  const touch = useAuthStore((s) => s.touch);
  const logout = useAuthStore((s) => s.logout);
  const theme = useUIStore((s) => s.theme);
  const settings = useSettings();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = () => touch();
    window.addEventListener('pointerdown', handler);
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [isAuthenticated, touch]);

  useEffect(() => {
    if (!isAuthenticated || !settings) return;
    const timeoutMs = settings.sessionTimeoutMinutes * 60 * 1000;
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > timeoutMs) {
        logout();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity, settings, logout]);

  if (!isAuthenticated) {
    return (
      <>
        <Login />
        <ToastViewport />
      </>
    );
  }

  if (role === 'viewer') {
    return (
      <div className="min-h-screen bg-paper">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contributors-summary" element={<ContributorsSummary />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastViewport />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/:year/:month" element={<MonthDetail />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/contributors-summary" element={<ContributorsSummary />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <ToastViewport />
    </div>
  );
}
