import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'candidate'
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);
  const navigate = useNavigate();

  const checkStrength = (pwd) => {
    let s = 0;
    if (pwd.length >= 8)           s++;
    if (/[A-Z]/.test(pwd))        s++;
    if (/[0-9]/.test(pwd))        s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    setStrength(s);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'password') checkStrength(e.target.value);
    if (e.target.name === 'email' || e.target.name === 'role') setError('');
  };

  // Block free email for recruiter in real time
  const blockedDomains = [
    'gmail.com','yahoo.com','hotmail.com','outlook.com',
    'live.com','icloud.com','aol.com','rediffmail.com'
  ];
  const domain = form.email.split('@')[1]?.toLowerCase();
  const emailBlocked = form.role === 'recruiter' && domain && blockedDomains.includes(domain);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailBlocked) return;
    setError(''); setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login?registered=true');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['#e2e8f0','#ef4444','#f59e0b','#3b82f6','#16a34a'];
  const strengthLabels = ['','Weak','Fair','Good','Strong'];

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <span style={s.brandIcon}>🤖</span>
          <h1 style={s.brandName}>SmartHire AI</h1>
          <p style={s.brandSub}>Create your account</p>
        </div>

        {error && <div style={s.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role toggle */}
          <div style={s.roleToggle}>
            {['candidate','recruiter'].map(r => (
              <button key={r} type="button"
                style={{ ...s.roleBtn,
                  background: form.role === r ? '#4f46e5' : 'transparent',
                  color:      form.role === r ? '#fff'    : '#64748b',
                }}
                onClick={() => setForm({ ...form, role: r })}>
                {r === 'candidate' ? '👤 Candidate' : '🏢 Recruiter'}
              </button>
            ))}
          </div>

          <div style={s.field}>
            <label style={s.label}>Full Name</label>
            <input style={s.input} name="name"
              placeholder="John Doe"
              onChange={handleChange} required />
          </div>

          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input style={{
                ...s.input,
                borderColor: emailBlocked ? '#ef4444' : '#e2e8f0'
              }}
              name="email" type="email"
              placeholder={form.role === 'recruiter'
                ? 'name@company.com'
                : 'name@gmail.com'}
              onChange={handleChange} required />
            {emailBlocked && (
              <p style={s.fieldError}>
                ❌ Recruiters cannot use {domain}. Use your company email.
              </p>
            )}
            {form.role === 'recruiter' && !emailBlocked && domain && (
              <p style={s.fieldSuccess}>✅ Company email accepted</p>
            )}
            {form.role === 'recruiter' && !domain && (
              <p style={s.fieldHint}>⚠️ Must use company email (not Gmail/Yahoo etc.)</p>
            )}
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input style={s.input} name="password" type="password"
              placeholder="Min 8 characters"
              onChange={handleChange} required />
            {form.password && (
              <div style={{ marginTop: 6 }}>
                <div style={s.strengthTrack}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      ...s.strengthBar,
                      background: i <= strength
                        ? strengthColors[strength]
                        : '#e2e8f0'
                    }} />
                  ))}
                </div>
                <p style={{ fontSize:11, color: strengthColors[strength], margin:'4px 0 0' }}>
                  {strengthLabels[strength]}
                </p>
              </div>
            )}
          </div>

          <button
            style={{
              ...s.btn,
              opacity:  (loading || emailBlocked) ? 0.6 : 1,
              cursor:   (loading || emailBlocked) ? 'not-allowed' : 'pointer',
            }}
            type="submit"
            disabled={loading || emailBlocked}>
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account?{' '}
          <Link to="/login" style={s.link}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page:          { minHeight:'100vh', background:'linear-gradient(135deg,#667eea,#764ba2)',
                   display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  card:          { background:'#fff', borderRadius:16, padding:'36px 32px',
                   width:'100%', maxWidth:420,
                   boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  brand:         { textAlign:'center', marginBottom:24 },
  brandIcon:     { fontSize:36 },
  brandName:     { margin:'4px 0 0', fontSize:24, fontWeight:800, color:'#1e293b' },
  brandSub:      { margin:'4px 0 0', color:'#64748b', fontSize:14 },
  roleToggle:    { display:'flex', background:'#f1f5f9', borderRadius:10,
                   padding:4, marginBottom:20, gap:4 },
  roleBtn:       { flex:1, padding:'8px 0', border:'none', borderRadius:8,
                   cursor:'pointer', fontSize:14, fontWeight:600,
                   transition:'all 0.2s' },
  field:         { marginBottom:16 },
  label:         { display:'block', fontSize:13, fontWeight:600,
                   color:'#374151', marginBottom:6 },
  input:         { width:'100%', padding:'11px 14px', borderRadius:8,
                   border:'1.5px solid #e2e8f0', fontSize:14,
                   boxSizing:'border-box', outline:'none',
                   transition:'border 0.2s' },
  fieldError:    { fontSize:12, color:'#ef4444', margin:'4px 0 0' },
  fieldSuccess:  { fontSize:12, color:'#16a34a', margin:'4px 0 0' },
  fieldHint:     { fontSize:12, color:'#d97706', margin:'4px 0 0' },
  strengthTrack: { display:'flex', gap:4, marginTop:4 },
  strengthBar:   { flex:1, height:4, borderRadius:99 },
  btn:           { width:'100%', padding:13, background:'#4f46e5', color:'#fff',
                   border:'none', borderRadius:10, fontSize:15,
                   fontWeight:700, marginTop:4 },
  errorBox:      { background:'#fef2f2', color:'#dc2626', padding:'10px 14px',
                   borderRadius:8, marginBottom:16, fontSize:13 },
  footer:        { textAlign:'center', marginTop:20, fontSize:13, color:'#64748b' },
  link:          { color:'#4f46e5', fontWeight:600, textDecoration:'none' },
};