import { create } from 'zustand';

const AUTH_KEY = 'sfs_auth';
const ROLE_KEY = 'sfs_role';
const NAME_KEY = 'sfs_viewer_name';

function readAuth() {
  // "Stay signed in" writes to localStorage (survives closing the browser).
  // Otherwise we use sessionStorage (clears when the tab/browser closes).
  const store = localStorage.getItem(AUTH_KEY) ? localStorage : sessionStorage;
  return {
    isAuthenticated: store.getItem(AUTH_KEY) === '1',
    role: store.getItem(ROLE_KEY) || null,
    viewerName: store.getItem(NAME_KEY) || ''
  };
}

export const useAuthStore = create((set) => ({
  ...readAuth(),
  lastActivity: Date.now(),
  login: (role, viewerName = '', remember = false) => {
    const store = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    // Only one storage should ever hold the session, to avoid stale leftovers.
    other.removeItem(AUTH_KEY);
    other.removeItem(ROLE_KEY);
    other.removeItem(NAME_KEY);
    store.setItem(AUTH_KEY, '1');
    store.setItem(ROLE_KEY, role);
    store.setItem(NAME_KEY, viewerName);
    set({ isAuthenticated: true, role, viewerName, lastActivity: Date.now() });
  },
  logout: () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(NAME_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(NAME_KEY);
    set({ isAuthenticated: false, role: null, viewerName: '' });
  },
  touch: () => set({ lastActivity: Date.now() })
}));

export const useUIStore = create((set) => ({
  theme: localStorage.getItem('sfs_theme') || 'light',
  setTheme: (t) => {
    localStorage.setItem('sfs_theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
    set({ theme: t });
  }
}));
