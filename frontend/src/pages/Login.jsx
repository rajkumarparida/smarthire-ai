import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation }   from 'react-router-dom';
import api          from '../utils/api';
import { useAuth }  from '../context/AuthContext';

const OTP_SECONDS = 300; // 5 minutes

export default function Login() {
  const [step, setStep]         = useState(1);
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [registered, setRegistered] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft]   = useState(OTP_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const [canResend, setCanResend] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    if (new URLSearchParams(location.search).get('registered'))
      setRegistered(true);
  }, [location]);

  // ── Countdown timer ──────────────────────────────────────────
  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft <= 0) {
      setCanResend(true);
      setTimerActive(false);
      return;
    }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, timerActive]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2,'0');
    const s = (secs % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  };

  const startTimer = () => {
    setTimeLeft(OTP_SECONDS);
    setTimerActive(true);
    setCanResend(false);
  };

  // ── Send OTP ─────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { email });
      setUserName(res.data.name);
      setStep(2);
      startTimer();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      login(res.data);

      // Check onboarding status
      const ob = await api.get('/onboarding/status');
      if (!ob.data.completed) {
        navigate(res.data.role === 'recruiter'
          ? '/onboarding/recruiter'
          : '/onboarding/candidate');
      } else {
        navigate(res.data.role === 'recruiter'
          ? '/recruiter/dashboard'
          : '/candidate/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────
  const handleResend = async () => {
    if (!canResend) return;
    setError(''); setOtp('');
    try {
      await api.post('/auth/send-otp', { email });
      startTimer();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend');
    }
  };

  // OTP input boxes (6 separate boxes)
  const handleOtpChange = (val) => {
    const clean = val.replace(/\D/g,'').slice(0,6);
    setOtp(clean);
  };

  const timerColor = timeLeft <= 60 ? '#ef4444' : '#4f46e5';

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.brand}>
          <span style={s.brandIcon}>🤖</span>
          <h1 style={s.brandName}>SmartHire AI</h1>
          <p style={s.brandSub}>
            {step === 1 ? 'Login to your account' : `OTP sent to ${email}`}
          </p>
        </div>

        {registered && step === 1 && (
          <div style={s.successBox}>
            🎉 Account created! Login with your email OTP.
          </div>
        )}

        {/* Step progress */}
        <div style={s.stepRow}>
          {['Email','Verify OTP'].map((label, i) => (
            <div key={label} style={s.stepItem}>
              <div style={{
                ...s.stepCircle,
                background: i < step ? '#4f46e5' : '#f1f5f9',
                color:      i < step ? '#fff'    : '#94a3b8',
                border: i + 1 === step ? '2px solid #4f46e5' : '2px solid transparent',
              }}>
                {i < step - 1 ? '✓' : i + 1}
              </div>
              <p style={{ ...s.stepLabel,
                color: i < step ? '#4f46e5' : '#94a3b8',
                fontWeight: i + 1 === step ? 700 : 400 }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {error && <div style={s.errorBox}>⚠️ {error}</div>}

        {/* ── Step 1 ──────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input style={s.input} type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                required />
            </div>
            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              type="submit" disabled={loading}>
              {loading
                ? <span>Sending OTP <span style={s.spinner}>⏳</span></span>
                : 'Send OTP →'}
            </button>
          </form>
        )}

        {/* ── Step 2 ──────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div style={s.greetBox}>
              👋 Hi <strong>{userName}</strong>! Enter the OTP from your email.
            </div>

            {/* OTP input */}
            <div style={s.field}>
              <label style={s.label}>6-Digit OTP</label>
              <input
                style={s.otpInput}
                type="text" inputMode="numeric"
                placeholder="• • • • • •"
                value={otp}
                onChange={e => handleOtpChange(e.target.value)}
                maxLength={6} required />
            </div>

            {/* Timer */}
            <div style={s.timerRow}>
              <div style={s.timerBox}>
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="17"
                    fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle cx="20" cy="20" r="17"
                    fill="none" stroke={timerColor} strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 17}`}
                    strokeDashoffset={`${2 * Math.PI * 17 * (1 - timeLeft / OTP_SECONDS)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)" />
                </svg>
                <span style={{ ...s.timerText, color: timerColor }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div>
                <p style={{ margin:0, fontSize:13, color:'#64748b' }}>
                  {canResend ? 'OTP expired.' : 'OTP expires in'}
                </p>
                <button type="button"
                  style={{
                    ...s.resendBtn,
                    opacity: canResend ? 1 : 0.4,
                    cursor:  canResend ? 'pointer' : 'not-allowed',
                    color:   canResend ? '#4f46e5' : '#94a3b8',
                  }}
                  onClick={handleResend}
                  disabled={!canResend}>
                  {canResend ? '🔄 Resend OTP' : 'Resend available after timer'}
                </button>
              </div>
            </div>

            <button
              style={{
                ...s.btn,
                opacity: (loading || otp.length < 6) ? 0.6 : 1,
                cursor:  (loading || otp.length < 6) ? 'not-allowed' : 'pointer',
              }}
              type="submit"
              disabled={loading || otp.length < 6}>
              {loading ? 'Verifying...' : 'Verify & Login ✓'}
            </button>

            <button type="button" style={s.backBtn}
              onClick={() => { setStep(1); setOtp(''); setError('');
                               setTimerActive(false); }}>
              ← Use different email
            </button>
          </form>
        )}

        <p style={s.footer}>
          No account?{' '}
          <Link to="/register" style={s.link}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight:'100vh', background:'linear-gradient(135deg,#667eea,#764ba2)',
                display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  card:       { background:'#fff', borderRadius:16, padding:'36px 32px',
                width:'100%', maxWidth:420,
                boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  brand:      { textAlign:'center', marginBottom:20 },
  brandIcon:  { fontSize:36 },
  brandName:  { margin:'4px 0 0', fontSize:24, fontWeight:800, color:'#1e293b' },
  brandSub:   { margin:'4px 0 0', color:'#64748b', fontSize:14 },
  stepRow:    { display:'flex', justifyContent:'center', gap:40, marginBottom:20 },
  stepItem:   { display:'flex', flexDirection:'column', alignItems:'center', gap:4 },
  stepCircle: { width:32, height:32, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:700, fontSize:14 },
  stepLabel:  { fontSize:12, margin:0 },
  field:      { marginBottom:16 },
  label:      { display:'block', fontSize:13, fontWeight:600,
                color:'#374151', marginBottom:6 },
  input:      { width:'100%', padding:'12px 14px', borderRadius:8,
                border:'1.5px solid #e2e8f0', fontSize:14,
                boxSizing:'border-box', outline:'none' },
  otpInput:   { width:'100%', padding:'16px 14px', borderRadius:8,
                border:'2px solid #4f46e5', fontSize:28, fontWeight:800,
                textAlign:'center', letterSpacing:12, color:'#4f46e5',
                boxSizing:'border-box', outline:'none' },
  timerRow:   { display:'flex', alignItems:'center', gap:14,
                background:'#f8fafc', borderRadius:10, padding:'12px 16px',
                marginBottom:16 },
  timerBox:   { position:'relative', width:40, height:40, flexShrink:0 },
  timerText:  { position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                fontSize:9, fontWeight:800 },
  resendBtn:  { background:'none', border:'none', fontSize:13,
                fontWeight:600, padding:0, marginTop:4 },
  btn:        { width:'100%', padding:13, background:'#4f46e5', color:'#fff',
                border:'none', borderRadius:10, fontSize:15,
                fontWeight:700, cursor:'pointer', marginTop:4 },
  backBtn:    { width:'100%', padding:10, background:'none', color:'#64748b',
                border:'none', fontSize:13, cursor:'pointer', marginTop:8 },
  greetBox:   { background:'#f0f4ff', borderRadius:8, padding:'10px 14px',
                fontSize:14, color:'#1e293b', marginBottom:16 },
  errorBox:   { background:'#fef2f2', color:'#dc2626', padding:'10px 14px',
                borderRadius:8, marginBottom:16, fontSize:13 },
  successBox: { background:'#f0fdf4', color:'#16a34a', padding:'10px 14px',
                borderRadius:8, marginBottom:16, fontSize:13 },
  footer:     { textAlign:'center', marginTop:20, fontSize:13, color:'#64748b' },
  link:       { color:'#4f46e5', fontWeight:600, textDecoration:'none' },
};