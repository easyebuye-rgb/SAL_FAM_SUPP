import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle size={26} />
          </div>
          <h1 className="font-display text-lg font-semibold text-ink">Something went wrong</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-soft">
            The app hit an unexpected error instead of loading normally. Reloading usually fixes it — if not, share the
            message below.
          </p>
          <pre className="mt-4 max-w-sm overflow-x-auto rounded-xl border border-line bg-white px-4 py-3 text-left text-xs text-red-600">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            <RefreshCw size={15} /> Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
