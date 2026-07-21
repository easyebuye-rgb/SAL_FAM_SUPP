# Salahudeen Family Support

A Progressive Web App for tracking monthly financial support collected for Salahudeen's family — who contributed, which months a payment covers, what's been transferred to the family, and the running balance. Data lives in a shared **Supabase** (Postgres) database, so Admin and every Viewer — on any device — see the same live data, and it updates automatically for everyone the moment something changes.

## Features

- **Two entry roles** — a cover screen with an Admin/Viewer tab switcher. Admin enters a PIN (masked by default, with a show/hide toggle) and can optionally stay signed in on that device. Viewer just types a name — no password shown anywhere on screen, matching how a shared household device should work.
- **Dashboard** — total collected, total transferred, current balance (including any existing balance you've added), contributor count, and a collection-vs-transfer trend chart, plus a scrollable monthly summary. Viewers get a "Contributors" tile here that opens the read-only summary.
- **Collections** — record a payment from a contributor, covering a single month or a start→end month range (e.g. "covers Jan–Apr 2026"); manage the contributor list; search and filter by contributor/method. Every collection and every contributor can be edited or deleted at any time (admin only).
- **Contributor Summary** — a list (inside Collections for admin, and standalone for viewers) showing every contributor's total amount given and how many months their payments cover, sorted **A–Z by name**.
- **Month Detail** — tap any month from the dashboard to see every collection that covers it, with each contributor's share (admin only).
- **Transfers** — record money sent to the family (bank transfer, cash, UPI, other), edit or delete any entry, and see the running balance (admin only).
- **Existing / Opening Balance** — record cash or bank balance you already hold before you started tracking here (Settings → Existing Balance). It's added straight into the running balance shown on the Dashboard and Transfers, and can be edited or deleted like any other entry.
- **Reports** — monthly, yearly, or custom date-range reports with a full transaction ledger (collections, transfers, and balance entries), contributor statistics (pie chart), and a yearly comparison (bar chart). Export to CSV, Excel, or PDF, or print directly (admin only).
- **Recent Viewer Activity** — every time someone continues as a Viewer, their name and the time is logged. Admins can see this list via the hamburger (☰) icon in the top-right of any page.
- **Back & Refresh on every page** — a back arrow (browser-history back) and a refresh icon (reloads while staying on the same page) sit at the top-left of every screen.
- **Settings** — app name/currency (defaults to ₹ INR), light/dark theme, JSON backup export & restore, admin password change, session timeout (admin only).
- **PWA** — installable on iPhone (Safari), Android (Chrome), and desktop; bottom navigation (admin) and touch-friendly tap targets. Needs an internet connection to load and save data (it talks to Supabase); the app shell itself can open offline, but data actions need a connection.

## Tech Stack

React 18 · JavaScript · Vite · Tailwind CSS · Zustand · React Hook Form + Zod · Supabase (Postgres + Realtime) · Recharts · jsPDF + jspdf-autotable · SheetJS (xlsx) · date-fns · Lucide icons · vite-plugin-pwa

## Supabase Setup (do this first)

This app needs a Supabase project to store its data. See the step-by-step walkthrough for creating one, or the short version:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your project, paste in the contents of `supabase-schema.sql` (included in this project), and run it. This creates all the tables the app needs.
3. Go to **Project Settings → API**, copy the **Project URL** and the **anon public** key.
4. Set them as environment variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — locally in a `.env` file (copy `.env.example`), and on Netlify under **Site settings → Environment variables**.

## Getting Started

### 1. Install dependencies

This project was generated with its full source code but **without** `node_modules` (no package install was run in the build environment). On your own machine, with Node.js 18+ installed:

```bash
cd salahudeen-family-support
npm install
```

### 2. Run in development

```bash
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`) in your browser.

### 3. Build for production

```bash
npm run build
```

This produces an optimized, installable PWA bundle in `dist/`. Preview it locally with:

```bash
npm run preview
```

> Note: this project is plain JavaScript (no TypeScript compile step), so the build is a straightforward `vite build`. If anything fails on your machine or on Netlify, share the error log and it can be fixed quickly.

## Default Login

- **Admin password:** `2526`
- **Viewer:** no password — just type a name to continue (this gets logged as recent activity, visible to admin via the ☰ icon)

Change the admin password any time from **Settings → Change Admin Password**. It's hashed (SHA-256) before being stored in the database — this is a household-ledger-grade lock, not bank-grade security.

## Deploying

### Netlify (matches your existing HSE app deployment pattern)

1. Push this project to a GitHub repo.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Build command `npm run build`, publish directory `dist` — already pre-configured in `netlify.toml`.
4. Deploy. You'll get a URL like `salahudeen-family-support.netlify.app`.

### Vercel

`vercel.json` is already included — just import the repo at vercel.com and deploy with defaults.

### Installing as an app

- **iPhone (Safari):** open the deployed URL → Share button → **Add to Home Screen**.
- **Android (Chrome):** open the URL → menu (⋮) → **Install app** (or you'll see an install banner).
- **Desktop (Chrome/Edge):** click the install icon in the address bar.

Once installed, the app automatically shows the same live data on every device — Admin and every Viewer share one Supabase database, so nothing needs to be manually transferred between phones.

## Backup & Restore

Even with shared cloud storage, it's worth keeping a manual snapshot occasionally — use **Settings → Backup & Restore**:

- **Export Backup (JSON)** downloads a full snapshot of contributors, collections, and transfers.
- **Import Backup** restores from a previously exported file — this replaces all current data for everyone (it's the shared database), so export first if unsure.

## Data Model

- **Contributor** — name, phone, notes.
- **Collection** — a single payment: contributor, amount, date/time, payment method, notes.
- **Collection Month** — a join record linking one collection to every month it covers (a collection covering Jan–Apr creates four of these). When a collection covers several months, its amount is split evenly across those months for monthly-summary purposes; the full original amount is always shown against the collection itself.
- **Transfer** — a payment out to the family: amount, date/time, method, notes.
- **Balance Adjustment** — an existing balance you already hold (e.g. cash in hand, bank balance carried forward): label, amount, as-of date, notes. Positive amounts add to the running balance; negative amounts correct it downward.

Currency defaults to **INR (₹)** — change it any time in Settings → Application.

## Project Structure

```
src/
  components/
    ui/           # Button, Card, Input/Select, Dialog, Toast, Skeleton
    layout/       # BottomNav, PageHeader
    collections/  # Contributor + Collection record/edit dialogs
    transfers/    # Transfer record/edit dialog
    settings/     # Existing balance (opening balance) add/edit dialog
  pages/          # Dashboard, Collections, MonthDetail, Transfers, Reports, Settings, Login
  hooks/useData.ts # Dexie live-query hooks + derived totals/summaries/contributor rankings
  lib/            # db.ts (Dexie schema), utils.ts, validators.ts (Zod), exports.ts, seed.ts
  store/          # Zustand auth + theme stores
```

## Scaling This Later

The data layer is isolated behind `src/lib/db.ts` and the `useData` hooks, so it can later grow into:

- **Multiple families / administrators** — add a `familyId` to each table and scope queries by it.
- **Cloud sync** — swap Dexie's local-only tables for a Dexie Cloud or Supabase-backed sync layer without touching page components, since they only talk to the hooks.
- **Notifications / WhatsApp / SMS reminders** — hook into the existing collection/transfer create events.

## Sample Data

**Settings → Load Sample Data** seeds a few months of realistic-looking contributors, collections, and transfers into an empty database, useful for a first look at the dashboard and reports before entering real data.
