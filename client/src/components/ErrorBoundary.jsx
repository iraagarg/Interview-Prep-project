import { Component } from 'react';
import { RefreshCw } from 'lucide-react';

// After a redeploy, an open tab can request a code chunk that no longer exists; any render error
// would otherwise unmount the whole app and leave a blank page.
const isStaleChunk = (error) =>
  /dynamically imported module|Importing a module script failed|Failed to fetch|ChunkLoadError/i.test(String(error?.message || error));

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // A stale chunk is fixed by loading the new build; reload once automatically
    if (isStaleChunk(error) && !sessionStorage.getItem('chunk-reloaded')) {
      sessionStorage.setItem('chunk-reloaded', '1');
      window.location.reload();
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 440, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
            {isStaleChunk(this.state.error)
              ? 'A new version of the app was released. Reload to continue.'
              : 'This page hit an unexpected error. Reloading usually fixes it.'}
          </p>
          <button className="btn-primary" onClick={() => window.location.reload()} style={{ justifyContent: 'center' }}>
            <RefreshCw size={16} /> Reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
