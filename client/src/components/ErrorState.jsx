import { AlertTriangle, RefreshCw } from 'lucide-react';

// Shown when data failed to load, so a timeout is never mistaken for "you have no data"
const ErrorState = ({ message = 'Could not load this data.', onRetry, compact = false }) => (
  <div
    className="card"
    role="alert"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.9rem',
      flexWrap: 'wrap',
      padding: compact ? '0.9rem 1.1rem' : '2.5rem 2rem',
      justifyContent: compact ? 'flex-start' : 'center',
      textAlign: compact ? 'left' : 'center',
      borderColor: 'rgba(255,171,64,0.4)',
      marginBottom: '1.5rem',
    }}
  >
    <AlertTriangle size={compact ? 18 : 22} color="var(--color-warning)" style={{ flexShrink: 0 }} />
    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', flex: compact ? 1 : 'unset' }}>{message}</span>
    {onRetry && (
      <button className="btn-secondary" onClick={onRetry} style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
        <RefreshCw size={14} /> Retry
      </button>
    )}
  </div>
);

export default ErrorState;
