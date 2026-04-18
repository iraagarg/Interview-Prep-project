import { Link } from 'react-router-dom';
import { Brain, Zap, BarChart2, FileText, ChevronRight, Star, Shield, Mic, Target, TrendingUp } from 'lucide-react';

const features = [
  { icon: FileText, title: 'Smart Resume Analysis', desc: 'Upload your resume and get AI-powered insights on strengths, weaknesses, and missing skills.', color: '#6c63ff' },
  { icon: Mic, title: 'Mock AI Interviews', desc: 'Practice with our AI interviewer that adapts to your responses in real-time.', color: '#00d4ff' },
  { icon: BarChart2, title: 'Performance Analytics', desc: 'Track your progress with detailed metrics and score trends over time.', color: '#ff6b9d' },
  { icon: Target, title: 'Personalized Insights', desc: 'Get targeted recommendations to improve your weakest interview areas.', color: '#ffab40' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your data is encrypted and secure. We never share your interview data.', color: '#00e676' },
  { icon: TrendingUp, title: 'Track Progress', desc: 'Monitor your improvement journey from your first to your latest interview.', color: '#ff5252' },
];

const stats = [
  { value: '10K+', label: 'Practice Sessions' },
  { value: '95%', label: 'Success Rate' },
  { value: '50+', label: 'Interview Types' },
  { value: '4.9★', label: 'User Rating' },
];

const Landing = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backdropFilter: 'blur(20px)',
        background: 'rgba(10,10,15,0.8)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 2rem',
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Brain size={20} color="white" />
            </div>
            <span style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.2rem',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              InterviewAI
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/login" className="btn-secondary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
              Login
            </Link>
            <Link to="/register" className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
              Get Started <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        paddingTop: 140,
        paddingBottom: 100,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 2rem', position: 'relative' }}>
          <div className="badge badge-primary" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
            <Zap size={12} /> AI-Powered Interview Preparation
          </div>

          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
          }}>
            Ace Your Next{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Interview
            </span>
            {' '}with AI
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.8,
            marginBottom: '2.5rem',
            maxWidth: 600,
            margin: '0 auto 2.5rem',
          }}>
            Practice mock interviews with real-time AI feedback, analyze your resume,
            track your progress, and land your dream job with confidence.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
              Start Free Practice <ChevronRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '2rem 0 4rem', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
          {stats.map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '2.5rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
                marginBottom: '0.5rem',
              }}>
                {stat.value}
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '6rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
              Everything You Need to{' '}
              <span style={{
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-warning))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Succeed
              </span>
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
              A complete interview preparation toolkit powered by cutting-edge AI
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="card" style={{
                  animationDelay: `${i * 0.1}s`,
                  display: 'flex',
                  gap: '1rem',
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${feature.color}18`,
                    border: `1px solid ${feature.color}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={22} color={feature.color} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem' }}>{feature.title}</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '6rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(0,212,255,0.05))',
        borderTop: '1px solid var(--color-border)',
      }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          Ready to Land Your Dream Job?
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
          Join thousands of successful candidates who mastered interviews with AI
        </p>
        <Link to="/register" className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 3rem' }}>
          Start Practicing Now — It's Free <ChevronRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Brain size={16} color="var(--color-primary)" />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--color-primary)' }}>InterviewAI</span>
        </div>
        <p>© 2024 InterviewAI. Built to help you succeed.</p>
      </footer>
    </div>
  );
};

export default Landing;
