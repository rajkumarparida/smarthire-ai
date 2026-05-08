import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const steps = ['Personal', 'Education', 'Skills', 'Links'];

// ── Skill suggestions dictionary ──────────────────────────────────
const SKILL_SUGGESTIONS = [
  'JavaScript','Python','Java','C++','C#','TypeScript','Go','Rust',
  'React','Angular','Vue.js','Next.js','Redux','Tailwind CSS','Bootstrap',
  'Node.js','Express.js','Django','Flask','FastAPI','Spring Boot',
  'MongoDB','MySQL','PostgreSQL','Redis','Firebase','SQLite',
  'Git','Docker','Kubernetes','AWS','Azure','GCP','Linux',
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','NLP','OpenCV',
  'REST API','GraphQL','Figma','Agile','Scrum','Postman',
  'React Native','Flutter','Swift','Kotlin','Android','iOS',
];

const PASSING_YEARS = Array.from({ length: 15 }, (_, i) =>
  (new Date().getFullYear() + 2 - i).toString()
);

const COUNTRIES = [
  { code: 'IN', name: 'India 🇮🇳',    dial: '+91', maxLen: 10 },
  { code: 'US', name: 'USA 🇺🇸',       dial: '+1',  maxLen: 10 },
  { code: 'GB', name: 'UK 🇬🇧',        dial: '+44', maxLen: 10 },
  { code: 'AE', name: 'UAE 🇦🇪',       dial: '+971',maxLen: 9  },
  { code: 'SG', name: 'Singapore 🇸🇬', dial: '+65', maxLen: 8  },
  { code: 'AU', name: 'Australia 🇦🇺', dial: '+61', maxLen: 9  },
  { code: 'CA', name: 'Canada 🇨🇦',    dial: '+1',  maxLen: 10 },
  { code: 'DE', name: 'Germany 🇩🇪',   dial: '+49', maxLen: 11 },
];

export default function CandidateOnboarding() {
  const navigate       = useNavigate();
  const [step, setStep]       = useState(0);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Phone
  const [country, setCountry]       = useState(COUNTRIES[0]);
  const [phone, setPhone]           = useState('');
  const [phoneOtp, setPhoneOtp]     = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // City
  const [city, setCityVal]          = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const cityTimer = useRef(null);

 // College & University
const [college, setCollege]               = useState('');
const [collegeSuggestions, setCollegeSuggestions] = useState([]);
const [collegeLoading, setCollegeLoading] = useState(false);
const collegeTimer = useRef(null);

const [university, setUniversity]               = useState('');
const [universitySuggestions, setUniversitySuggestions] = useState([]);
const [universityLoading, setUniversityLoading] = useState(false);
const universityTimer = useRef(null);

  // Skills
  const [skills, setSkills]         = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const skillInputRef = useRef(null);

  const [form, setForm] = useState({
    gender:'', dob:'', education:'', university:'',
    passingYear:'', experience:'fresher', linkedin:'', github:'',
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
  api.get('/auth/profile').then(res => setUserEmail(res.data.email));
}, []);

  // ── City search via backend ───────────────────────────────────
// const handleCityInput = (val) => {
//   setCityVal(val);
//   clearTimeout(cityTimer.current);
//   if (val.length < 3) { setCitySuggestions([]); return; }
//   setCityLoading(true);
//   cityTimer.current = setTimeout(async () => {
//     try {
//       const res  = await fetch(
//         `${process.env.REACT_APP_API_URL?.replace('/api','')}/api/places/city?q=${encodeURIComponent(val)}`
//       );
//       const data = await res.json();
//       setCitySuggestions(Array.isArray(data) ? data.map(d => d.name) : []);
//     } catch {
//       setCitySuggestions([]);
//     } finally {
//       setCityLoading(false);
//     }
//   }, 400);
// };

// // ── Current location via backend ──────────────────────────────
// const fetchCurrentLocation = () => {
//   if (!navigator.geolocation) return;
//   setCityLoading(true);
//   navigator.geolocation.getCurrentPosition(async (pos) => {
//     try {
//       const { latitude, longitude } = pos.coords;
//       const res  = await fetch(
//         `${process.env.REACT_APP_API_URL?.replace('/api','')}/api/places/reverse?lat=${latitude}&lon=${longitude}`
//       );
//       const data = await res.json();
//       setCityVal(data.city || '');
//       setCitySuggestions([]);
//     } catch {}
//     finally { setCityLoading(false); }
//   }, () => setCityLoading(false));
// };

const handleCityInput = (val) => {
  setCityVal(val);
  clearTimeout(cityTimer.current);
  if (val.length < 3) { setCitySuggestions([]); return; }
  setCityLoading(true);
  cityTimer.current = setTimeout(async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL?.replace('/api','')}/api/places/city?q=${encodeURIComponent(val)}`
      );
      const data = await res.json();
      setCitySuggestions(Array.isArray(data) ? data.map(d => d.name) : []);
    } catch {
      setCitySuggestions([]);
    } finally {
      setCityLoading(false);
    }
  }, 400);
};

const fetchCurrentLocation = () => {
  if (!navigator.geolocation) return;
  setCityLoading(true);
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `${process.env.REACT_APP_API_URL?.replace('/api','')}/api/places/reverse?lat=${latitude}&lon=${longitude}`
      );
      const data = await res.json();
      setCityVal(data.city || '');
      setCitySuggestions([]);
    } catch {}
    finally { setCityLoading(false); }
  }, () => setCityLoading(false));
};

// ── College search via backend ────────────────────────────────
const handleCollegeInput = (val) => {
  setCollege(val);
  clearTimeout(collegeTimer.current);
  if (val.length < 3) { setCollegeSuggestions([]); return; }
  setCollegeLoading(true);
  collegeTimer.current = setTimeout(async () => {
    try {
      const res  = await fetch(
        `${process.env.REACT_APP_API_URL?.replace('/api','')}/api/places/college?q=${encodeURIComponent(val)}`
      );
      const data = await res.json();
      setCollegeSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setCollegeSuggestions([]);
    } finally {
      setCollegeLoading(false);
    }
  }, 500);
};

// ── University search via backend ─────────────────────────────
const handleUniversityInput = (val) => {
  setUniversity(val);
  set('university', val);
  clearTimeout(universityTimer.current);
  if (val.length < 3) { setUniversitySuggestions([]); return; }
  setUniversityLoading(true);
  universityTimer.current = setTimeout(async () => {
    try {
      const res  = await fetch(
        `${process.env.REACT_APP_API_URL?.replace('/api','')}/api/places/university?q=${encodeURIComponent(val)}`
      );
      const data = await res.json();
      setUniversitySuggestions(Array.isArray(data) ? data : []);
    } catch {
      setUniversitySuggestions([]);
    } finally {
      setUniversityLoading(false);
    }
  }, 500);
};

  // ── Skill logic ───────────────────────────────────────────────
  const handleSkillInput = (val) => {
    setSkillInput(val);
    const last = val.split(',').pop().trim();
    if (last.length >= 1) {
      setSkillSuggestions(
        SKILL_SUGGESTIONS.filter(s =>
          s.toLowerCase().includes(last.toLowerCase()) &&
          !skills.includes(s)
        ).slice(0, 8)
      );
    } else {
      setSkillSuggestions([]);
    }
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
    setSkillSuggestions([]);
    skillInputRef.current?.focus();
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.replace(/,$/, '').trim();
      if (val) addSkill(val);
    }
    if (e.key === 'Backspace' && !skillInput && skills.length > 0) {
      setSkills(prev => prev.slice(0, -1));
    }
  };

  const removeSkill = (skill) =>
    setSkills(prev => prev.filter(s => s !== skill));

  // ── Phone OTP (mock — uses email OTP backend) ─────────────────
const sendPhoneOtp = async () => {
  if (phone.length !== country.maxLen) {
    setPhoneError(`Enter valid ${country.maxLen}-digit number`);
    return;
  }
  setPhoneOtpLoading(true); setPhoneError('');
  try {
    await api.post('/auth/send-phone-otp', {
      phone: `${country.dial}${phone}`,
      email: userEmail,
    });
    setPhoneOtpSent(true);
  } catch (err) {
    setPhoneError(err.response?.data?.message || 'Failed to send OTP');
  } finally {
    setPhoneOtpLoading(false);
  }
};

const verifyPhoneOtp = async () => {
  if (phoneOtp.length !== 4) {
    setPhoneError('Enter 6-digit OTP');
    return;
  }
  try {
    await api.post('/auth/verify-phone-otp', {
      phone: `${country.dial}${phone}`,
      otp: phoneOtp,
    });
    setPhoneVerified(true);
    setPhoneError('');
  } catch (err) {
    setPhoneError(err.response?.data?.message || 'Invalid OTP');
  }
};

  // ── Validation ────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 0) {
      if (!phoneVerified) return 'Please verify your phone number';
      if (!form.gender)   return 'Please select gender';
      if (!form.dob)      return 'Please enter date of birth';
      if (!city)          return 'Please enter your city';
    }
    if (step === 1) {
      if (!form.education)    return 'Please select education';
      if (!college)           return 'Please enter college name';
      if (!form.university)   return 'Please enter university name';
      if (!form.passingYear)  return 'Please select passing year';
    }
    if (step === 2 && skills.length === 0)
      return 'Please add at least one skill';
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
    await api.post('/onboarding/candidate', {
      phone:       `${country.dial}${phone}`,
      gender:      form.gender,
      dob:         form.dob,
      city,
      education:   form.education,
      college,           // ← from state
      university,        // ← from state
      passingYear: form.passingYear,
      experience:  form.experience,
      skills,
      linkedin:    form.linkedin,
      github:      form.github,
    });
    navigate('/candidate/dashboard');
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
          <h2 style={s.title}>👤 Complete Your Profile</h2>
          <p style={s.sub}>Required before accessing the dashboard</p>
        </div>

        {/* Progress */}
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
            {/* Phone with country + OTP */}
            <div style={s.field}>
              <label style={s.label}>Phone Number</label>
              <div style={s.phoneRow}>
                <select style={s.countrySelect}
                  value={country.code}
                  onChange={e => {
                    setCountry(COUNTRIES.find(c => c.code === e.target.value));
                    setPhone(''); setPhoneVerified(false); setPhoneOtpSent(false);
                  }}>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.dial})
                    </option>
                  ))}
                </select>
                <input style={{
                    ...s.input, flex:1,
                    borderColor: phoneVerified ? '#16a34a' : '#e2e8f0'
                  }}
                  type="tel" placeholder={`${country.maxLen} digits`}
                  value={phone}
                  maxLength={country.maxLen}
                  onChange={e => {
                    setPhone(e.target.value.replace(/\D/g,'').slice(0, country.maxLen));
                    setPhoneVerified(false); setPhoneOtpSent(false);
                    setPhoneError('');
                  }}
                  disabled={phoneVerified} />
                {!phoneVerified && !phoneOtpSent && (
                  <button style={s.btnSendOtp}
                    onClick={sendPhoneOtp}
                    disabled={phoneOtpLoading || phone.length !== country.maxLen}>
                    {phoneOtpLoading ? '...' : 'Send OTP'}
                  </button>
                )}
                {phoneVerified && (
                  <span style={s.verifiedBadge}>✅ Verified</span>
                )}
              </div>

              {/* OTP input */}
              {phoneOtpSent && !phoneVerified && (
  <div style={s.otpRow}>
    {/* ADD THIS HINT */}
    <p style={{ margin:'8px 0 4px', fontSize:13, color:'#4f46e5', fontWeight:600,
      background:'#ede9fe', padding:'6px 10px', borderRadius:6 }}>
      🔑 Demo OTP: <strong>1234</strong>
    </p>
    <div style={{ display:'flex', gap:8 }}>
      <input style={{ ...s.input, flex:1, textAlign:'center',
        fontSize:20, fontWeight:700, letterSpacing:6 }}
        type="text" placeholder="1234"
        value={phoneOtp} maxLength={4}
        onChange={e => setPhoneOtp(e.target.value.replace(/\D/g,'').slice(0,4))} />
      <button style={s.btnVerify} onClick={verifyPhoneOtp}>
        Verify
      </button>
    </div>
  </div>
)}
              {phoneError && <p style={s.fieldError}>{phoneError}</p>}
            </div>

            {/* Gender */}
            <div style={s.field}>
              <label style={s.label}>Gender</label>
              <div style={s.genderRow}>
                {['male','female','other'].map(g => (
                  <button key={g} type="button"
                    style={{ ...s.genderBtn,
                      background: form.gender === g ? '#4f46e5' : '#f1f5f9',
                      color:      form.gender === g ? '#fff'    : '#64748b',
                    }}
                    onClick={() => set('gender', g)}>
                    {g === 'male' ? '👨 Male' : g === 'female' ? '👩 Female' : '🧑 Other'}
                  </button>
                ))}
              </div>
            </div>

            {/* DOB */}
            <div style={s.field}>
              <label style={s.label}>Date of Birth</label>
              <input style={s.input} type="date"
                max={new Date().toISOString().split('T')[0]}
                value={form.dob} onChange={e => set('dob', e.target.value)} />
            </div>

            {/* City with autocomplete */}
            <div style={s.field}>
              <label style={s.label}>
                City
                <button type="button" style={s.locationBtn}
                  onClick={fetchCurrentLocation}>
                  {cityLoading ? '⏳' : '📍 Use Current Location'}
                </button>
              </label>
              <div style={{ position:'relative' }}>
                <input style={s.input}
  placeholder="Start typing your city..."
  value={city}
  onChange={e => handleCityInput(e.target.value)}
  onBlur={() => setTimeout(() => setCitySuggestions([]), 200)}
/>
                {citySuggestions.length > 0 && (
                  <div style={s.dropdown}>
                    {citySuggestions.map((c, i) => (
  <div key={i} style={s.dropdownItem}
    onMouseDown={(e) => {           // ← change onClick to onMouseDown
      e.preventDefault();           // ← add this
      setCityVal(c);
      setCitySuggestions([]);
    }}>
    📍 {c}
  </div>
))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Education ────────────────────────────── */}
        {step === 1 && (
  <div>
    <div style={s.field}>
      <label style={s.label}>Highest Education</label>
      <select style={s.input} value={form.education}
        onChange={e => set('education', e.target.value)}>
        <option value="">Select education</option>
        {['B.Tech/B.E','BCA','BSc','MCA','M.Tech/M.E',
          'MBA','MSc','PhD','Diploma','Other'].map(e => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>
    </div>

    {/* College with autocomplete */}
    <div style={s.field}>
      <label style={s.label}>College Name</label>
      <div style={{ position: 'relative' }}>
        <div style={s.searchInputWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Type 3+ letters (e.g. NM Institute...)"
            value={college}
            onChange={e => handleCollegeInput(e.target.value)}
            autoComplete="off"
          />
          {collegeLoading && <span style={s.loadingDot}>⏳</span>}
        </div>
        {collegeSuggestions.length > 0 && (
          <div style={s.dropdown}>
            {collegeSuggestions.map((c, i) => (
              <div key={i} style={s.dropdownItem}
                onMouseDown={() => {
                  setCollege(c);
                  setCollegeSuggestions([]);
                }}>
                🎓 {c}
              </div>
            ))}
            <div style={s.dropdownFooter}>
              Powered by OpenStreetMap
            </div>
          </div>
        )}
        {college.length >= 3 && !collegeLoading && collegeSuggestions.length === 0 && (
          <p style={s.noResult}>No suggestions — you can type it manually</p>
        )}
      </div>
    </div>

    {/* University with Hipolabs API */}
    <div style={s.field}>
      <label style={s.label}>University / Board</label>
      <div style={{ position: 'relative' }}>
        <div style={s.searchInputWrap}>
          <span style={s.searchIcon}>🏛️</span>
          <input
            style={s.searchInput}
            placeholder="Type 3+ letters (e.g. Anna University...)"
            value={university}
            onChange={e => handleUniversityInput(e.target.value)}
            autoComplete="off"
          />
          {universityLoading && <span style={s.loadingDot}>⏳</span>}
        </div>
        {universitySuggestions.length > 0 && (
          <div style={s.dropdown}>
            {universitySuggestions.map((u, i) => (
              <div key={i} style={s.dropdownItem}
                onMouseDown={() => {
                  setUniversity(u);
                  set('university', u);
                  setUniversitySuggestions([]);
                }}>
                🏛️ {u}
              </div>
            ))}
            <div style={s.dropdownFooter}>
              Powered by Hipolabs University API
            </div>
          </div>
        )}
        {university.length >= 3 && !universityLoading && universitySuggestions.length === 0 && (
          <p style={s.noResult}>No suggestions — you can type it manually</p>
        )}
      </div>
    </div>

    {/* Passing Year */}
    <div style={s.field}>
      <label style={s.label}>Passing Year</label>
      <select style={s.input} value={form.passingYear}
        onChange={e => set('passingYear', e.target.value)}>
        <option value="">Select year</option>
        {PASSING_YEARS.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>

    {/* Experience */}
    <div style={s.field}>
      <label style={s.label}>Experience Level</label>
      <select style={s.input} value={form.experience}
        onChange={e => set('experience', e.target.value)}>
        <option value="fresher">Fresher (0 yrs)</option>
        <option value="junior">Junior (1-2 yrs)</option>
        <option value="mid">Mid (3-5 yrs)</option>
        <option value="senior">Senior (5+ yrs)</option>
      </select>
    </div>
  </div>
)}

        {/* ── Step 2: Skills ───────────────────────────────── */}
        {step === 2 && (
          <div>
            <div style={s.field}>
              <label style={s.label}>
                Skills
                <span style={s.skillHint}>
                  Type + Enter or comma to add
                </span>
              </label>

              {/* Pills input box */}
              <div style={s.skillBox}
                onClick={() => skillInputRef.current?.focus()}>
                {skills.map(sk => (
                  <span key={sk} style={s.skillPill}>
                    {sk}
                    <button style={s.skillRemove}
                      onClick={() => removeSkill(sk)}>×</button>
                  </span>
                ))}
                <input
                  ref={skillInputRef}
                  style={s.skillInput}
                  placeholder={skills.length === 0 ? 'Type a skill...' : ''}
                  value={skillInput}
                  onChange={e => handleSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown} />
              </div>

              {/* Suggestions */}
              {skillSuggestions.length > 0 && (
                <div style={s.skillSuggestions}>
                  <p style={s.suggestionLabel}>💡 Suggestions — click to add:</p>
                  <div style={s.suggestionRow}>
                    {skillSuggestions.map(sg => (
                      <button key={sg} type="button"
                        style={s.suggestionPill}
                        onClick={() => addSkill(sg)}>
                        + {sg}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular skills */}
              {skills.length === 0 && skillInput === '' && (
                <div style={s.skillSuggestions}>
                  <p style={s.suggestionLabel}>🔥 Popular skills — click to add:</p>
                  <div style={s.suggestionRow}>
                    {['React','Node.js','Python','MongoDB','JavaScript',
                      'Java','AWS','Docker','Flutter','Django'].map(sg => (
                      <button key={sg} type="button"
                        style={s.suggestionPill}
                        onClick={() => addSkill(sg)}>
                        + {sg}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Links ────────────────────────────────── */}
        {step === 3 && (
          <div>
            <div style={s.field}>
              <label style={s.label}>LinkedIn Profile (optional)</label>
              <input style={s.input}
                placeholder="https://linkedin.com/in/yourname"
                value={form.linkedin}
                onChange={e => set('linkedin', e.target.value)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>GitHub Profile (optional)</label>
              <input style={s.input}
                placeholder="https://github.com/yourname"
                value={form.github}
                onChange={e => set('github', e.target.value)} />
            </div>

            {/* Summary */}
            <div style={s.summaryBox}>
              <p style={s.summaryTitle}>📋 Profile Summary</p>
              {[
                ['📱', `${country.dial}${phone}`],
                ['👤', `${form.gender} • ${city}`],
                ['🎓', `${form.education} — ${college}`],
                ['🏛️', form.university],
                ['📅', `Passing: ${form.passingYear} • ${form.experience}`],
                ['🛠', skills.join(', ')],
              ].map(([icon, val]) => (
                <div key={icon} style={s.summaryRow}>
                  <span>{icon}</span>
                  <span style={s.summaryVal}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={s.btnRow}>
          {step > 0 && (
            <button style={s.btnBack}
              onClick={() => { setStep(s => s-1); setError(''); }}>
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

const s = {
  page:            { minHeight:'100vh', background:'linear-gradient(135deg,#667eea,#764ba2)',
                     display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  card:            { background:'#fff', borderRadius:16, padding:'32px 28px',
                     width:'100%', maxWidth:500,
                     boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh',
                     overflowY:'auto' },
  header:          { textAlign:'center', marginBottom:16 },
  title:           { margin:0, fontSize:22, fontWeight:800, color:'#1e293b' },
  sub:             { margin:'4px 0 0', color:'#64748b', fontSize:13 },
  progressWrap:    { marginBottom:20 },
  progressBar:     { height:6, background:'#e2e8f0', borderRadius:99, marginBottom:8 },
  progressFill:    { height:6, background:'#4f46e5', borderRadius:99,
                     transition:'width 0.4s ease' },
  stepLabels:      { display:'flex', justifyContent:'space-between' },
  stepLabel:       { fontSize:11 },
  field:           { marginBottom:16, position:'relative' },
  label:           { display:'flex', justifyContent:'space-between', alignItems:'center',
                     fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 },
  input:           { width:'100%', padding:'10px 12px', borderRadius:8,
                     border:'1.5px solid #e2e8f0', fontSize:14,
                     boxSizing:'border-box', outline:'none' },
  phoneRow:        { display:'flex', gap:8, alignItems:'center' },
  countrySelect:   { padding:'10px 8px', borderRadius:8, border:'1.5px solid #e2e8f0',
                     fontSize:13, background:'#f8fafc', cursor:'pointer' },
  btnSendOtp:      { padding:'10px 12px', background:'#4f46e5', color:'#fff',
                     border:'none', borderRadius:8, cursor:'pointer',
                     fontSize:13, fontWeight:600, whiteSpace:'nowrap' },
  btnVerify:       { padding:'10px 16px', background:'#16a34a', color:'#fff',
                     border:'none', borderRadius:8, cursor:'pointer',
                     fontSize:13, fontWeight:600 },
  verifiedBadge:   { padding:'6px 12px', background:'#dcfce7', color:'#16a34a',
                     borderRadius:8, fontSize:13, fontWeight:700, whiteSpace:'nowrap' },
  otpRow:          { marginTop:4 },
  fieldError:      { fontSize:12, color:'#ef4444', margin:'4px 0 0' },
  genderRow:       { display:'flex', gap:8 },
  genderBtn:       { flex:1, padding:'10px 0', border:'none', borderRadius:8,
                     cursor:'pointer', fontSize:13, fontWeight:600 },
  locationBtn:     { background:'none', border:'none', color:'#4f46e5',
                     cursor:'pointer', fontSize:12, fontWeight:600, padding:0 },
  dropdown:        { position:'absolute', top:'100%', left:0, right:0,
                     background:'#fff', border:'1px solid #e2e8f0',
                     borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
                     zIndex:100, maxHeight:200, overflowY:'auto' },
  dropdownItem:    { padding:'10px 14px', cursor:'pointer', fontSize:13,
                     color:'#374151', borderBottom:'1px solid #f1f5f9' },
  searching:       { fontSize:12, color:'#94a3b8', margin:'4px 0 0' },
  skillBox:        { minHeight:48, padding:'8px 10px', borderRadius:8,
                     border:'1.5px solid #e2e8f0', display:'flex',
                     flexWrap:'wrap', gap:6, cursor:'text', alignItems:'center' },
  skillPill:       { display:'flex', alignItems:'center', gap:4, padding:'4px 10px',
                     background:'#ede9fe', color:'#5b21b6',
                     borderRadius:99, fontSize:13, fontWeight:600 },
  skillRemove:     { background:'none', border:'none', cursor:'pointer',
                     color:'#7c3aed', fontSize:16, padding:0, lineHeight:1 },
  skillInput:      { border:'none', outline:'none', fontSize:14,
                     minWidth:120, flex:1 },
  skillHint:       { fontSize:11, color:'#94a3b8', fontWeight:400 },
  skillSuggestions:{ marginTop:10, background:'#f8fafc', borderRadius:8,
                     padding:12, border:'1px solid #e2e8f0' },
  suggestionLabel: { margin:'0 0 8px', fontSize:12, color:'#64748b', fontWeight:600 },
  suggestionRow:   { display:'flex', flexWrap:'wrap', gap:6 },
  suggestionPill:  { padding:'4px 10px', background:'#fff', color:'#4f46e5',
                     border:'1px solid #c7d2fe', borderRadius:99,
                     cursor:'pointer', fontSize:12, fontWeight:600 },
  summaryBox:      { background:'#f8fafc', borderRadius:10, padding:16,
                     border:'1px solid #e2e8f0' },
  summaryTitle:    { margin:'0 0 10px', fontWeight:700, color:'#1e293b' },
  summaryRow:      { display:'flex', gap:10, padding:'5px 0',
                     borderBottom:'1px solid #f1f5f9', fontSize:13 },
  summaryVal:      { color:'#374151', flex:1 },
  btnRow:          { display:'flex', gap:8, marginTop:20 },
  btnBack:         { flex:1, padding:11, background:'#f1f5f9', color:'#475569',
                     border:'none', borderRadius:8, fontSize:14,
                     fontWeight:600, cursor:'pointer' },
  btnNext:         { flex:2, padding:11, background:'#4f46e5', color:'#fff',
                     border:'none', borderRadius:8, fontSize:14,
                     fontWeight:700, cursor:'pointer' },
  errorBox:        { background:'#fef2f2', color:'#dc2626', padding:'10px 14px',
                     borderRadius:8, marginBottom:12, fontSize:13 },
                     searchInputWrap: { display:'flex', alignItems:'center', border:'1.5px solid #e2e8f0',
                   borderRadius:8, overflow:'hidden', background:'#fff' },
searchIcon:      { padding:'0 10px', fontSize:16 },
searchInput:     { flex:1, padding:'10px 8px', border:'none', outline:'none',
                   fontSize:14, background:'transparent' },
loadingDot:      { padding:'0 10px', fontSize:14 },
dropdownFooter:  { padding:'6px 14px', fontSize:10, color:'#94a3b8',
                   borderTop:'1px solid #f1f5f9', textAlign:'right' },
noResult:        { fontSize:12, color:'#94a3b8', margin:'4px 0 0' },
};