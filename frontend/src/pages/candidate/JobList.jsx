import { useEffect, useState } from 'react';
import api from '../../utils/api';

const stageColors = {
  applied:   '#6366f1', exam: '#f59e0b',
  interview: '#2563eb', selected: '#16a34a', rejected: '#ef4444',
};

export default function JobList() {
  const [jobs, setJobs]       = useState([]);
  const [applied, setApplied] = useState({});  // jobId → stage
  const [files, setFiles]     = useState({});
  const [result, setResult]   = useState({});
  const [msg, setMsg]         = useState('');
  const [loading, setLoading] = useState('');

  useEffect(() => {
    // Load jobs
    api.get('/jobs').then(res => setJobs(res.data));

    // Pre-mark already applied jobs
    api.get('/applications/my-applications').then(res => {
      const map = {};
      res.data.forEach(app => {
        if (app.job?._id) map[app.job._id] = app.stage;
      });
      setApplied(map);
    });
  }, []);

  const handleFile = (jobId, file) =>
    setFiles(prev => ({ ...prev, [jobId]: file }));

  const applyJob = async (jobId) => {
    if (!files[jobId]) {
      setMsg('⚠️ Please upload your resume first');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    setLoading(jobId);
    try {
      const formData = new FormData();
      formData.append('resume', files[jobId]);

      const res = await api.post(`/applications/${jobId}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setApplied(prev  => ({ ...prev, [jobId]: 'applied' }));
      setResult(prev   => ({ ...prev, [jobId]: res.data }));
      setMsg('✅ Applied successfully!');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadyApplied) {
        setApplied(prev => ({ ...prev, [jobId]: data.stage || 'applied' }));
        setMsg('You have already applied to this job.');
      } else {
        setMsg(data?.message || 'Failed to apply');
      }
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setLoading('');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Available Jobs</h2>
      {msg && <p style={styles.msg}>{msg}</p>}

      {jobs.length === 0 && (
        <p style={{ color: '#888' }}>No jobs available right now.</p>
      )}

      {jobs.map(job => (
        <div key={job._id} style={styles.card}>

          {/* Job Info */}
          <h4 style={{ margin: 0 }}>{job.title}</h4>
          <p style={styles.sub}>
            {job.company} • {job.location} • {job.experienceLevel}
          </p>
          <p style={styles.skills}>
            Required: {job.requiredSkills?.join(', ')}
          </p>
          <p style={styles.desc}>{job.description?.slice(0, 120)}...</p>

          {/* Apply / Already Applied */}
          {!applied[job._id] ? (
            <div style={styles.applyRow}>
              <input
                type="file" accept=".txt,.pdf"
                style={styles.fileInput}
                onChange={(e) => handleFile(job._id, e.target.files[0])}
              />
              <button
                style={loading === job._id ? styles.btnLoading : styles.btnApply}
                onClick={() => applyJob(job._id)}
                disabled={loading === job._id}>
                {loading === job._id ? 'Applying...' : 'Apply Now'}
              </button>
            </div>
          ) : (
            <div style={styles.alreadyApplied}>
              ✅ Already Applied
              <span style={{
                ...styles.stageBadge,
                background: stageColors[applied[job._id]] || '#6366f1',
              }}>
                {applied[job._id]?.toUpperCase()}
              </span>
            </div>
          )}

          {/* AI Score result after applying */}
          {result[job._id]?.analysis && (() => {
            const { finalScore, recommendation, breakdown, details } =
              result[job._id].analysis;
            const recColor = {
              'Strongly Recommended': '#16a34a',
              'Recommended':          '#2563eb',
              'Maybe':                '#d97706',
              'Not Recommended':      '#dc2626',
            }[recommendation];

            return (
              <div style={styles.scoreBox}>
                <div style={styles.scoreHeader}>
                  <span style={styles.bigScore}>{finalScore}%</span>
                  <span style={{ ...styles.recBadge, background: recColor }}>
                    {recommendation}
                  </span>
                </div>
                <div style={styles.breakdownGrid}>
                  {[
                    { label: 'Skill Match',    value: breakdown.skillScore,      weight: '50%' },
                    { label: 'Experience',     value: breakdown.experienceScore,  weight: '20%' },
                    { label: 'Education',      value: breakdown.educationScore,   weight: '15%' },
                    { label: 'Certifications', value: breakdown.certScore,        weight: '15%' },
                  ].map(item => (
                    <div key={item.label} style={styles.barRow}>
                      <div style={styles.barLabel}>
                        <span>{item.label}</span>
                        <span style={{ color:'#6b7280', fontSize:11 }}>
                          ({item.weight})
                        </span>
                      </div>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill,
                          width: `${item.value}%`,
                          background: item.value >= 70
                            ? '#16a34a' : item.value >= 40
                            ? '#d97706' : '#dc2626',
                        }} />
                      </div>
                      <span style={styles.barValue}>{item.value}%</span>
                    </div>
                  ))}
                </div>
                <div style={styles.detailGrid}>
                  <p style={styles.detailItem}>
                    🎓 Education: <strong>{details.educationLevel}</strong>
                  </p>
                  <p style={styles.detailItem}>
                    💼 Experience: <strong>{details.experienceLevel}</strong>
                  </p>
                  <p style={styles.detailItem}>
                    ✅ Matched: <strong>{details.matchedJobSkills.join(', ') || 'None'}</strong>
                  </p>
                  <p style={styles.detailItem}>
                    ❌ Missing:{' '}
                    <strong style={{ color: '#dc2626' }}>
                      {details.missingSkills.join(', ') || 'None'}
                    </strong>
                  </p>
                </div>
              </div>
            );
          })()}

        </div>
      ))}
    </div>
  );
}

const styles = {
  container:    { padding: 32, maxWidth: 800, margin: '0 auto' },
  card:         { background: '#fff', padding: 20, borderRadius: 8,
                  marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  sub:          { color: '#666', fontSize: 13, margin: '4px 0' },
  skills:       { color: '#4f46e5', fontSize: 13, margin: '4px 0' },
  desc:         { color: '#555', fontSize: 13, marginBottom: 12 },
  applyRow:     { display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 },
  fileInput:    { flex: 1, fontSize: 13 },
  btnApply:     { padding: '8px 18px', background: '#4f46e5', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                  whiteSpace: 'nowrap' },
  btnLoading:   { padding: '8px 18px', background: '#a5b4fc', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'default',
                  whiteSpace: 'nowrap' },
  alreadyApplied: { display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px', background: '#f0fdf4',
                    borderRadius: 8, color: '#16a34a',
                    fontWeight: 600, fontSize: 14, marginTop: 12 },
  stageBadge:   { padding: '2px 10px', borderRadius: 99, color: '#fff',
                  fontSize: 11, fontWeight: 700 },
  msg:          { color: '#16a34a', marginBottom: 12, fontWeight: 500 },
  scoreBox:     { marginTop: 12, padding: 16, background: '#f8fafc',
                  borderRadius: 8, border: '1px solid #e2e8f0' },
  scoreHeader:  { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 },
  bigScore:     { fontSize: 36, fontWeight: 700, color: '#1e293b' },
  recBadge:     { padding: '4px 12px', borderRadius: 20, color: '#fff',
                  fontSize: 13, fontWeight: 600 },
  breakdownGrid:{ marginBottom: 14 },
  barRow:       { display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 8, fontSize: 13 },
  barLabel:     { width: 120, display: 'flex', gap: 4, alignItems: 'center' },
  barTrack:     { flex: 1, background: '#e2e8f0', borderRadius: 99, height: 8 },
  barFill:      { height: 8, borderRadius: 99, transition: 'width 0.4s ease' },
  barValue:     { width: 36, textAlign: 'right', fontWeight: 600, fontSize: 13 },
  detailGrid:   { borderTop: '1px solid #e2e8f0', paddingTop: 12 },
  detailItem:   { margin: '4px 0', fontSize: 13, color: '#374151' },
};