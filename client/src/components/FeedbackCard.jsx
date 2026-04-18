import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';

const FeedbackCard = ({ title, items = [], type = 'info', icon: Icon }) => {
  const styles = {
    success: { bg: 'rgba(0, 230, 118, 0.08)', border: 'rgba(0, 230, 118, 0.2)', color: '#00e676', icon: '✅' },
    warning: { bg: 'rgba(255, 171, 64, 0.08)', border: 'rgba(255, 171, 64, 0.2)', color: '#ffab40', icon: '💡' },
    error: { bg: 'rgba(255, 82, 82, 0.08)', border: 'rgba(255, 82, 82, 0.2)', color: '#ff5252', icon: '⚠️' },
    info: { bg: 'rgba(108, 99, 255, 0.08)', border: 'rgba(108, 99, 255, 0.2)', color: '#8b84ff', icon: '📌' },
  };

  const style = styles[type];

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 14,
      padding: '1.25rem',
      animation: 'fadeInUp 0.4s ease'
    }}>
      <h4 style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: 700,
        color: style.color,
        marginBottom: '0.75rem'
      }}>
        {style.icon} {title}
      </h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item, i) => (
          <li key={i} style={{
            fontSize: '0.875rem',
            color: 'var(--color-text)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            lineHeight: 1.6
          }}>
            <span style={{ color: style.color, flexShrink: 0, marginTop: 2 }}>›</span>
            {item}
          </li>
        ))}
        {items.length === 0 && (
          <li style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            No items available
          </li>
        )}
      </ul>
    </div>
  );
};

export default FeedbackCard;
