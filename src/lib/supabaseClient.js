import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// True whenever the two required env vars aren't set (e.g. a fresh Netlify
// site before VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY have been added).
// main.jsx checks this and shows a clear on-screen setup message instead of
// letting the app crash into a blank page.
export const supabaseConfigError = !supabaseUrl || !supabaseAnonKey;

// createClient() throws immediately if given an empty/invalid URL — and
// since this file runs before React even mounts, that used to take down the
// entire page with nothing on screen. Falling back to a syntactically valid
// placeholder URL means createClient() never throws; any request made with
// it will just fail cleanly and visibly instead of crashing at load time.
export const supabase = createClient(
  supabaseConfigError ? 'https://placeholder.supabase.co' : supabaseUrl,
  supabaseConfigError ? 'placeholder-anon-key' : supabaseAnonKey
);
