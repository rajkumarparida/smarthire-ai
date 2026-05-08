import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const steps = ['Personal', 'Company', 'Review'];

export default function RecruiterOnboarding() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(0);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    phone:'', designation:'', city:'',
    company:'', companySize:'', industry:'', website:'', linkedin:'',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const validateStep = () => {
    if (step === 0 && (!form.phone || !form.designation || !form.city))
      return 'Please fill all personal details';
    if (step === 1 && (!form.company || !form.companySize || !form.industry))
      return 'Please fill all company details';
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(''); setStep(s => s + 1);
  };

  const handleFinish = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/onboarding/recruiter', form);
      navigate('/recruiter/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <h2 style={s.title}>🏢 Company Setup</h2>
          <p style={s.sub}>Complete your recruiter profile to continue</p>
        </div>

        <div style={s.progressWrap}>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill,
              width:`${((step+1)/steps.length)*100}%` }} />
          </div>
          <div style={s.stepLabels}>
            {steps.map((label, i) => (
              <span key={label} style={{
                ...s.stepLabel,
                color: i <= step ? '#4f46e5' : '#94a3b8',
                fontWeight: i === step ? 700 : 400,
              }}>
                {i < step ? '✓ ' : ''}{label}
              </span>
            ))}
          </div>
        </div>

        {error && <div style={s.errorBox}>⚠️ {error}</div>}

        {/* ── Step 0: Personal ─────────────────────────────── */}
        {step === 0 && (
          <div>
            <Field label="Phone Number">
              <input style={s.input} placeholder="+91 9999999999"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </Field>
            <Field label="Your Designation">
              <input style={s.input} placeholder="HR Manager / Talent Acquisition"
                value={form.designation} onChange={e => set('designation', e.target.value)} />
            </Field>
            <Field label="City">
              <input style={s.input} placeholder="Mumbai"
                value={form.city} onChange={e => set('city', e.target.value)} />
            </Field>
            <Field label="LinkedIn (optional)">
              <input style={s.input} placeholder="https://linkedin.com/in/yourname"
                value={form.linkedin} onChange={e => set('linkedin', e.target.value)} />
            </Field>
          </div>
        )}

        {/* ── Step 1: Company ──────────────────────────────── */}
        {step === 1 && (
          <div>
            <Field label="Company Name">
              <input style={s.input} placeholder="TechCorp India"
                value={form.company} onChange={e => set('company', e.target.value)} />
            </Field>
            <Field label="Company Size">
              <select style={s.input} value={form.companySize}
                onChange={e => set('companySize', e.target.value)}>
                <option value="">Select size</option>
                <option value="1-10">1–10 employees</option>
                <option value="11-50">11–50 employees</option>
                <option value="51-200">51–200 employees</option>
                <option value="201-500">201–500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </Field>
            <Field label="Industry">
              <select style={s.input} value={form.industry}
                onChange={e => set('industry', e.target.value)}>
                <option value="">Select industry</option>
                <option value="IT & Software">IT & Software</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Company Website (optional)">
              <input style={s.input} placeholder="https://techcorp.com"
                value={form.website} onChange={e => set('website', e.target.value)} />
            </Field>
          </div>
        )}

        {/* ── Step 2: Review ───────────────────────────────── */}
        {step === 2 && (
          <div style={s.summaryBox}>
            <p style={s.summaryTitle}>✅ Review Your Details</p>
            {[
              ['📞 Phone',       form.phone],
              ['💼 Designation', form.designation],
              ['📍 City',        form.city],
              ['🏢 Company',     form.company],
              ['👥 Size',        form.companySize],
              ['🏭 Industry',    form.industry],
              ['🌐 Website',     form.website || 'Not provided'],
            ].map(([label, value]) => (
              <div key={label} style={s.summaryRow}>
                <span style={s.summaryLabel}>{label}</span>
                <span style={s.summaryValue}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={s.btnRow}>
          {step > 0 && (
            <button style={s.btnBack}
              onClick={() => { setStep(s => s - 1); setError(''); }}>
              ← Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button style={s.btnNext} onClick={next}>Next →</button>
          ) : (
            <button
              style={{ ...s.btnNext, background:'#16a34a',
                opacity: loading ? 0.7 : 1 }}
              onClick={handleFinish} disabled={loading}>
              {loading ? 'Saving...' : '✅ Finish & Go to Dashboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:'block', fontSize:13, fontWeight:600,
      color:'#374151', marginBottom:6 }}>{label}</label>
    {children}
  </div>
);

const s = {
  page:         { minHeight:'100vh', background:'linear-gradient(135deg,#667eea,#764ba2)',
                  display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  card:         { background:'#fff', borderRadius:16, padding:'32px 28px',
                  width:'100%', maxWidth:460,
                  boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  header:       { textAlign:'center', marginBottom:20 },
  title:        { margin:0, fontSize:22, fontWeight:800, color:'#1e293b' },
  sub:          { margin:'4px 0 0', color:'#64748b', fontSize:13 },
  progressWrap: { marginBottom:20 },
  progressBar:  { height:6, background:'#e2e8f0', borderRadius:99, marginBottom:8 },
  progressFill: { height:6, background:'#4f46e5', borderRadius:99,
                  transition:'width 0.4s ease' },
  stepLabels:   { display:'flex', justifyContent:'space-between' },
  stepLabel:    { fontSize:11 },
  input:        { width:'100%', padding:'10px 12px', borderRadius:8,
                  border:'1.5px solid #e2e8f0', fontSize:14,
                  boxSizing:'border-box', outline:'none' },
  summaryBox:   { background:'#f8fafc', borderRadius:10, padding:16,
                  border:'1px solid #e2e8f0', marginBottom:8 },
  summaryTitle: { margin:'0 0 12px', fontWeight:700, color:'#1e293b', fontSize:15 },
  summaryRow:   { display:'flex', justifyContent:'space-between',
                  padding:'6px 0', borderBottom:'1px solid #f1f5f9' },
  summaryLabel: { fontSize:13, color:'#64748b' },
  summaryValue: { fontSize:13, fontWeight:600, color:'#1e293b' },
  btnRow:       { display:'flex', gap:8, marginTop:20 },
  btnBack:      { flex:1, padding:11, background:'#f1f5f9', color:'#475569',
                  border:'none', borderRadius:8, fontSize:14,
                  fontWeight:600, cursor:'pointer' },
  btnNext:      { flex:2, padding:11, background:'#4f46e5', color:'#fff',
                  border:'none', borderRadius:8, fontSize:14,
                  fontWeight:700, cursor:'pointer' },
  errorBox:     { background:'#fef2f2', color:'#dc2626', padding:'10px 14px',
                  borderRadius:8, marginBottom:12, fontSize:13 },
};