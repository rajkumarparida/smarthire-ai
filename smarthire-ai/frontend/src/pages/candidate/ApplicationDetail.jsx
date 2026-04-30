import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const stageList = ['applied', 'exam', 'interview', 'selected'];

export default function ApplicationDetail() {
  const { appId }       = useParams();
  const navigate        = useNavigate();
  const [app, setApp]   = useState(null);

  useEffect(() => {
    api.get('/applications/my-applications')
      .then(res => {
        const found = res.data.find(a => a._id === appId);
        setApp(found || null);
      });
  }, [appId]);

  if (!app) return <p style={{ textAlign: 'center', marginTop: 80 }}>Loading...</p>;

  const stageList2 = ['applied','exam','interview','selected'];
  const currentIdx = stageList2.indexOf(app.stage);

  return (
    <div style={styles.container}>
      <button style={styles.back} onClick={() => navigate('/candidate/dashboard')}>
        ← Back
      </button>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>{app.job?.title}</h2>
          <p style={styles.meta}>{app.job?.company} • Applied {new Date(app.createdAt).toLocaleDateString()}</p>
        </div>
        {app.stage === 'rejected' && (
          <span style={styles.rejectedBadge}>❌ Rejected</span>
        )}
      </div>

      {/* Progress tracker */}
      {app.stage !== 'rejected' && (
        <div style={styles.progressBox}>
          <p style={styles.sectionTitle}>Application Progress</p>
          <div style={styles.stageTrack}>
            {stageList2.map((s, i) => (
              <div key={s} style={styles.stageStep}>
                <div style={{
                  ...styles.stepCircle,
                  background: i <= currentIdx ? '#4f46e5' : '#e2e8f0',
                  color:      i <= currentIdx ? '#fff'    : '#94a3b8',
                }}>
                  {i < currentIdx ? '✓' : i + 1}
                </div>
                <p style={{ ...styles.stepLabel,
                  color: i <= currentIdx ? '#4f46e5' : '#94a3b8',
                  fontWeight: i === currentIdx ? 700 : 400,
                }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </p>
                {i < stageList2.length - 1 && (
                  <div style={{ ...styles.stepLine,
                    background: i < currentIdx ? '#4f46e5' : '#e2e8f0' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Cards */}
      <div style={styles.scoresGrid}>
        <ScoreCard
          title="🎯 AI Match Score"
          score={app.matchScore}
          subtitle="Based on resume vs job skills"
        />
        <ScoreCard
          title="📝 Exam Score"
          score={app.examScore}
          subtitle={app.examPassed === null ? 'Not taken yet'
            : app.examPassed ? '✅ Passed' : '❌ Failed'}
        />
        <ScoreCard
          title="🎥 Interview Score"
          score={app.interviewScore}
          subtitle={app.interviewRemarks || 'Not evaluated yet'}
        />
      </div>

      {/* Skills */}
      {app.skills?.length > 0 && (
        <div style={styles.section}>
          <p style={styles.sectionTitle}>📄 Skills Detected in Resume</p>
          <div style={styles.skillWrap}>
            {app.skills.map(s => (
              <span key={s} style={styles.skillPill}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Job Required Skills */}
      {app.job?.requiredSkills?.length > 0 && (
        <div style={styles.section}>
          <p style={styles.sectionTitle}>🎯 Job Required Skills</p>
          <div style={styles.skillWrap}>
            {app.job.requiredSkills.map(s => {
              const matched = app.skills?.map(x => x.toLowerCase()).includes(s.toLowerCase());
              return (
                <span key={s} style={{
                  ...styles.skillPill,
                  background: matched ? '#dcfce7' : '#fee2e2',
                  color:      matched ? '#166534' : '#991b1b',
                }}>
                  {matched ? '✓' : '✗'} {s}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Exam CTA */}
      {app.stage === 'exam' && (
        <div style={styles.ctaBox}>
          <p style={{ margin: '0 0 12px', fontWeight: 600 }}>
            📝 You have a pending exam for this job!
          </p>
          <button style={styles.btnExam}
            onClick={() => navigate(`/exam/${app.job?._id}`)}>
            Take Exam Now →
          </button>
        </div>
      )}

    </div>
  );
}

const ScoreCard = ({ title, score, subtitle }) => {
  const color = score === null ? '#94a3b8'
    : score >= 70 ? '#16a34a'
    : score >= 40 ? '#d97706' : '#dc2626';
  return (
    <div style={scStyles.card}>
      <p style={scStyles.title}>{title}</p>
      <p style={{ ...scStyles.score, color }}>
        {score !== null ? `${score}%` : '—'}
      </p>
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, margin: '8px 0' }}>
        <div style={{ height: 6, width: `${score || 0}%`, background: color, borderRadius: 99 }} />
      </div>
      <p style={scStyles.sub}>{subtitle}</p>
    </div>
  );
};

const scStyles = {
  card:  { background: '#fff', padding: 20, borderRadius: 10,
           boxShadow: '0 2px 8px rgba(0,0,0,0.07)', textAlign: 'center' },
  title: { margin: '0 0 8px', fontWeight: 600, fontSize: 14, color: '#374151' },
  score: { fontSize: 36, fontWeight: 800, margin: 0 },
  sub:   { color: '#64748b', fontSize: 12, margin: 0 },
};

const styles = {
  container:    { maxWidth: 820, margin: '0 auto', padding: 28 },
  back:         { background: 'none', border: 'none', color: '#4f46e5',
                  cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 },
  header:       { display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 24 },
  meta:         { color: '#64748b', margin: '4px 0 0', fontSize: 14 },
  rejectedBadge:{ padding: '6px 16px', background: '#fee2e2', color: '#dc2626',
                  borderRadius: 99, fontWeight: 600 },
  progressBox:  { background: '#fff', borderRadius: 10, padding: 24,
                  marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  stageTrack:   { display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', position: 'relative' },
  stageStep:    { display: 'flex', flexDirection: 'column',
                  alignItems: 'center', flex: 1, position: 'relative' },
  stepCircle:   { width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, zIndex: 1 },
  stepLabel:    { fontSize: 12, margin: '6px 0 0', textAlign: 'center' },
  stepLine:     { position: 'absolute', top: 16, left: '50%',
                  width: '100%', height: 3, zIndex: 0 },
  scoresGrid:   { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                  gap: 16, marginBottom: 20 },
  section:      { background: '#fff', borderRadius: 10, padding: 20,
                  marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  sectionTitle: { margin: '0 0 12px', fontWeight: 600, fontSize: 14, color: '#374151' },
  skillWrap:    { display: 'flex', flexWrap: 'wrap', gap: 8 },
  skillPill:    { padding: '4px 12px', background: '#ede9fe', color: '#5b21b6',
                  borderRadius: 99, fontSize: 13 },
  ctaBox:       { background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: 10, padding: 20, textAlign: 'center' },
  btnExam:      { padding: '10px 24px', background: '#f59e0b', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 600, fontSize: 15 },
};