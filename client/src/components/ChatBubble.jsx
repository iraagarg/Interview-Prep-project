import { Bot, User } from 'lucide-react';

const ChatBubble = ({ message, isAI, timestamp }) => {
  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  if (isAI) {
    return (
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', maxWidth: '82%', animation: 'fadeInUp 0.3s ease' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Bot size={18} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
            AI Interviewer {time && `• ${time}`}
          </div>
          <div className="chat-bubble-ai">
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', maxWidth: '82%', marginLeft: 'auto', flexDirection: 'row-reverse', animation: 'fadeInUp 0.3s ease' }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-accent), var(--color-warning))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <User size={18} color="white" />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem', textAlign: 'right' }}>
          You {time && `• ${time}`}
        </div>
        <div className="chat-bubble-user">
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export const TypingIndicator = () => (
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', animation: 'fadeIn 0.3s ease' }}>
    <div style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Bot size={18} color="white" />
    </div>
    <div className="chat-bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.9rem 1.25rem' }}>
      <div className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
      <div className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
      <div className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
    </div>
  </div>
);

export default ChatBubble;
