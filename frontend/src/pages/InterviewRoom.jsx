import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

// Mock AI question set — displayed sequentially
const AI_QUESTIONS = [
  'Tell me about yourself and your background.',
  'What are your key technical strengths relevant to this role?',
  'Describe a challenging project you worked on and how you solved it.',
  'How do you handle tight deadlines and competing priorities?',
  'Where do you see yourself professionally in 3 years?',
];

const HEARTBEAT_INTERVAL = 5000;  // ms

export default function InterviewRoom() {
  const { jobId }   = useParams();
  const navigate    = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────
  const [phase,        setPhase]        = useState('setup');    // setup | interview | done
  const [sessionId,    setSessionId]    = useState(null);
  const [cameraOn,     setCameraOn]     = useState(false);
  const [cameraError,  setCameraError]  = useState('');
  const [currentQ,     setCurrentQ]     = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(120);        // 2 min per question
  const [totalTime,    setTotalTime]    = useState(0);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState('');
  const [faceStatus,   setFaceStatus]   = useState('checking'); // checking|present|absent
  const [tabWarnings,  setTabWarnings]  = useState(0);
  const [endingSession,setEndingSession]= useState(false);

  // Refs
  const videoRef      = useRef(null);
  const streamRef     = useRef(null);
  const hbIntervalRef = useRef(null);
  const timerRef      = useRef(null);
  const totalTimerRef = useRef(null);
  const faceCheckRef  = useRef(null);
  const tabSwitchRef  = useRef(false);

  // ── Camera ─────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setCameraError('');
    } catch {
      setCameraError('Camera access denied. Please allow camera and reload.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraOn(false);
  };

  // ── Mock face detection (no ML — checks video track "live") ───────────
  const checkFace = useCallback(() => {
    if (!videoRef.current) return false;
    const track = streamRef.current?.getVideoTracks()[0];
    // Mock: face present if track is live + random simulation (85% presence)
    const present = track?.readyState === 'live' && Math.random() > 0.15;
    setFaceStatus(present ? 'present' : 'absent');
    return present;
  }, []);

  // ── Tab visibility detection ──────────────────────────────────────────
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && phase === 'interview') {
        tabSwitchRef.current = true;
        setTabWarnings(w => w + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [phase]);

  // ── Start interview session ────────────────────────────────────────────
  const startInterview = async () => {
    try {
      const { data } = await api.post(`/interview/${jobId}/start`);
      setSessionId(data.sessionId);
      setPhase('interview');
      setCurrentQ(0);
      setTimeLeft(120);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start session');
    }
  };

  // ── Question timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'interview') return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Auto-advance to next question
          if (currentQ < AI_QUESTIONS.length - 1) {
            setCurrentQ(q => q + 1);
            return 120;
          } else {
            clearInterval(timerRef.current);
            return 0;
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQ]);

  // ── Total session timer ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'interview') return;
    totalTimerRef.current = setInterval(() => setTotalTime(t => t + 1), 1000);
    return () => clearInterval(totalTimerRef.current);
  }, [phase]);

  // ── Heartbeat ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'interview' || !sessionId) return;

    hbIntervalRef.current = setInterval(async () => {
      const fd = checkFace();
      const ts = tabSwitchRef.current;
      tabSwitchRef.current = false; // reset per ping
      try {
        await api.post(`/interview/session/${sessionId}/hb`, {
          faceDetected: fd,
          tabSwitched:  ts,
        });
      } catch { /* silent */ }
    }, HEARTBEAT_INTERVAL);

    // Face check visual update every 2s
    faceCheckRef.current = setInterval(checkFace, 2000);

    return () => {
      clearInterval(hbIntervalRef.current);
      clearInterval(faceCheckRef.current);
    };
  }, [phase, sessionId, checkFace]);

  // ── End session ───────────────────────────────────────────────────────
  const endInterview = useCallback(async () => {
    if (endingSession) return;
    setEndingSession(true);
    clearInterval(hbIntervalRef.current);
    clearInterval(faceCheckRef.current);
    clearInterval(timerRef.current);
    clearInterval(totalTimerRef.current);
    stopCamera();
    try {
      const { data } = await api.post(`/interview/session/${sessionId}/end`);
      setResult(data);
      setPhase('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end session');
    }
  }, [sessionId, endingSession]);

  // Auto-end when last question timer hits 0
  useEffect(() => {
    if (phase === 'interview' && currentQ === AI_QUESTIONS.length - 1 && timeLeft === 0) {
      endInterview();
    }
  }, [timeLeft, currentQ, phase, endInterview]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), []);

  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // ─────────────────────────────────────────────────────────────────────────
  //  PHASES
  // ─────────────────────────────────────────────────────────────────────────

  // ── Done screen ──────────────────────────────────────────────────────
  if (phase === 'done' && result) {
    const score = result.integrityScore;
    const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ ...s.bigScore, borderColor: color }}>
              <span style={{ fontSize:34, fontWeight:800, color }}>{score}</span>
              <span style={{ fontSize:12, color:'#64748b' }}>/ 100</span>
            </div>
            <h2 style={{ margin:'16px 0 6px', color:'#1e293b' }}>
              Interview Session Complete 🎓
            </h2>
            <p style={{ color:'#64748b', fontSize:14 }}>
              Your session has been recorded and will be reviewed by HR.
            </p>
          </div>

          <div style={s.statsGrid}>
            <Stat icon="👁" label="Face Presence" value={`${result.faceScore}%`} />
            <Stat icon="🔀" label="Tab Switches" value={result.tabSwitches} />
            <Stat icon="⏱" label="Duration" value={formatTime(totalTime)} />
            <Stat icon="❓" label="Questions" value={AI_QUESTIONS.length} />
          </div>

          {tabWarnings > 2 && (
            <div style={s.warnBox}>
              ⚠️ {tabWarnings} tab-switch events were recorded. This will be visible to the recruiter.
            </div>
          )}

          <button style={s.btn} onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Setup screen ─────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h2 style={{ margin:'0 0 6px', color:'#1e293b' }}>🎥 Round 2 — AI Interview</h2>
          <p style={{ color:'#64748b', marginBottom:24 }}>
            You will be shown {AI_QUESTIONS.length} questions. Answer each aloud.
            Your face presence and activity will be monitored.
          </p>

          {/* Camera preview */}
          <div style={s.cameraBox}>
            {cameraOn ? (
              <video ref={videoRef} autoPlay muted playsInline style={s.video} />
            ) : (
              <div style={s.noCamera}>
                <span style={{ fontSize:40 }}>📷</span>
                <p style={{ color:'#94a3b8' }}>Camera not started</p>
              </div>
            )}
          </div>

          {cameraError && <p style={{ color:'#ef4444', fontSize:13 }}>{cameraError}</p>}

          {error && <p style={{ color:'#ef4444', fontSize:13 }}>{error}</p>}

          <div style={{ display:'flex', gap:12, marginTop:20 }}>
            {!cameraOn ? (
              <button style={{ ...s.btn, background:'#0ea5e9' }} onClick={startCamera}>
                📷 Enable Camera
              </button>
            ) : (
              <button style={{ ...s.btn, background:'#64748b' }} onClick={stopCamera}>
                🚫 Disable Camera
              </button>
            )}
            <button style={{
              ...s.btn,
              opacity: cameraOn ? 1 : 0.5,
              cursor:  cameraOn ? 'pointer' : 'not-allowed',
            }} onClick={cameraOn ? startInterview : undefined}>
              ▶ Start Interview
            </button>
          </div>

          <ul style={s.rules}>
            <li>Keep your face visible throughout the session.</li>
            <li>Do not switch tabs or minimize the window.</li>
            <li>Each question has a 2-minute timer — speak your answer aloud.</li>
            <li>The session auto-submits after all questions are answered.</li>
          </ul>
        </div>
      </div>
    );
  }

  // ── Interview screen ──────────────────────────────────────────────────
  const pct = ((currentQ) / AI_QUESTIONS.length) * 100;
  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <div>
          <p style={{ margin:0, fontWeight:700, color:'#1e293b' }}>Round 2 — AI Interview</p>
          <p style={{ margin:'2px 0 0', color:'#64748b', fontSize:13 }}>
            Question {currentQ + 1} of {AI_QUESTIONS.length}
          </p>
        </div>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          <FaceIndicator status={faceStatus} />
          {tabWarnings > 0 && (
            <span style={{ background:'#fef2f2', color:'#dc2626',
              borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700 }}>
              ⚠ {tabWarnings} tab switch{tabWarnings > 1 ? 'es' : ''}
            </span>
          )}
          <div style={{
            fontWeight:800, fontSize:20,
            color: timeLeft <= 30 ? '#ef4444' : '#1e293b',
          }}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:4, background:'#e2e8f0' }}>
        <div style={{ height:'100%', width:`${pct}%`,
          background:'#4f46e5', transition:'width 0.5s' }} />
      </div>

      <div style={{ ...s.interviewBody }}>
        {/* Webcam feed */}
        <div style={s.webcamPanel}>
          {cameraOn
            ? <video ref={videoRef} autoPlay muted playsInline style={s.video} />
            : <div style={s.noCamera}><span style={{ fontSize:36 }}>📷</span></div>
          }
          <div style={{
            ...s.faceOverlay,
            background: faceStatus === 'present' ? 'rgba(16,185,129,0.15)'
                      : faceStatus === 'absent'  ? 'rgba(239,68,68,0.15)'
                      : 'transparent',
          }}>
            <span style={{ fontSize:11, color:'#fff', fontWeight:700 }}>
              {faceStatus === 'present' ? '✅ Face detected' : '❌ Face not detected'}
            </span>
          </div>
        </div>

        {/* Question panel */}
        <div style={s.questionBox}>
          <div style={s.qNumber}>Q{currentQ + 1}</div>
          <p style={s.qText}>{AI_QUESTIONS[currentQ]}</p>
          <p style={{ color:'#94a3b8', fontSize:13, marginTop:12 }}>
            💡 Speak your answer clearly into the microphone.
          </p>

          {/* Timer bar */}
          <div style={{ margin:'20px 0 10px' }}>
            <div style={{ height:6, background:'#e2e8f0', borderRadius:99 }}>
              <div style={{
                height:'100%', borderRadius:99,
                width:`${(timeLeft / 120) * 100}%`,
                background: timeLeft <= 30 ? '#ef4444' : '#4f46e5',
                transition:'width 1s linear',
              }} />
            </div>
            <p style={{ margin:'6px 0 0', fontSize:12, color:'#94a3b8' }}>
              {timeLeft}s remaining for this question
            </p>
          </div>

          <div style={{ display:'flex', gap:12, marginTop:24 }}>
            {currentQ < AI_QUESTIONS.length - 1 && (
              <button style={{ ...s.btn, background:'#0ea5e9' }}
                onClick={() => { setCurrentQ(q => q + 1); setTimeLeft(120); }}>
                Next Question →
              </button>
            )}
            <button style={{ ...s.btn, background:'#dc2626' }}
              onClick={() => {
                if (window.confirm('End interview and submit?')) endInterview();
              }}>
              End & Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small components ────────────────────────────────────────────────────────
function FaceIndicator({ status }) {
  const map = {
    present:  { bg:'#d1fae5', color:'#065f46', label:'Face OK' },
    absent:   { bg:'#fef2f2', color:'#dc2626', label:'No Face' },
    checking: { bg:'#f1f5f9', color:'#64748b', label:'Checking…' },
  };
  const m = map[status] || map.checking;
  return (
    <span style={{ background:m.bg, color:m.color, borderRadius:8,
      padding:'4px 10px', fontSize:12, fontWeight:700 }}>
      {m.label}
    </span>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={{ background:'#f8fafc', borderRadius:10, padding:'14px 18px', textAlign:'center' }}>
      <div style={{ fontSize:22 }}>{icon}</div>
      <p style={{ margin:'6px 0 2px', fontWeight:800, fontSize:20, color:'#1e293b' }}>{value}</p>
      <p style={{ margin:0, fontSize:12, color:'#64748b' }}>{label}</p>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = {
  page:  { minHeight:'100vh', background:'#0f172a', fontFamily:'system-ui,sans-serif' },
  card:  { maxWidth:580, margin:'40px auto', background:'#fff',
           borderRadius:16, padding:'36px 32px',
           boxShadow:'0 4px 32px rgba(0,0,0,0.15)' },
  topBar:{ display:'flex', alignItems:'center', justifyContent:'space-between',
           padding:'14px 28px', background:'#1e293b', borderBottom:'1px solid #334155' },
  interviewBody: {
    display:'grid', gridTemplateColumns:'340px 1fr',
    gap:24, padding:24, maxWidth:1100, margin:'0 auto',
  },
  webcamPanel: {
    position:'relative', borderRadius:16, overflow:'hidden',
    background:'#1e293b', aspectRatio:'4/3',
  },
  video:     { width:'100%', height:'100%', objectFit:'cover', display:'block', transform:'scaleX(-1)' },
  noCamera:  { display:'flex', flexDirection:'column', alignItems:'center',
               justifyContent:'center', height:'100%', color:'#94a3b8' },
  faceOverlay: { position:'absolute', bottom:0, left:0, right:0,
                 padding:'8px 12px', backdropFilter:'blur(4px)' },
  questionBox: { background:'#1e293b', borderRadius:16, padding:'32px 28px',
                 display:'flex', flexDirection:'column' },
  qNumber: { display:'inline-block', background:'#4f46e5', color:'#fff',
             borderRadius:8, padding:'4px 12px', fontWeight:800, fontSize:13,
             marginBottom:16, alignSelf:'flex-start' },
  qText: { fontSize:20, fontWeight:700, color:'#f1f5f9', lineHeight:1.6, margin:0 },
  cameraBox: { background:'#1e293b', borderRadius:12, overflow:'hidden',
               aspectRatio:'4/3', maxWidth:400, margin:'0 auto' },
  bigScore: { width:110, height:110, borderRadius:'50%', border:'6px solid',
              display:'inline-flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 },
  warnBox: { background:'#fef3c7', color:'#92400e', borderRadius:10,
             padding:'10px 16px', fontSize:13, marginBottom:16 },
  btn: { flex:1, padding:'12px 20px', background:'#4f46e5', color:'#fff',
         border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' },
  rules: { marginTop:20, paddingLeft:20, color:'#64748b', fontSize:13, lineHeight:1.9 },
};