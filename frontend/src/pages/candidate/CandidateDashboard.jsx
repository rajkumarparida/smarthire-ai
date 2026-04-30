import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import api                     from '../../utils/api';
import { useAuth }             from '../../context/AuthContext';

const stageConfig = {
  applied:   { color: '#6366f1', bg: '#ede9fe', label: 'Applied',        icon: '📝' },
  exam:      { color: '#d97706', bg: '#fef3c7', label: 'Exam Pending',   icon: '📝' },
  interview: { color: '#2563eb', bg: '#dbeafe', label: 'Interview',      icon: '🎥' },
  selected:  { color: '#16a34a', bg: '#dcfce7', label: 'Selected',       icon: '🎉' },
  rejected:  { color: '#dc2626', bg: '#fee2e2', label: 'Rejected',       icon: '❌' },
};

export default function CandidateDashboard() {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout }      = useAuth();
  const navigate              = useNavigate();

  useEffect(() => {
    api.get('/applications/my-applications')
      .then(res => setApps(res.data))
      .finally(() => setLoading(false));
  }, []);

  // ── Summary stats ──────────────────────────────────────────────
  const stats = {
    total:     apps.length,
    selected:  apps.filter(a => a.stage === 'selected').length,
    interview: apps.filter(a => a.stage === 'interview').length,
    rejected:  apps.filter(a => a.stage === 'rejected').length,
    avgMatch:  apps.length
      ? Math.round(apps.reduce((s, a) => s + (a.matchScore || 0), 0) / apps.length)
      : 0,
  };

  // ── Best application by finalScore then matchScore ─────────────
  const best = apps.reduce((top, a) =>
    (a.matchScore > (top?.matchScore || 0)) ? a : top, null);

  if (loading) return <p style={styles.center}>Loading your dashboard...</p>;

  return (
    <div style={styles.container}>

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div style={styles.topBar}>
        <div>
          <h2 style={{ margin: 0 }}>👋 Welcome, {user?.name}</h2>
          <p style={styles.subtitle}>Track your applications and scores below</p>
        </div>
        <div style={styles.topActions}>
          <button style={styles.btnBrowse}
            onClick={() => navigate('/candidate/jobs')}>
            🔍 Browse Jobs
          </button>
          <button style={styles.btnLogout}
            onClick={() => { logout(); navigate('/login'); }}>
            Logout
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Total Applied',  value: stats.total,     color: '#6366f1', icon: '📋' },
          { label: 'Avg Match Score',value: `${stats.avgMatch}%`, color: '#f59e0b', icon: '🎯' },
          { label: 'Interviews',     value: stats.interview, color: '#2563eb', icon: '🎥' },
          { label: 'Selected',       value: stats.selected,  color: '#16a34a', icon: '🎉' },
        ].map(stat => (
          <div key={stat.label} style={{ ...styles.statCard, borderTop: `4px solid ${stat.color}` }}>
            <span style={{ fontSize: 28 }}>{stat.icon}</span>
            <p style={{ ...styles.statValue, color: stat.color }}>{stat.value}</p>
            <p style={styles.statLabel}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Best Application highlight ───────────────────────────── */}
      {best && (
        <div style={styles.bestCard}>
          <p style={styles.bestTitle}>⭐ Your Best Application</p>
          <div style={styles.bestInner}>
            <div>
              <p style={styles.bestJob}>{best.job?.title}</p>
              <p style={styles.bestCompany}>{best.job?.company}</p>
            </div>
            <div style={styles.bestScores}>
              <ScorePill label="Match"  value={best.matchScore} color="#4f46e5" />
              {best.examScore !== null &&
                <ScorePill label="Exam" value={best.examScore}  color="#f59e0b" />}
            </div>
          </div>
        </div>
      )}

      {/* ── Applications List ────────────────────────────────────── */}
      <h3 style={{ marginBottom: 12 }}>
        My Applications ({apps.length})
      </h3>

      {apps.length === 0 && (
        <div style={styles.emptyBox}>
          <p style={{ fontSize: 40 }}>📭</p>
          <p>No applications yet. Browse jobs and apply!</p>
          <button style={styles.btnBrowse}
            onClick={() => navigate('/candidate/jobs')}>
            Browse Jobs
          </button>
        </div>
      )}

      {apps.map(app => {
        const stage = stageConfig[app.stage] || stageConfig.applied;
        return (
          <div key={app._id} style={styles.appCard}>

            {/* Left: Job info */}
            <div style={styles.appLeft}>
              <div style={{ ...styles.stageIcon, background: stage.bg }}>
                {stage.icon}
              </div>
              <div>
                <p style={styles.jobTitle}>{app.job?.title}</p>
                <p style={styles.jobMeta}>
                  {app.job?.company} •{' '}
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>
                {/* Skills matched */}
                {app.skills?.length > 0 && (
                  <div style={styles.skillRow}>
                    {app.skills.slice(0, 4).map(s => (
                      <span key={s} style={styles.skillPill}>{s}</span>
                    ))}
                    {app.skills.length > 4 &&
                      <span style={styles.skillPill}>+{app.skills.length - 4}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Scores + stage */}
            <div style={styles.appRight}>
              {/* Score meters */}
              <div style={styles.scoreRow}>
                <ScoreMeter label="Match" value={app.matchScore} />
                {app.examScore !== null &&
                  <ScoreMeter label="Exam"  value={app.examScore} />}
              </div>

              {/* Stage badge */}
              <span style={{ ...styles.stageBadge,
                color: stage.color, background: stage.bg }}>
                {stage.label}
              </span>

              {/* Action buttons */}
              <div style={styles.actionRow}>
                {app.stage === 'exam' && (
                  <button style={styles.btnExam}
                    onClick={() => navigate(`/exam/${app.job?._id}`)}>
                    Take Exam →
                  </button>
                )}
                <button style={styles.btnDetail}
                  onClick={() => navigate(`/candidate/application/${app._id}`)}>
                  Details
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

const ScoreMeter = ({ label, value }) => {
  const color = value >= 70 ? '#16a34a' : value >= 40 ? '#f59e0b' : '#dc2626';
  return (
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{label}</p>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color }}>{value ?? '—'}%</p>
      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 99, marginTop: 2 }}>
        <div style={{ height: 4, width: `${value || 0}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
  );
};

const ScorePill = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', padding: '6px 14px',
    background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{label}</p>
    <p style={{ margin: 0, fontWeight: 700, fontSize: 20, color }}>{value}%</p>
  </div>
);

// ── Styles ─────────────────────────────────────────────────────────
const styles = {
  container:   { padding: 28, maxWidth: 900, margin: '0 auto' },
  center:      { textAlign: 'center', marginTop: 80, fontSize: 18 },
  topBar:      { display: 'flex', justifyContent: 'space-between',
                 alignItems: 'flex-start', marginBottom: 24 },
  subtitle:    { color: '#64748b', margin: '4px 0 0', fontSize: 14 },
  topActions:  { display: 'flex', gap: 8 },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                 gap: 16, marginBottom: 24 },
  statCard:    { background: '#fff', padding: 20, borderRadius: 10,
                 boxShadow: '0 2px 8px rgba(0,0,0,0.07)', textAlign: 'center' },
  statValue:   { fontSize: 28, fontWeight: 800, margin: '4px 0' },
  statLabel:   { color: '#64748b', fontSize: 13, margin: 0 },
  bestCard:    { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                 borderRadius: 10, padding: 20, marginBottom: 24, color: '#fff' },
  bestTitle:   { margin: '0 0 10px', fontWeight: 600, fontSize: 14, opacity: 0.85 },
  bestInner:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bestJob:     { margin: 0, fontWeight: 700, fontSize: 18 },
  bestCompany: { margin: '4px 0 0', opacity: 0.8, fontSize: 14 },
  bestScores:  { display: 'flex', gap: 10 },
  appCard:     { background: '#fff', borderRadius: 10, padding: 20,
                 marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                 display: 'flex', justifyContent: 'space-between',
                 alignItems: 'center', gap: 16 },
  appLeft:     { display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 },
  stageIcon:   { fontSize: 24, padding: 10, borderRadius: 10, flexShrink: 0 },
  jobTitle:    { margin: 0, fontWeight: 600, fontSize: 15 },
  jobMeta:     { margin: '3px 0', color: '#64748b', fontSize: 13 },
  skillRow:    { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 },
  skillPill:   { padding: '2px 8px', background: '#ede9fe', color: '#5b21b6',
                 borderRadius: 99, fontSize: 11 },
  appRight:    { display: 'flex', flexDirection: 'column',
                 alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  scoreRow:    { display: 'flex', gap: 16 },
  stageBadge:  { padding: '4px 12px', borderRadius: 99,
                 fontSize: 12, fontWeight: 600 },
  actionRow:   { display: 'flex', gap: 6 },
  btnExam:     { padding: '6px 12px', background: '#f59e0b', color: '#fff',
                 border: 'none', borderRadius: 6, cursor: 'pointer',
                 fontSize: 13, fontWeight: 600 },
  btnDetail:   { padding: '6px 12px', background: '#f1f5f9', color: '#334155',
                 border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  emptyBox:    { textAlign: 'center', padding: 48, background: '#fff',
                 borderRadius: 10, color: '#64748b' },
  btnBrowse:   { padding: '8px 16px', background: '#4f46e5', color: '#fff',
                 border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 8 },
  btnLogout:   { padding: '8px 16px', background: '#ef4444', color: '#fff',
                 border: 'none', borderRadius: 6, cursor: 'pointer' },
};