import { CheckCircle, Star, BookOpen, TrendingUp, FileText } from 'lucide-react';

const ResumeAnalysis = ({ resume }) => {
  if (!resume) return null;
  const { analysis, fileName } = resume;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp 0.4s ease' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,255,0.1))',
          border: '1px solid rgba(108,99,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <FileText size={22} color="var(--color-primary)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{fileName}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            Resume analyzed successfully
          </div>
        </div>
        <div className="badge badge-success">
          <CheckCircle size={12} /> Analyzed
        </div>
      </div>

      {/* Overall score */}
      <div className="card" style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
          Resume Score
        </h3>
        <div style={{
          fontSize: '3.5rem',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 800,
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          marginBottom: '0.5rem'
        }}>
          {analysis?.overallScore || 0}
          <span style={{ fontSize: '1.5rem', opacity: 0.6 }}>/100</span>
        </div>
        <div className="progress-bar" style={{ margin: '1rem auto', maxWidth: 200 }}>
          <div className="progress-fill" style={{ width: `${analysis?.overallScore || 0}%` }} />
        </div>
        {analysis?.summary && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
            {analysis.summary}
          </p>
        )}
      </div>

      {/* Skills */}
      {analysis?.skills?.length > 0 && (
        <div className="card">
          <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={16} color="var(--color-warning)" /> Skills Detected
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {analysis.skills.map((skill, i) => (
              <span key={i} className="badge badge-primary">{skill}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Strengths */}
        {analysis?.strengths?.length > 0 && (
          <div className="card">
            <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-success)', fontSize: '0.9rem' }}>
              ✅ Strengths
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {analysis.strengths.map((s, i) => (
                <li key={i} style={{ fontSize: '0.85rem', color: 'var(--color-text)', display: 'flex', gap: '0.4rem' }}>
                  <span style={{ color: 'var(--color-success)' }}>›</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {analysis?.weaknesses?.length > 0 && (
          <div className="card">
            <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-error)', fontSize: '0.9rem' }}>
              ⚠️ Weaknesses
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {analysis.weaknesses.map((w, i) => (
                <li key={i} style={{ fontSize: '0.85rem', color: 'var(--color-text)', display: 'flex', gap: '0.4rem' }}>
                  <span style={{ color: 'var(--color-error)' }}>›</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Missing Skills */}
      {analysis?.missingSkills?.length > 0 && (
        <div className="card">
          <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)' }}>
            <BookOpen size={16} /> Missing Skills to Acquire
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {analysis.missingSkills.map((skill, i) => (
              <span key={i} className="badge badge-warning">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis?.recommendations?.length > 0 && (
        <div className="card">
          <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-light)' }}>
            <TrendingUp size={16} /> AI Recommendations
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {analysis.recommendations.map((rec, i) => (
              <li key={i} style={{
                fontSize: '0.875rem',
                color: 'var(--color-text)',
                display: 'flex',
                gap: '0.5rem',
                padding: '0.5rem',
                background: 'var(--color-surface)',
                borderRadius: 8,
                lineHeight: 1.5
              }}>
                <span style={{ color: 'var(--color-primary)' }}>{i + 1}.</span> {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis;
