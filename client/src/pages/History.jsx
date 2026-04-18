import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ScoreCard from '../components/ScoreCard';
import FeedbackCard from '../components/FeedbackCard';
import { History as HistoryIcon, ChevronDown, ChevronUp, Trash2, Clock, MessageSquare, CheckCircle, XCircle, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const statusBadge = { completed: 'badge-success', active: 'badge-primary', abandoned: 'badge-error' };
const statusIcon = { completed: CheckCircle, active: Activity, abandoned: XCircle };

const InterviewCard = ({ interview, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = statusIcon[interview.status] || Activity;

  return (
    <div className="card" style={{ transition: 'all 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: interview.status === 'completed' ? 'rgba(0,230,118,0.1)' : 'rgba(108,99,255,0.1)',
          border: `1px solid ${interview.status === 'completed' ? 'rgba(0,230,118,0.25)' : 'rgba(108,99,255,0.25)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <StatusIcon size={20} color={interview.status === 'completed' ? '#00e676' : '#6c63ff'} />
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {interview.role}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className={`badge ${statusBadge[interview.status] || 'badge-primary'}`} style={{ fontSize: '0.72rem' }}>
              {interview.status}
            </span>
            <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>{interview.type}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
              {new Date(interview.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {interview.duration > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>· {interview.duration}min</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {interview.feedback?.overallScore > 0 && (
            <div style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.5rem',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {interview.feedback.overallScore}
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(interview._id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem', borderRadius: 6, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <Trash2 size={16} />
          </button>
          {expanded ? <ChevronUp size={18} color="var(--color-text-muted)" /> : <ChevronDown size={18} color="var(--color-text-muted)" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && interview.status === 'completed' && interview.feedback?.overallScore > 0 && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <ScoreCard feedback={interview.feedback} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <FeedbackCard title="Strengths" items={interview.feedback.strengths || []} type="success" />
            <FeedbackCard title="Improve" items={interview.feedback.improvements || []} type="warning" />
          </div>
        </div>
      )}

      {expanded && interview.questionsAsked > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', gap: '1rem' }}>
          <span><MessageSquare size={13} style={{ display: 'inline', marginRight: 4 }} />{interview.questionsAsked} questions asked</span>
        </div>
      )}
    </div>
  );
};

const History = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');

  const fetchInterviews = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/interview?page=${p}&limit=10`);
      setInterviews(res.data.interviews || []);
      setTotalPages(res.data.pages || 1);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterviews(page); }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this interview session?')) return;
    try {
      await api.delete(`/interview/${id}`);
      setInterviews(iv => iv.filter(i => i._id !== id));
      toast.success('Interview deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = filter === 'all' ? interviews : interviews.filter(iv => iv.status === filter);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <HistoryIcon size={28} color="var(--color-primary)" /> Interview History
          </h1>
          <p className="section-subtitle">Review all your past interview sessions</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'completed', 'active', 'abandoned'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 8,
                border: `1px solid ${filter === f ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: filter === f ? 'rgba(108,99,255,0.15)' : 'transparent',
                color: filter === f ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: filter === f ? 600 : 400,
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading history..." />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <HistoryIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>No interviews found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {filter === 'all' ? "You haven't taken any interviews yet" : `No ${filter} interviews`}
          </p>
          <Link to="/interview" className="btn-primary">Start your first interview →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(iv => (
            <InterviewCard key={iv._id} interview={iv} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 8,
                border: `1px solid ${page === p ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: page === p ? 'rgba(108,99,255,0.15)' : 'transparent',
                color: page === p ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontWeight: page === p ? 600 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
