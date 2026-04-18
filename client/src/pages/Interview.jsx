import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ChatBubble, { TypingIndicator } from '../components/ChatBubble';
import ScoreCard from '../components/ScoreCard';
import FeedbackCard from '../components/FeedbackCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  Send, Mic, Square, Settings, ChevronRight, RotateCcw,
  MessageSquare, Trophy, Briefcase, Brain
} from 'lucide-react';

const SETUP_STEP = 'setup';
const CHAT_STEP = 'chat';
const DONE_STEP = 'done';

const Interview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(SETUP_STEP);
  const [interview, setInterview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [resumes, setResumes] = useState([]);

  const [config, setConfig] = useState({
    role: user?.targetRole || 'Software Engineer',
    type: 'mixed',
    difficulty: 'medium',
    resumeId: '',
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get('/resume/all').then(r => setResumes(r.data.resumes || [])).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const startInterview = async () => {
    try {
      setSending(true);
      // Create session
      const createRes = await api.post('/interview', config);
      const iv = createRes.data.interview;
      setInterview(iv);

      // Start chat
      setTyping(true);
      setStep(CHAT_STEP);
      const chatRes = await api.post(`/chat/start/${iv._id}`);
      setMessages([{ role: 'assistant', content: chatRes.data.message, timestamp: new Date() }]);
      setTyping(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start interview');
      setStep(SETUP_STEP);
    } finally {
      setSending(false);
      setTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || typing) return;

    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setSending(true);

    try {
      const res = await api.post(`/chat/message/${interview._id}`, { message: userMsg.content });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message, timestamp: new Date() }]);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setTyping(false);
      setSending(false);
    }
  };

  const endInterview = async () => {
    if (messages.filter(m => m.role === 'user').length < 2) {
      return toast.error('Please answer at least 2 questions before ending');
    }
    setEnding(true);
    try {
      const res = await api.post(`/chat/end/${interview._id}`);
      setFeedback(res.data.feedback);
      setStep(DONE_STEP);
      toast.success('Interview completed! Check your feedback below.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end interview');
    } finally {
      setEnding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── SETUP SCREEN ────────────────────────────────────────────────────────────
  if (step === SETUP_STEP) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', animation: 'fadeInUp 0.4s ease' }}>
        <div className="section-header">
          <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Brain size={28} color="var(--color-primary)" /> Mock Interview
          </h1>
          <p className="section-subtitle">Configure your interview session settings</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Role */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <Briefcase size={14} style={{ display: 'inline', marginRight: '0.4rem' }} />
                Target Role
              </label>
              <input
                className="input"
                placeholder="e.g. Software Engineer, Product Manager"
                value={config.role}
                onChange={e => setConfig(c => ({ ...c, role: e.target.value }))}
              />
            </div>

            {/* Type + Difficulty */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Interview Type</label>
                <select className="input" value={config.type} onChange={e => setConfig(c => ({ ...c, type: e.target.value }))}>
                  <option value="mixed">Mixed (HR + Technical)</option>
                  <option value="technical">Technical Only</option>
                  <option value="hr">HR / Behavioral</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Difficulty</label>
                <select className="input" value={config.difficulty} onChange={e => setConfig(c => ({ ...c, difficulty: e.target.value }))}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Resume */}
            {resumes.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Link Resume (Optional)
                </label>
                <select className="input" value={config.resumeId} onChange={e => setConfig(c => ({ ...c, resumeId: e.target.value }))}>
                  <option value="">No resume</option>
                  {resumes.map(r => (
                    <option key={r._id} value={r._id}>{r.fileName}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                  Linking a resume makes questions more relevant to your background
                </p>
              </div>
            )}

            {/* Tips */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1rem', border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>💡 Tips for best experience:</p>
              <ul style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li>Answer questions in the same way you would in a real interview</li>
                <li>Be specific with examples from your experience</li>
                <li>Take your time — there's no rush</li>
                <li>Answer at least 5-6 questions for meaningful feedback</li>
              </ul>
            </div>

            <button
              className="btn-primary"
              onClick={startInterview}
              disabled={sending || !config.role.trim()}
              style={{ justifyContent: 'center' }}
            >
              {sending ? (
                <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Starting...</>
              ) : (
                <><Mic size={18} /> Start Interview Session</>
              )}
            </button>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── DONE SCREEN ─────────────────────────────────────────────────────────────
  if (step === DONE_STEP) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              🎉 Interview Complete!
            </h1>
            <p style={{ color: 'var(--color-text-muted)' }}>Here's your detailed performance analysis</p>
          </div>
          <button className="btn-secondary" onClick={() => { setStep(SETUP_STEP); setMessages([]); setInterview(null); setFeedback(null); }}>
            <RotateCcw size={16} /> New Session
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <ScoreCard feedback={feedback} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FeedbackCard title="Strengths" items={feedback?.strengths || []} type="success" />
            <FeedbackCard title="Areas to Improve" items={feedback?.improvements || []} type="warning" />
            <FeedbackCard title="Recommendations" items={feedback?.recommendations || []} type="info" />
          </div>
        </div>
      </div>
    );
  }

  // ─── CHAT SCREEN ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)', animation: 'fadeIn 0.3s ease' }}>
      {/* Chat Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        marginBottom: '1rem',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--color-success)',
            animation: 'pulse-glow 2s infinite',
          }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{interview?.role} Interview</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              {interview?.type} · {interview?.difficulty} · {messages.filter(m => m.role === 'user').length} answers given
            </div>
          </div>
        </div>
        <button
          className="btn-danger"
          onClick={endInterview}
          disabled={ending}
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
        >
          {ending ? '...' : <><Square size={14} /> End Interview</>}
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        background: 'var(--color-surface)',
        borderRadius: 16,
        border: '1px solid var(--color-border)',
        marginBottom: '1rem',
      }}>
        {messages.length === 0 && !typing && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
            <MessageSquare size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
            <p>Starting your interview...</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg.content} isAI={msg.role === 'assistant'} timestamp={msg.timestamp} />
        ))}
        {typing && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <textarea
          className="input"
          rows={3}
          placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ resize: 'none', flex: 1, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}
          disabled={sending || typing}
        />
        <button
          className="btn-primary"
          onClick={sendMessage}
          disabled={sending || typing || !input.trim()}
          style={{ padding: '0.75rem', height: 'fit-content', alignSelf: 'flex-end' }}
        >
          <Send size={18} />
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Interview;
