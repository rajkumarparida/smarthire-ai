import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../context/AuthContext';
import { useEffect }   from 'react';

export default function Landing() {
  const navigate   = useNavigate();
  const { user }   = useAuth();

  // Already logged in → skip landing
  useEffect(() => {
    if (user) {
      navigate(user.role === 'recruiter'
        ? '/recruiter/dashboard'
        : '/candidate/dashboard');
    }
  }, [user, navigate]);

  return (
    <div style={s.page}>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navBrand}>
          <span style={s.navIcon}>🤖</span>
          <span style={s.navName}>SmartHire AI</span>
        </div>
        <div style={s.navLinks}>
          <button style={s.navLink}
            onClick={() => navigate('/login')}>
            Login
          </button>
          <button style={s.navBtn}
            onClick={() => navigate('/register')}>
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────── */}
      <section style={s.hero}>
        <div style={s.heroContent}>
          <div style={s.heroBadge}>🚀 AI-Powered Recruitment Platform</div>
          <h1 style={s.heroTitle}>
            Hire Smarter,<br />
            <span style={s.heroHighlight}>Not Harder</span>
          </h1>
          <p style={s.heroSub}>
            Automate resume screening, conduct AI-evaluated exams,
            and rank candidates — all in one platform.
          </p>

          {/* ── Two CTA cards ───────────────────────────────── */}
          <div style={s.ctaRow}>
            <div style={s.ctaCard}
              onClick={() => navigate('/register?role=recruiter')}>
              <div style={s.ctaIcon}>🏢</div>
              <h3 style={s.ctaTitle}>I'm a Recruiter</h3>
              <p style={s.ctaSub}>
                Post jobs, screen candidates automatically,
                manage hiring pipeline
              </p>
              <div style={s.ctaBtn}>Start Hiring →</div>
            </div>

            <div style={{ ...s.ctaCard, ...s.ctaCardAlt }}
              onClick={() => navigate('/register?role=candidate')}>
              <div style={s.ctaIcon}>👤</div>
              <h3 style={s.ctaTitle}>I'm a Candidate</h3>
              <p style={s.ctaSub}>
                Apply to jobs, take AI-evaluated tests,
                track your application status
              </p>
              <div style={{ ...s.ctaBtn, ...s.ctaBtnAlt }}>
                Find Jobs →
              </div>
            </div>
          </div>

          <p style={s.loginHint}>
            Already have an account?{' '}
            <span style={s.loginLink}
              onClick={() => navigate('/login')}>
              Login here
            </span>
          </p>
        </div>

        {/* ── Stats ───────────────────────────────────────────── */}
        <div style={s.statsRow}>
          {[
            { value: 'AI',    label: 'Resume Screening'   },
            { value: 'MCQ',   label: 'Auto Exam System'   },
            { value: 'OTP',   label: 'Secure Login'       },
            { value: '100%',  label: 'Free to Use'        },
          ].map(stat => (
            <div key={stat.label} style={s.statCard}>
              <p style={s.statValue}>{stat.value}</p>
              <p style={s.statLabel}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────── */}
      <section style={s.features}>
        <h2 style={s.sectionTitle}>How SmartHire AI Works</h2>
        <div style={s.featureGrid}>
          {[
            { icon:'📄', title:'Resume Upload',       desc:'Candidates upload resumes. AI extracts skills and scores them against job requirements automatically.' },
            { icon:'📝', title:'AI Exam System',      desc:'Auto-generated MCQ exams based on job skills. Candidates are evaluated and scored instantly.' },
            { icon:'🎯', title:'Smart Matching',      desc:'AI matches candidate skills to job requirements and ranks all applicants by fit score.' },
            { icon:'📊', title:'Recruiter Dashboard', desc:'View all applicants ranked by AI score. Promote, reject, or move candidates through hiring stages.' },
            { icon:'🔐', title:'OTP Login',           desc:'Secure email-based OTP authentication for both recruiters and candidates.' },
            { icon:'📧', title:'Auto Notifications',  desc:'Candidates get email notifications when new jobs matching their profile are posted.' },
          ].map(f => (
            <div key={f.title} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <h4 style={s.featureTitle}>{f.title}</h4>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section style={s.bottomCta}>
        <h2 style={s.bottomTitle}>Ready to Transform Your Hiring?</h2>
        <p style={s.bottomSub}>
          Join SmartHire AI — free for recruiters and candidates.
        </p>
        <div style={s.bottomBtns}>
          <button style={s.bottomBtnPrimary}
            onClick={() => navigate('/register?role=recruiter')}>
            🏢 Register as Recruiter
          </button>
          <button style={s.bottomBtnSecondary}
            onClick={() => navigate('/register?role=candidate')}>
            👤 Register as Candidate
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={s.footer}>
        <p style={{ margin:0 }}>
          © {new Date().getFullYear()} SmartHire AI — Final Year Project
        </p>
      </footer>

    </div>
  );
}

const s = {
  page:             { fontFamily:'Arial,sans-serif', background:'#fff',
                      minHeight:'100vh' },

  // Navbar
  nav:              { display:'flex', justifyContent:'space-between',
                      alignItems:'center', padding:'16px 40px',
                      background:'rgba(255,255,255,0.95)',
                      backdropFilter:'blur(10px)',
                      borderBottom:'1px solid #f1f5f9',
                      position:'sticky', top:0, zIndex:100 },
  navBrand:         { display:'flex', alignItems:'center', gap:8 },
  navIcon:          { fontSize:28 },
  navName:          { fontSize:20, fontWeight:800, color:'#1e293b' },
  navLinks:         { display:'flex', alignItems:'center', gap:12 },
  navLink:          { background:'none', border:'none', color:'#64748b',
                      cursor:'pointer', fontSize:15, fontWeight:500, padding:'8px 12px' },
  navBtn:           { padding:'8px 20px', background:'#4f46e5', color:'#fff',
                      border:'none', borderRadius:8, cursor:'pointer',
                      fontSize:14, fontWeight:600 },

  // Hero
  hero:             { background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
                      padding:'64px 40px 40px', textAlign:'center' },
  heroContent:      { maxWidth:720, margin:'0 auto' },
  heroBadge:        { display:'inline-block', background:'rgba(255,255,255,0.2)',
                      color:'#fff', padding:'6px 16px', borderRadius:99,
                      fontSize:13, fontWeight:600, marginBottom:20,
                      backdropFilter:'blur(10px)' },
  heroTitle:        { fontSize:52, fontWeight:900, color:'#fff',
                      margin:'0 0 16px', lineHeight:1.1 },
  heroHighlight:    { color:'#fbbf24' },
  heroSub:          { fontSize:18, color:'rgba(255,255,255,0.85)',
                      margin:'0 0 40px', lineHeight:1.6 },

  // CTA Cards
  ctaRow:           { display:'flex', gap:20, justifyContent:'center',
                      flexWrap:'wrap', marginBottom:28 },
  ctaCard:          { background:'#fff', borderRadius:16, padding:'28px 24px',
                      width:240, cursor:'pointer', textAlign:'center',
                      boxShadow:'0 20px 40px rgba(0,0,0,0.15)',
                      transition:'transform 0.2s',
                      border:'2px solid transparent' },
  ctaCardAlt:       { background:'rgba(255,255,255,0.1)',
                      border:'2px solid rgba(255,255,255,0.3)',
                      backdropFilter:'blur(10px)' },
  ctaIcon:          { fontSize:40, marginBottom:12 },
  ctaTitle:         { margin:'0 0 8px', fontSize:18, fontWeight:700,
                      color:'#1e293b' },
  ctaSub:           { margin:'0 0 20px', fontSize:13, color:'#64748b',
                      lineHeight:1.5 },
  ctaBtn:           { display:'inline-block', padding:'10px 24px',
                      background:'#4f46e5', color:'#fff', borderRadius:8,
                      fontWeight:600, fontSize:14 },
  ctaBtnAlt:        { background:'#fff', color:'#4f46e5' },

  loginHint:        { color:'rgba(255,255,255,0.8)', fontSize:14 },
  loginLink:        { color:'#fbbf24', fontWeight:600, cursor:'pointer' },

  // Stats
  statsRow:         { display:'flex', justifyContent:'center', gap:0,
                      maxWidth:600, margin:'32px auto 0',
                      background:'rgba(255,255,255,0.1)',
                      borderRadius:16, overflow:'hidden',
                      backdropFilter:'blur(10px)' },
  statCard:         { flex:1, padding:'20px 16px', textAlign:'center',
                      borderRight:'1px solid rgba(255,255,255,0.2)' },
  statValue:        { margin:0, fontSize:22, fontWeight:800, color:'#fff' },
  statLabel:        { margin:'4px 0 0', fontSize:12,
                      color:'rgba(255,255,255,0.7)' },

  // Features
  features:         { padding:'64px 40px', background:'#f8fafc' },
  sectionTitle:     { textAlign:'center', fontSize:32, fontWeight:800,
                      color:'#1e293b', marginBottom:40 },
  featureGrid:      { display:'grid',
                      gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',
                      gap:24, maxWidth:960, margin:'0 auto' },
  featureCard:      { background:'#fff', padding:28, borderRadius:12,
                      boxShadow:'0 2px 12px rgba(0,0,0,0.07)' },
  featureIcon:      { fontSize:36, marginBottom:14 },
  featureTitle:     { margin:'0 0 10px', fontSize:17, fontWeight:700,
                      color:'#1e293b' },
  featureDesc:      { margin:0, fontSize:14, color:'#64748b', lineHeight:1.6 },

  // Bottom CTA
  bottomCta:        { padding:'64px 40px', textAlign:'center',
                      background:'#1e293b' },
  bottomTitle:      { margin:'0 0 12px', fontSize:32, fontWeight:800,
                      color:'#fff' },
  bottomSub:        { margin:'0 0 32px', color:'#94a3b8', fontSize:16 },
  bottomBtns:       { display:'flex', gap:16, justifyContent:'center',
                      flexWrap:'wrap' },
  bottomBtnPrimary: { padding:'14px 32px', background:'#4f46e5', color:'#fff',
                      border:'none', borderRadius:10, fontSize:16,
                      fontWeight:700, cursor:'pointer' },
  bottomBtnSecondary:{ padding:'14px 32px', background:'transparent',
                       color:'#fff', border:'2px solid #475569',
                       borderRadius:10, fontSize:16,
                       fontWeight:700, cursor:'pointer' },

  // Footer
  footer:           { padding:'20px 40px', background:'#0f172a',
                      textAlign:'center', color:'#475569', fontSize:13 },
};