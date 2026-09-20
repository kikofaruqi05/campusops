import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
  { label: 'Events', path: '/events' },
  { label: 'My Tasks', path: '/tasks' },
  ...(user?.role !== 'committee_member' ? [{ label: 'Budget', path: '/budget' }] : []),
  { label: 'Calendar', path: '/calendar' },
  { label: 'Notes', path: '/notes' },
  ...(user?.role !== 'committee_member' ? [{ label: 'Members', path: '/members' }] : []),
];

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.navbar}>
      {/* Left Logo */}
      <div style={{
  ...styles.logo,
  color: location.pathname === '/dashboard' ? '#d97706' : '#ffffff',
}} onClick={() => navigate('/dashboard')}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="white"
          style={{ marginRight: '0.5rem', flexShrink: 0 }}
        >
          <path d="M12 2L2 9l10 13L22 9 12 2z" />
        </svg>
        CampusOps
      </div>

      {/* Middle Nav links */}
      <div style={styles.links}>
        {navLinks.map((link) => (
          <button
            key={link.path}
            style={isActive(link.path) ? { ...styles.link, ...styles.linkActive } : styles.link}
            onClick={() => navigate(link.path)}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Right user info and sign out */}
<div style={styles.right}>
  <div style={styles.userInfo}>
    {user?.society && (
      <span style={styles.societyBadge}>{user.society}</span>
    )}
    <span style={styles.userName}>{user?.full_name}</span>
  </div>
  <button style={styles.signOutBtn} onClick={handleLogout}>
    Sign out
  </button>
</div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#111111',
    padding: '0 2.5rem',
    height: '88px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid #2a2a2a',
  },
  logo: {
    fontSize: '2.2rem',
    fontWeight: '800',
    color: '#ffffff',
    cursor: 'pointer',
    letterSpacing: '-1px',
    minWidth: '160px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    fontFamily: "'Outfit', sans-serif",
  },
  links: {
    display: 'flex',
    alignItems: 'stretch',
    height: '88px',
  },
  link: {
  background: 'transparent',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '0',
  borderBottom: '3px solid transparent',
  color: '#6b7280',
  fontSize: '1.1rem',
  fontWeight: '500',
  cursor: 'pointer',
  padding: '0 1.4rem',
  letterSpacing: '0.01em',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  outline: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  appearance: 'none',
  boxShadow: 'none',
  WebkitTapHighlightColor: 'transparent',
  fontFamily: "'Jost', sans-serif",
},
  linkActive: {
    color: '#e6e0d9',
    backgroundColor: '#d97706',
    fontWeight: '700',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    flexShrink: 0,
    justifyContent: 'flex-end',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#d97706',
    textTransform: 'uppercase',
  },
  signOutBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #ffffff',
    color: '#ffffff',
    padding: '0.45rem 1.1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.01em',
  },
  userInfo: {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.15rem',
},
societyBadge: {
  fontSize: '0.72rem',
  fontWeight: '700',
  color: '#9ca3af',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
},
};

export default Navbar;