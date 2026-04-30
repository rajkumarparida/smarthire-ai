import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  // Hide navbar on login/register pages
  const hide = ['/', '/login', '/register'];
  if (!user || hide.includes(location.pathname)) return null;

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}
        onClick={() => navigate(
          user.role === 'recruiter'
            ? '/recruiter/dashboard'
            : '/candidate/dashboard'
        )}>
        🤖 SmartHire AI
      </div>

      <div style={styles.links}>
        {user.role === 'candidate' && (
          <>
            <NavBtn label="Dashboard" path="/candidate/dashboard" navigate={navigate} location={location} />
            <NavBtn label="Browse Jobs" path="/candidate/jobs"     navigate={navigate} location={location} />
          </>
        )}
        {user.role === 'recruiter' && (
          <>
            <NavBtn label="Dashboard" path="/recruiter/dashboard" navigate={navigate} location={location} />
            <NavBtn label="Post Job"  path="/recruiter/post-job"  navigate={navigate} location={location} />
          </>
        )}
      </div>

      <div style={styles.right}>
        <span style={styles.userName}>👤 {user.name}</span>
        <span style={styles.roleBadge}>{user.role}</span>
        <button style={styles.btnLogout}
          onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const NavBtn = ({ label, path, navigate, location }) => (
  <button
    style={{
      ...styles.navBtn,
      background:  location.pathname === path ? '#4f46e5' : 'transparent',
      color:       location.pathname === path ? '#fff'    : '#cbd5e1',
    }}
    onClick={() => navigate(path)}>
    {label}
  </button>
);

const styles = {
  nav:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0 28px', height: 56, background: '#1e293b',
              position: 'sticky', top: 0, zIndex: 100 },
  brand:    { color: '#fff', fontWeight: 800, fontSize: 18, cursor: 'pointer' },
  links:    { display: 'flex', gap: 4 },
  right:    { display: 'flex', alignItems: 'center', gap: 10 },
  userName: { color: '#94a3b8', fontSize: 13 },
  roleBadge:{ padding: '2px 10px', background: '#334155', color: '#7dd3fc',
              borderRadius: 99, fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase' },
  navBtn:   { padding: '6px 14px', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  btnLogout:{ padding: '6px 14px', background: '#ef4444', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
};