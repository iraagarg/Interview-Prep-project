import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Mic, FileText, BarChart2, History, TrendingUp, Award, Clock, CheckCircle, ChevronRight, Sparkles } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const QuickStat = ({ label, value, icon: Icon, color, sub }) => (
  <div className="stat-card" style={{ flex: 1 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={22} color={color} />
      </div>
    </div>
    <div style={{
      fontFamily: 'Outfit, sans-serif',
      fontSize: '2rem',
      fontWeight: 800,
      lineHeight: 1,
      marginBottom: '0.25rem',
      color: 'var(--color-text)',
    }}>
      {value}
    </div>
    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: sub ? '0.5rem' : 0 }}>{label}</div>
    {sub && <div style={{ fontSize: '0.78rem', color }}>{sub}</div>}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, interviewsRes, resumeRes] = await Promise.all([
          api.get('/analytics/overview').catch(() => ({ data: { stats: null } })),
          api.get('/interview?limit=5').catch(() => ({ data: { interviews: [] } })),
          api.get('/resume').catch(() => ({ data: { resume: null } })),
        ]);
        setStats(overviewRes.data.stats);
        setRecentInterviews(interviewsRes.data.interviews || []);
        setHasResume(!!resumeRes.data.resume);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const quickActions = [
    { to: '/interview', label: 'Start Mock Interview', desc: 'Practice with AI', icon: Mic, color: '#6c63ff' },
    { to: '/resume', label: hasResume ? 'View Resume Analysis' : 'Upload Resume', desc: hasResume ? 'See AI insights' : 'Get AI feedback', icon: FileText, color: '#00d4ff' },
    { to: '/analytics', label: 'View Analytics', desc: 'Track your progress', icon: BarChart2, color: '#ff6b9d' },
    { to: '/history', label: 'Interview History', desc: 'Past sessions', icon: History, color: '#ffab40' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Sparkles size={20} color="var(--color-warning)" />
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '2rem', marginBottom: '0.5rem' }}>
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          {user?.targetRole ? `Preparing for ${user.targetRole}` : 'Ready to practice your interview skills?'}
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <QuickStat
          label="Total Interviews"
          value={stats?.totalInterviews || 0}
          icon={Mic}
          color="#6c63ff"
        />
        <QuickStat
          label="Completed"
          value={stats?.completedInterviews || 0}
          icon={CheckCircle}
          color="#00e676"
          sub={stats?.completedInterviews > 0 ? 'Great job!' : 'Get started!'}
        />
        <QuickStat
          label="Avg Score"
          value={stats?.averageScores?.overall ? `${stats.averageScores.overall}` : '—'}
          icon={Award}
          color="#ffab40"
          sub={stats?.averageScores?.overall ? '/100' : 'No data yet'}
        />
        <QuickStat
          label="Hours Practiced"
          value={stats?.totalDuration ? Math.round(stats.totalDuration / 60) : 0}
          icon={Clock}
          color="#00d4ff"
          sub="hours total"
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.to} to={action.to} style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${action.color}15`,
                    border: `1px solid ${action.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={22} color={action.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{action.label}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{action.desc}</div>
                  </div>
                  <ChevronRight size={18} color="var(--color-text-muted)" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Interviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Recent Sessions</h2>
            <Link to="/history" style={{ fontSize: '0.82rem', color: 'var(--color-primary)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {recentInterviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
              <Mic size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.9rem' }}>No interviews yet</p>
              <Link to="/interview" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                Start your first →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentInterviews.map(iv => (
                <Link key={iv._id} to={`/history`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: 'var(--color-surface)',
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: iv.status === 'completed' ? 'rgba(0,230,118,0.15)' : 'rgba(108,99,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {iv.status === 'completed' ? <CheckCircle size={16} color="#00e676" /> : <Mic size={16} color="#6c63ff" />}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.role}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {iv.type} • {new Date(iv.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {iv.feedback?.overallScore > 0 && (
                      <div className="badge badge-primary">{iv.feedback.overallScore}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tips / Insights */}
        <div className="card">
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <TrendingUp size={18} color="var(--color-primary)" /> Smart Insights
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { text: !hasResume ? 'Upload your resume to get personalized interview questions' : 'Your resume has been analyzed — practice role-specific questions', type: 'info' },
              { text: 'Practice answering behavioral questions using the STAR method', type: 'success' },
              { text: 'Review data structures and algorithms before technical rounds', type: 'warning' },
              { text: 'Record key metrics after each session to identify patterns', type: 'info' },
            ].map((tip, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'var(--color-surface)',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                  {tip.type === 'success' ? '✅' : tip.type === 'warning' ? '⚡' : '💡'}
                </span>
                <span style={{ color: 'var(--color-text)' }}>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
