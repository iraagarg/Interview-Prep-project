const ScoreRing = ({ score, size = 90, strokeWidth = 8, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 80) return '#00e676';
    if (s >= 60) return '#6c63ff';
    if (s >= 40) return '#ffab40';
    return '#ff5252';
  };

  const color = getColor(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: 'center',
            fontSize: size > 80 ? '1.4rem' : '1rem',
            fontWeight: 700,
            fill: color,
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          {score}
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          {label}
        </span>
      )}
    </div>
  );
};

const ScoreCard = ({ feedback }) => {
  if (!feedback) return null;

  const metrics = [
    { label: 'Communication', score: feedback.communication || 0 },
    { label: 'Technical', score: feedback.technical || 0 },
    { label: 'Problem Solving', score: feedback.problemSolving || 0 },
    { label: 'Confidence', score: feedback.confidence || 0 },
  ];

  return (
    <div className="card" style={{ animation: 'fadeInUp 0.5s ease' }}>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.2rem' }}>
        Performance Scores
      </h3>

      {/* Overall Score */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <ScoreRing score={feedback.overallScore || 0} size={120} strokeWidth={10} label="Overall Score" />
      </div>

      {/* Sub metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {metrics.map(m => (
          <ScoreRing key={m.label} score={m.score} size={80} strokeWidth={7} label={m.label} />
        ))}
      </div>

      {/* Summary */}
      {feedback.summary && (
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 12,
          padding: '1rem',
          border: '1px solid var(--color-border)',
          marginBottom: '1rem'
        }}>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--color-text-muted)' }}>
            {feedback.summary}
          </p>
        </div>
      )}

      {/* Strengths & Improvements side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {feedback.strengths?.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-success)', marginBottom: '0.5rem' }}>
              ✅ Strengths
            </h4>
            {feedback.strengths.map((s, i) => (
              <div key={i} style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', padding: '0.3rem 0', borderBottom: '1px solid var(--color-border)' }}>
                {s}
              </div>
            ))}
          </div>
        )}
        {feedback.improvements?.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-warning)', marginBottom: '0.5rem' }}>
              💡 Improve
            </h4>
            {feedback.improvements.map((im, i) => (
              <div key={i} style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', padding: '0.3rem 0', borderBottom: '1px solid var(--color-border)' }}>
                {im}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { ScoreRing };
export default ScoreCard;
