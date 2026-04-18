import { useEffect, useState } from 'react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ProgressChart, SkillsRadar } from '../components/ProgressChart';
import { ScoreRing } from '../components/ScoreCard';
import FeedbackCard from '../components/FeedbackCard';
import { BarChart2, TrendingUp, Target, Zap, RefreshCw } from 'lucide-react';

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [progress, setProgress] = useState([]);
  const [skills, setSkills] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, progressRes, skillsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get(`/analytics/progress?days=${period}`),
        api.get('/analytics/skills'),
      ]);
      setOverview(overviewRes.data.stats);
      setProgress(progressRes.data.progress || []);
      setSkills(skillsRes.data.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  if (!overview?.completedInterviews) {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div className="section-header">
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart2 size={28} color="var(--color-primary)" /> Analytics
          </h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <BarChart2 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>No data yet</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Complete at least one mock interview to see your analytics
          </p>
        </div>
      </div>
    );
  }

  const avg = overview.averageScores;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart2 size={28} color="var(--color-primary)" /> Performance Analytics
          </h1>
          <p className="section-subtitle">Track your interview improvement journey</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 8,
                border: `1px solid ${period === d ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: period === d ? 'rgba(108,99,255,0.15)' : 'transparent',
                color: period === d ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: period === d ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Metric Rings */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          Average Performance Scores
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem' }}>
          <ScoreRing score={avg.overall} size={110} strokeWidth={9} label="Overall" />
          <ScoreRing score={avg.communication} size={90} strokeWidth={8} label="Communication" />
          <ScoreRing score={avg.technical} size={90} strokeWidth={8} label="Technical" />
          <ScoreRing score={avg.problemSolving} size={90} strokeWidth={8} label="Problem Solving" />
          <ScoreRing score={avg.confidence} size={90} strokeWidth={8} label="Confidence" />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Sessions', value: overview.totalInterviews, icon: Zap, color: '#6c63ff' },
          { label: 'Completed', value: overview.completedInterviews, icon: Target, color: '#00e676' },
          { label: 'Practice Time', value: `${Math.round(overview.totalDuration / 60)}h`, icon: TrendingUp, color: '#00d4ff' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stat.color}18`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={stat.color} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>
            Score Trend ({period} days)
          </h3>
          {progress.length > 0 ? (
            <ProgressChart data={progress} />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              No completed interviews in this period
            </div>
          )}
        </div>
        <div className="card">
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>
            Skills Radar
          </h3>
          <SkillsRadar averageScores={avg} />
        </div>
      </div>

      {/* Strengths & Improvements */}
      {skills && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <FeedbackCard
            title="Top Strengths"
            items={skills.topStrengths.map(s => s.text)}
            type="success"
          />
          <FeedbackCard
            title="Key Improvement Areas"
            items={skills.topImprovements.map(s => s.text)}
            type="warning"
          />
        </div>
      )}

      {/* Recommendations */}
      {skills?.recommendations?.length > 0 && (
        <FeedbackCard
          title="AI Recommendations"
          items={skills.recommendations}
          type="info"
        />
      )}
    </div>
  );
};

export default Analytics;
