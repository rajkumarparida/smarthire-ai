import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const stageConfig = {
  applied:   { color: '#6366f1', bg: '#ede9fe' },
  exam:      { color: '#d97706', bg: '#fef3c7' },
  interview: { color: '#2563eb', bg: '#dbeafe' },
  selected:  { color: '#16a34a', bg: '#dcfce7' },
  rejected:  { color: '#dc2626', bg: '#fee2e2' },
};

export default function Applicants() {
  const { jobId }                   = useParams();
  const navigate                    = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [job, setJob]               = useState(null);
  const [filter, setFilter]         = useState('all');
  const [examMsg, setExamMsg]       = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/applications/${jobId}/applicants`),
      api.get(`/jobs/${jobId}`),
    ]).then(([appsRes, jobRes]) => {
      setApplicants(appsRes.data);
      setJob(jobRes.data);
    }).finally(() => setLoading(false));
  }, [jobId]);

  // ── Stage update ─────────────────────────────────────────────
  const updateStage = async (appId, newStage) => {
    try {
      await api.patch(`/applications/${appId}/stage`, { stage: newStage });
      setApplicants(prev =>
        prev.map(a => a._id === appId ? { ...a, stage: newStage } : a)
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stage');
    }
  };

  const generateExam = async () => {
    try {
      const res = await api.post(`/exam/${jobId}/generate`);
      setExamMsg(`✅ ${res.data.title} — generated!`);
      setTimeout(() => setExamMsg(''), 4000);
    } catch (err) {
      setExamMsg(err.response?.data?.message || 'Failed');
    }
  };

  // ── Filter + sort ─────────────────────────────────────────────
  const displayed = applicants
    .filter(a => filter === 'all' || a.stage === filter)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  // ── Stage counts ──────────────────────────────────────────────
  const stageCounts = applicants.reduce((acc, a) => {
    acc[a.stage] = (acc[a.stage] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <p style={styles.center}>Loading applicants...</p>;

  return (
    <div style={styles.container}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={styles.topBar}>
        <div>
          <button style={styles.back}
            onClick={() => navigate('/recruiter/dashboard')}>
            ← Dashboard
          </button>
          <h2 style={{ margin: '4px 0 0' }}>
            {job?.title} — Applicants
          </h2>
          <p style={styles.subtitle}>
            {job?.company} • {applicants.length} total applicants •
            Ranked by AI Match Score
          </p>
        </div>
        <button style={styles.btnGenerate} onClick={generateExam}>
          ⚡ Generate Exam
        </button>
      </div>

      {examMsg && <div style={styles.examMsg}>{examMsg}</div>}

      {/* ── Stage filter tabs ────────────────────────────────────── */}
      <div style={styles.filterRow}>
        {['all', 'applied', 'exam', 'interview', 'selected', 'rejected'].map(f => (
          <button key={f} style={{
            ...styles.filterBtn,
            background: filter === f ? '#4f46e5' : '#f1f5f9',
            color:      filter === f ? '#fff'    : '#64748b',
          }} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && stageCounts[f]
              ? ` (${stageCounts[f]})` : ''}
            {f === 'all' ? ` (${applicants.length})` : ''}
          </button>
        ))}
      </div>

      {/* ── Applicant Cards ──────────────────────────────────────── */}
      {displayed.length === 0 && (
        <div style={styles.emptyBox}>
          <p style={{ fontSize: 36 }}>👥</p>
          <p>No applicants in this stage.</p>
        </div>
      )}

      {displayed.map((app, i) => {
        const stage = stageConfig[app.stage] || stageConfig.applied;
        return (
          <div key={app._id} style={styles.card}>

            {/* Rank */}
            <div style={styles.rank}>
              <p style={styles.rankNum}>#{i + 1}</p>
              <p style={styles.rankLabel}>Rank</p>
            </div>

            {/* Candidate info */}
            <div style={styles.info}>
              <p style={styles.name}>{app.candidate?.name}</p>
              <p style={styles.email}>{app.candidate?.email}</p>
              {app.skills?.length > 0 && (
                <div style={styles.skillRow}>
                  {app.skills.slice(0, 5).map(s => (
                    <span key={s} style={styles.skillPill}>{s}</span>
                  ))}
                  {app.skills.length > 5 &&
                    <span style={styles.skillPill}>+{app.skills.length - 5}</span>}
                </div>
              )}
            </div>

            {/* Scores */}
            <div style={styles.scoreCol}>
              <ScoreBox label="Match" value={app.matchScore} color="#4f46e5" />
              <ScoreBox label="Exam"  value={app.examScore}  color="#f59e0b" />
            </div>

            {/* Stage + actions */}
            <div style={styles.stageCol}>
              <span style={{ ...styles.stageBadge,
                color: stage.color, background: stage.bg }}>
                {app.stage.toUpperCase()}
              </span>

              {/* Resume link */}
              {app.resumeUrl && (
                <a href={`http://localhost:5000${app.resumeUrl}`}
                  target="_blank" rel="noreferrer"
                  style={styles.resumeLink}>
                  📄 Resume
                </a>
              )}

              {/* Stage action buttons */}
              <div style={styles.actionCol}>
                {app.stage === 'applied' && (
                  <>
                    <button style={styles.btnPromote}
                      onClick={() => updateStage(app._id, 'exam')}>
                      → Send to Exam
                    </button>
                    <button style={styles.btnReject}
                      onClick={() => updateStage(app._id, 'rejected')}>
                      Reject
                    </button>
                  </>
                )}
                {app.stage === 'exam' && (
                  <>
                    <button style={styles.btnPromote}
                      onClick={() => updateStage(app._id, 'interview')}>
                      → To Interview
                    </button>
                    <button style={styles.btnReject}
                      onClick={() => updateStage(app._id, 'rejected')}>
                      Reject
                    </button>
                  </>
                )}
                {app.stage === 'interview' && (
                  <>
                    <button style={styles.btnSelect}
                      onClick={() => updateStage(app._id, 'selected')}>
                      ✓ Select
                    </button>
                    <button style={styles.btnReject}
                      onClick={() => updateStage(app._id, 'rejected')}>
                      Reject
                    </button>
                  </>
                )}
                {app.stage === 'selected' && (
                  <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                    🎉 Hired
                  </span>
                )}
                {app.stage === 'rejected' && (
                  <button style={styles.btnPromote}
                    onClick={() => updateStage(app._id, 'applied')}>
                    ↩ Restore
                  </button>
                )}
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}

const ScoreBox = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', minWidth: 64 }}>
    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{label}</p>
    <p style={{ margin: 0, fontWeight: 700, fontSize: 20,
      color: value === null ? '#cbd5e1' : color }}>
      {value !== null ? `${value}%` : '—'}
    </p>
  </div>
);

const styles = {
  container:   { padding: 28, maxWidth: 1000, margin: '0 auto' },
  center:      { textAlign: 'center', marginTop: 80, fontSize: 18 },
  topBar:      { display: 'flex', justifyContent: 'space-between',
                 alignItems: 'flex-start', marginBottom: 16 },
  back:        { background: 'none', border: 'none', color: '#4f46e5',
                 cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 4 },
  subtitle:    { color: '#64748b', margin: '4px 0 0', fontSize: 13 },
  examMsg:     { padding: 12, background: '#f0fdf4', borderRadius: 8,
                 color: '#16a34a', marginBottom: 16, fontWeight: 500 },
  filterRow:   { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  filterBtn:   { padding: '6px 14px', border: 'none', borderRadius: 99,
                 cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  emptyBox:    { textAlign: 'center', padding: 48, color: '#94a3b8',
                 background: '#fff', borderRadius: 10 },
  card:        { background: '#fff', borderRadius: 10, padding: '16px 20px',
                 marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                 display: 'flex', alignItems: 'center', gap: 16 },
  rank:        { textAlign: 'center', minWidth: 40 },
  rankNum:     { margin: 0, fontWeight: 800, fontSize: 18, color: '#94a3b8' },
  rankLabel:   { margin: 0, fontSize: 10, color: '#cbd5e1' },
  info:        { flex: 1 },
  name:        { margin: 0, fontWeight: 600, fontSize: 15 },
  email:       { margin: '2px 0', fontSize: 13, color: '#64748b' },
  skillRow:    { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 },
  skillPill:   { padding: '2px 8px', background: '#ede9fe', color: '#5b21b6',
                 borderRadius: 99, fontSize: 11 },
  scoreCol:    { display: 'flex', gap: 16 },
  stageCol:    { display: 'flex', flexDirection: 'column',
                 alignItems: 'flex-end', gap: 8, minWidth: 140 },
  stageBadge:  { padding: '3px 10px', borderRadius: 99,
                 fontSize: 11, fontWeight: 700 },
  resumeLink:  { fontSize: 12, color: '#4f46e5', textDecoration: 'none' },
  actionCol:   { display: 'flex', flexDirection: 'column', gap: 4, width: '100%' },
  btnPromote:  { padding: '5px 10px', background: '#4f46e5', color: '#fff',
                 border: 'none', borderRadius: 6, cursor: 'pointer',
                 fontSize: 12, fontWeight: 600 },
  btnSelect:   { padding: '5px 10px', background: '#16a34a', color: '#fff',
                 border: 'none', borderRadius: 6, cursor: 'pointer',
                 fontSize: 12, fontWeight: 600 },
  btnReject:   { padding: '5px 10px', background: '#fee2e2', color: '#dc2626',
                 border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  btnGenerate: { padding: '8px 16px', background: '#f59e0b', color: '#fff',
                 border: 'none', borderRadius: 6, cursor: 'pointer',
                 fontWeight: 600, whiteSpace: 'nowrap' },
};