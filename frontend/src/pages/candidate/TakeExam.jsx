import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function TakeExam() {
  const { jobId }               = useParams();
  const navigate                = useNavigate();
  const [exam, setExam]         = useState(null);
  const [answers, setAnswers]   = useState({});
  const [result, setResult]     = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    api.get(`/exam/${jobId}`).then(res => {
      setExam(res.data);
      setTimeLeft(res.data.duration * 60); // convert to seconds
    }).catch(() => alert('No exam available for this job yet.'));
  }, [jobId]);

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
  if (timeLeft === null || result) return;
  if (timeLeft <= 0) { handleSubmit(); return; }
  const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
  return () => clearTimeout(t);
}, [timeLeft, result]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSelect = (qIndex, optIndex) => {
    if (result) return; // locked after submit
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/exam/${jobId}/submit`, { answers });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (!exam) return <p style={styles.center}>Loading exam...</p>;

  // ── Results Screen ────────────────────────────────────────────────
  if (result) return (
    <div style={styles.container}>
      <div style={styles.resultCard}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Exam Submitted ✅</h2>

        <div style={{ ...styles.scoreBig,
          background: result.passed ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${result.passed ? '#16a34a' : '#dc2626'}` }}>
          <p style={{ fontSize: 48, fontWeight: 800, margin: 0,
            color: result.passed ? '#16a34a' : '#dc2626' }}>
            {result.score}%
          </p>
          <p style={{ margin: '4px 0', color: '#555' }}>
            {result.correct} / {result.total} correct
          </p>
          <p style={{ fontWeight: 700, fontSize: 18,
            color: result.passed ? '#16a34a' : '#dc2626' }}>
            {result.passed ? '🎉 PASSED — Moving to Interview!' : '❌ FAILED — Better luck next time'}
          </p>
        </div>

        {/* Per-question breakdown */}
        <h3 style={{ marginTop: 24 }}>Question Review</h3>
        {result.result.map((r, i) => (
          <div key={i} style={{ ...styles.reviewCard,
            borderLeft: `4px solid ${r.isCorrect ? '#16a34a' : '#dc2626'}` }}>
            <p style={styles.qText}><strong>Q{i + 1}:</strong> {r.question}</p>
            <p style={{ color: r.isCorrect ? '#16a34a' : '#dc2626', margin: '2px 0', fontSize: 13 }}>
              Your answer: {r.yourAnswer}
            </p>
            {!r.isCorrect && (
              <p style={{ color: '#16a34a', margin: '2px 0', fontSize: 13 }}>
                Correct answer: {r.correctAnswer}
              </p>
            )}
          </div>
        ))}

        <button style={styles.btnPrimary}
          onClick={() => navigate('/candidate/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  // ── Exam Screen ───────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={{ margin: 0 }}>{exam.title}</h3>
        <span style={{ ...styles.timer,
          color: timeLeft < 60 ? '#dc2626' : '#1e293b' }}>
          ⏱ {formatTime(timeLeft)}
        </span>
      </div>

      <p style={styles.meta}>
        {exam.questions.length} Questions • Pass Mark: {exam.passMark}% •
        Answered: {Object.keys(answers).length}/{exam.questions.length}
      </p>

      {exam.questions.map((q, qi) => (
        <div key={qi} style={styles.questionCard}>
          <p style={styles.qText}>
            <strong>Q{qi + 1}.</strong> {q.question}
          </p>
          <div style={styles.optionGrid}>
            {q.options.map((opt, oi) => (
              <div key={oi}
                style={{ ...styles.option,
                  background:   answers[qi] === oi ? '#4f46e5' : '#f8fafc',
                  color:        answers[qi] === oi ? '#fff'    : '#1e293b',
                  borderColor:  answers[qi] === oi ? '#4f46e5' : '#e2e8f0',
                }}
                onClick={() => handleSelect(qi, oi)}>
                <span style={styles.optLetter}>
                  {['A','B','C','D'][oi]}
                </span>
                {opt}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        style={{ ...styles.btnPrimary,
          opacity: loading ? 0.7 : 1,
          marginBottom: 40 }}
        onClick={handleSubmit}
        disabled={loading}>
        {loading ? 'Submitting...' : `Submit Exam (${Object.keys(answers).length}/${exam.questions.length} answered)`}
      </button>
    </div>
  );
}

const styles = {
  container:    { maxWidth: 720, margin: '0 auto', padding: 24 },
  center:       { textAlign: 'center', marginTop: 80, fontSize: 18 },
  header:       { display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 8,
                  padding: '12px 16px', background: '#1e293b',
                  borderRadius: 8, color: '#fff' },
  timer:        { fontSize: 22, fontWeight: 700 },
  meta:         { color: '#64748b', fontSize: 13, marginBottom: 20 },
  questionCard: { background: '#fff', borderRadius: 8, padding: 20,
                  marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  qText:        { marginBottom: 14, fontSize: 15, color: '#1e293b' },
  optionGrid:   { display: 'flex', flexDirection: 'column', gap: 10 },
  option:       { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                  borderRadius: 6, border: '1.5px solid', cursor: 'pointer',
                  fontSize: 14, transition: 'all 0.15s ease' },
  optLetter:    { fontWeight: 700, width: 20, textAlign: 'center' },
  btnPrimary:   { width: '100%', padding: 14, background: '#4f46e5', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 16,
                  cursor: 'pointer', marginTop: 16 },
  resultCard:   { background: '#fff', padding: 32, borderRadius: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxWidth: 680, margin: '32px auto' },
  scoreBig:     { textAlign: 'center', padding: 24, borderRadius: 10, margin: '16px 0' },
  reviewCard:   { background: '#f8fafc', padding: 12, borderRadius: 6,
                  marginBottom: 10, paddingLeft: 16 },
};