import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Mic,
  BarChart2,
  History,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/resume', label: 'Resume', icon: FileText },
  { path: '/interview', label: 'Mock Interview', icon: Mic },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/history', label: 'History', icon: History },
  { path: '/profile', label: 'Profile', icon: User },
];

const MOBILE_QUERY = '(max-width: 768px)';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
};

const Navbar = () => {
  const [collapsedPref, setCollapsed] = useState(false);
  // The drawer remembers the path it was opened on, so navigating closes it automatically
  const [drawerPath, setDrawerPath] = useState(null);
  const isMobile = useIsMobile();
  const collapsed = isMobile ? false : collapsedPref;
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const drawerOpen = drawerPath === location.pathname;
  const setDrawerOpen = (open) => setDrawerPath(open ? location.pathname : null);

  // Lock background scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobile && drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, drawerOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentLabel = navItems.find((n) => n.path === location.pathname)?.label || 'InterviewAI';

  const desktopStyle = {
    width: collapsed ? 72 : 260,
    height: '100vh',
    position: 'sticky',
    top: 0,
    transition: 'width 0.3s ease',
  };
  const mobileStyle = {
    width: 280,
    maxWidth: '85vw',
    height: '100dvh',
    position: 'fixed',
    top: 0,
    left: 0,
    transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.25s ease',
    boxShadow: drawerOpen ? '0 0 40px rgba(0,0,0,0.6)' : 'none',
  };

  return (
    <>
    {isMobile && (
      <header className="mobile-topbar">
        <button
          className="icon-btn"
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          {drawerOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.05rem' }}>{currentLabel}</span>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={18} color="white" />
        </div>
      </header>
    )}
    {isMobile && drawerOpen && (
      <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
    )}
    <nav
      aria-label="Main navigation"
      style={{
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'auto',
        zIndex: 1100,
        flexShrink: 0,
        ...(isMobile ? mobileStyle : desktopStyle),
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        minHeight: 72
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Brain size={22} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2
            }}>
              InterviewAI
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', letterSpacing: 1 }}>
              PREP PLATFORM
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 12,
                textDecoration: 'none',
                color: isActive ? 'white' : 'var(--color-text-muted)',
                background: isActive
                  ? 'linear-gradient(135deg, var(--color-primary), #9c94ff)'
                  : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(108, 99, 255, 0.08)';
                  e.currentTarget.style.color = 'var(--color-text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!collapsed && label}
              {isActive && !collapsed && (
                <Sparkles size={14} style={{ marginLeft: 'auto', opacity: 0.7 }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div style={{
        padding: '1rem 0.75rem',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {!collapsed && user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'var(--color-card)',
            borderRadius: 12,
            border: '1px solid var(--color-border)'
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'white',
              flexShrink: 0,
            }}>
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 12,
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            width: '100%',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 82, 82, 0.1)';
            e.currentTarget.style.color = 'var(--color-error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          <LogOut size={20} style={{ flexShrink: 0 }} />
          {!collapsed && 'Logout'}
        </button>

        {!isMobile && <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.6rem',
            borderRadius: 10,
            border: '1px solid var(--color-border)',
            background: 'var(--color-card)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            alignSelf: 'center',
            width: collapsed ? '40px' : '100%',
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={18} /> : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <ChevronLeft size={18} /> Collapse
            </span>
          )}
        </button>}
      </div>
    </nav>
    </>
  );
};

export default Navbar;
