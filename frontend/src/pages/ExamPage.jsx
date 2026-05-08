import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

// ─── Category colours ───────────────────────────────────────────────────────
const CAT_COLORS = {
  aptitude:  { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
  reasoning: { bg: '#ede9fe', text: '#5b21b6', border: '#a78bfa' },
  coding:    { bg: '#d1fae5', text: '#065f46', border: '#34d399' },
  general:   { bg: '#e0f2fe', text: '#0c4a6e', border: '#38bdf8' },
};

const CATEGORY_LABEL = {
  aptitude:  '🔢 Aptitude',
  reasoning: '🧩 Reasoning',
  coding:    '💻 Coding',
  general:   '📚 General',
};

export default function ExamPage() {
  const { jobId }   = useParams();
  const navigate    = useNavigate();

  const [exam,       setExam]       = useState(null);
  const [answers,    setAnswers]    = useState({});
  const [timeLeft,   setTimeLeft]   = useState(null);   // seconds
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');
  const [currentQ,   setCurrentQ]   = useState(0);
  const [flagged,    setFlagged]    = useState(new Set());

  const autoSubmitRef = useRef(false);

  // ── Fetch exam ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await api.get(`/exam/${jobId}`);
        setExam(data);
        setTimeLeft(data.duration * 60);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load exam');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [jobId]);

  // ── Countdown timer → auto-submit when reaches 0 ──────────────────────
  const handleSubmit = useCallback(async (auto = false) => {
    if (autoSubmitRef.current) return;   // prevent duplicate calls
    autoSubmitRef.current = true;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/exam/${jobId}/submit`, {
        answers,
        autoSubmitted: auto,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [answers, jobId]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, result, handleSubmit]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const toggleFlag = (idx) =>
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  const answeredCount = Object.keys(answers).length;
  const totalQ        = exam?.questions?.length || 0;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  // ── Result screen ──────────────────────────────────────────────────────
  if (result) {
    const pct = result.score;
    const ring = pct >= result.passMark ? '#10b981' : '#ef4444';
    return (
      <div style={s.page}>
        <div style={s.resultCard}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ ...s.scoreRing, borderColor: ring }}>
              <span style={{ fontSize:32, fontWeight:800, color: ring }}>{pct}%</span>
              <span style={{ fontSize:12, color:'#64748b', marginTop:4 }}>Score</span>
            </div>
            <h2 style={{ margin:'16px 0 4px', color: result.passed ? '#10b981' : '#ef4444' }}>
              {result.passed ? '🎉 Passed! Moving to Interview' : '❌ Better Luck Next Time'}
            </h2>
            {result.autoSubmitted && (
              <p style={{ background:'#fef9c3', color:'#92400e', borderRadius:8,
                padding:'6px 14px', fontSize:13, display:'inline-block' }}>
                ⏰ Auto-submitted when timer reached 0
              </p>
            )}
            <p style={{ color:'#64748b', fontSize:14 }}>
              {result.correct} / {result.total} correct · Pass mark: {result.passMark}%
            </p>
          </div>

          {/* Category breakdown */}
          {result.breakdown && (
            <div style={s.breakdownGrid}>
              {Object.entries(result.breakdown).map(([cat, data]) => {
                const c = CAT_COLORS[cat] || CAT_COLORS.general;
                return (
                  <div key={cat} style={{ ...s.breakdownCard,
                    background: c.bg, border: `1.5px solid ${c.border}` }}>
                    <p style={{ margin:0, fontWeight:700, color: c.text, fontSize:13 }}>
                      {CATEGORY_LABEL[cat] || cat}
                    </p>
                    <p style={{ margin:'4px 0 0', color: c.text, fontSize:20, fontWeight:800 }}>
                      {data.correct}/{data.total}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Per-question review */}
          <h3 style={{ marginBottom:12, color:'#1e293b' }}>Question Review</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {result.result.map((r, i) => {
              const c = CAT_COLORS[r.category] || CAT_COLORS.general;
              return (
                <div key={i} style={{
                  ...s.reviewItem,
                  borderLeft: `4px solid ${r.isCorrect ? '#10b981' : '#ef4444'}`
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ ...s.catBadge, background: c.bg, color: c.text }}>
                      {CATEGORY_LABEL[r.category] || r.category}
                    </span>
                    <span style={{ fontSize:14, fontWeight:600, color:'#1e293b' }}>
                      Q{i+1}: {r.question}
                    </span>
                  </div>
                  <p style={{ margin:'2px 0', fontSize:13,
                    color: r.isCorrect ? '#10b981' : '#ef4444' }}>
                    Your answer: {r.yourAnswer} {r.isCorrect ? '✓' : '✗'}
                  </p>
                  {!r.isCorrect && (
                    <p style={{ margin:0, fontSize:13, color:'#10b981' }}>
                      Correct: {r.correctAnswer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button style={s.btn} onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={s.page}>
      <div style={{ textAlign:'center', color:'#64748b' }}>Loading exam…</div>
    </div>
  );

  if (error) return (
    <div style={s.page}>
      <div style={{ ...s.errorBox }}>{error}</div>
    </div>
  );

  const q = exam.questions[currentQ];
  const catColor = CAT_COLORS[q?.category] || CAT_COLORS.general;
  const timerWarning = timeLeft <= 60;

  // ── Exam screen ────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={{ margin:0, color:'#1e293b', fontSize:18 }}>{exam.title}</h2>
          <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:13 }}>
            {answeredCount}/{totalQ} answered · Pass mark: {exam.passMark}%
          </p>
        </div>
        <div style={{
          ...s.timer,
          background: timerWarning ? '#fef2f2' : '#f0fdf4',
          color:      timerWarning ? '#dc2626' : '#16a34a',
          border:     `2px solid ${timerWarning ? '#fca5a5' : '#86efac'}`,
          animation:  timerWarning ? 'pulse 1s infinite' : 'none',
        }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      <div style={s.body}>
        {/* Question navigator */}
        <div style={s.navigator}>
          <p style={{ margin:'0 0 10px', fontWeight:600, fontSize:13, color:'#475569' }}>
            Questions
          </p>
          <div style={s.dotGrid}>
            {exam.questions.map((_, i) => {
              const isAnswered = answers[i] !== undefined;
              const isCurrent  = i === currentQ;
              const isFlagged  = flagged.has(i);
              return (
                <button key={i} onClick={() => setCurrentQ(i)} style={{
                  ...s.dot,
                  background: isCurrent  ? '#4f46e5'
                              : isAnswered ? '#10b981'
                              : '#f1f5f9',
                  color:  isCurrent || isAnswered ? '#fff' : '#64748b',
                  border: isFlagged ? '2px solid #f59e0b' : '2px solid transparent',
                }}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop:10, fontSize:11, color:'#94a3b8' }}>
            <span style={{ marginRight:10 }}>🟢 Answered</span>
            <span style={{ marginRight:10 }}>⬜ Unanswered</span>
            <span>🟡 Flagged</span>
          </div>
        </div>

        {/* Question panel */}
        <div style={s.questionPanel}>
          {/* Category badge */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <span style={{
              ...s.catBadge,
              background: catColor.bg,
              color:      catColor.text,
              border:     `1px solid ${catColor.border}`,
              fontSize:   13,
              padding:    '4px 12px',
            }}>
              {CATEGORY_LABEL[q.category] || q.category}
            </span>
            <span style={{ color:'#94a3b8', fontSize:13 }}>
              Question {currentQ + 1} of {totalQ}
            </span>
            <button onClick={() => toggleFlag(currentQ)} style={{
              marginLeft:'auto', background:'none', border:'none',
              cursor:'pointer', fontSize:18,
              color: flagged.has(currentQ) ? '#f59e0b' : '#cbd5e1',
            }} title="Flag for review">
              🚩
            </button>
          </div>

          <p style={s.questionText}>{q.question}</p>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {q.options.map((opt, oi) => {
              const isSelected = answers[currentQ] === oi;
              return (
                <button key={oi} onClick={() => setAnswers(a => ({ ...a, [currentQ]: oi }))}
                  style={{
                    ...s.optionBtn,
                    background: isSelected ? '#4f46e5' : '#f8fafc',
                    color:      isSelected ? '#fff'    : '#1e293b',
                    border:     isSelected ? '2px solid #4f46e5' : '2px solid #e2e8f0',
                  }}>
                  <span style={s.optLabel}>
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{ display:'flex', gap:10, marginTop:24 }}>
            <button disabled={currentQ === 0} onClick={() => setCurrentQ(q => q - 1)}
              style={{ ...s.navBtn, opacity: currentQ === 0 ? 0.4 : 1 }}>
              ← Prev
            </button>
            <button disabled={currentQ === totalQ - 1} onClick={() => setCurrentQ(q => q + 1)}
              style={{ ...s.navBtn, opacity: currentQ === totalQ - 1 ? 0.4 : 1 }}>
              Next →
            </button>
            <button
              onClick={() => {
                if (window.confirm(
                  `You have answered ${answeredCount}/${totalQ} questions.\nSubmit the exam?`
                )) handleSubmit(false);
              }}
              disabled={submitting}
              style={{ ...s.submitBtn, marginLeft:'auto', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting…' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh', background: '#f8fafc',
    padding: '24px 16px', fontFamily: 'system-ui,sans-serif',
  },
  header: {
    maxWidth: 1100, margin: '0 auto 20px', background: '#fff',
    borderRadius: 12, padding: '16px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
  },
  timer: {
    fontWeight: 800, fontSize: 22, borderRadius: 10,
    padding: '8px 20px', letterSpacing: 2, transition: 'all 0.3s',
  },
  body: {
    maxWidth: 1100, margin: '0 auto',
    display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20,
  },
  navigator: {
    background: '#fff', borderRadius: 12, padding: 16,
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)', height: 'fit-content',
  },
  dotGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6,
  },
  dot: {
    width: 36, height: 36, borderRadius: 8,
    cursor: 'pointer', fontWeight: 700, fontSize: 13,
    transition: 'all 0.15s',
  },
  questionPanel: {
    background: '#fff', borderRadius: 12, padding: 28,
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  catBadge: {
    borderRadius: 99, padding: '3px 10px',
    fontWeight: 700, fontSize: 12,
  },
  questionText: {
    fontSize: 17, fontWeight: 600, color: '#1e293b',
    lineHeight: 1.6, marginBottom: 20,
  },
  optionBtn: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 10,
    cursor: 'pointer', fontSize: 14, fontWeight: 500,
    textAlign: 'left', transition: 'all 0.15s',
  },
  optLabel: {
    width: 26, height: 26, borderRadius: 6,
    background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 13, flexShrink: 0,
  },
  navBtn: {
    padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: 14,
  },
  submitBtn: {
    padding: '10px 24px', borderRadius: 8, border: 'none',
    background: '#4f46e5', color: '#fff',
    cursor: 'pointer', fontWeight: 700, fontSize: 14,
  },
  resultCard: {
    maxWidth: 780, margin: '0 auto', background: '#fff',
    borderRadius: 16, padding: '36px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
  },
  scoreRing: {
    width: 120, height: 120, borderRadius: '50%',
    border: '6px solid', display: 'inline-flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  breakdownGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))',
    gap: 12, marginBottom: 24,
  },
  breakdownCard: {
    borderRadius: 10, padding: '12px 16px', textAlign: 'center',
  },
  reviewItem: {
    background: '#f8fafc', borderRadius: 10, padding: '12px 16px',
  },
  btn: {
    display: 'block', width: '100%', marginTop: 28,
    padding: 14, background: '#4f46e5', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 15,
    fontWeight: 700, cursor: 'pointer',
  },
  errorBox: {
    maxWidth: 500, margin: '40px auto', background: '#fef2f2',
    color: '#dc2626', padding: '16px 20px', borderRadius: 10,
  },
};