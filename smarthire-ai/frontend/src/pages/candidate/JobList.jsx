import { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function JobList() {
  const [jobs, setJobs]       = useState([]);
  const [applied, setApplied] = useState({});
  const [files, setFiles]     = useState({});
  const [result, setResult]   = useState({});
  const [msg, setMsg]         = useState('');
  const [loading, setLoading] = useState('');

  useEffect(() => {
    api.get('/jobs').then(res => setJobs(res.data));
  }, []);

  const handleFile = (jobId, file) => {
    setFiles(prev => ({ ...prev, [jobId]: file }));
  };

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
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setApplied(prev  => ({ ...prev,  [jobId]: true }));
      setResult(prev   => ({ ...prev,  [jobId]: res.data }));
      setMsg('✅ Applied successfully!');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to apply');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setLoading('');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Available Jobs</h2>
      {msg && <p style={styles.msg}>{msg}</p>}

      {jobs.length === 0 && <p style={{ color: '#888' }}>No jobs available right now.</p>}

      {jobs.map(job => (
        <div key={job._id} style={styles.card}>

          {/* Job Info */}
          <h4 style={{ margin: 0 }}>{job.title}</h4>
          <p style={styles.sub}>{job.company} • {job.location} • {job.experienceLevel}</p>
          <p style={styles.skills}>Required: {job.requiredSkills.join(', ')}</p>
          <p style={styles.desc}>{job.description?.slice(0, 120)}...</p>

          {/* Apply Section */}
          {!applied[job._id] ? (
            <div style={styles.applyRow}>
              <input
                type="file"
                accept=".txt,.pdf"
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
            <div>
              <span style={styles.btnApplied}>✅ Applied</span>

              {/* Show AI match result */}
              {result[job._id] && (
                <div style={styles.scoreBox}>
                  <p style={styles.scoreText}>
                    🎯 Match Score: <strong>{result[job._id].matchScore}%</strong>
                  </p>
                  <p style={styles.scoreText}>
                    ✅ Matched Skills: <strong>{result[job._id].matchedSkills?.join(', ') || 'None'}</strong>
                  </p>
                  <p style={styles.scoreText}>
                    📄 Extracted Skills: <strong>{result[job._id].extractedSkills?.join(', ') || 'None'}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container:  { padding: 32, maxWidth: 800, margin: '0 auto' },
  card:       { background: '#fff', padding: 20, borderRadius: 8, marginBottom: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  sub:        { color: '#666', fontSize: 13, margin: '4px 0' },
  skills:     { color: '#4f46e5', fontSize: 13, margin: '4px 0' },
  desc:       { color: '#555', fontSize: 13, marginBottom: 12 },
  applyRow:   { display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 },
  fileInput:  { flex: 1, fontSize: 13 },
  btnApply:   { padding: '8px 18px', background: '#4f46e5', color: '#fff',
                border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnLoading: { padding: '8px 18px', background: '#a5b4fc', color: '#fff',
                border: 'none', borderRadius: 6, cursor: 'default', whiteSpace: 'nowrap' },
  btnApplied: { padding: '6px 14px', background: '#d1fae5', color: '#065f46',
                borderRadius: 6, fontSize: 13, fontWeight: 600 },
  scoreBox:   { marginTop: 12, padding: 12, background: '#f0fdf4',
                borderRadius: 8, border: '1px solid #bbf7d0' },
  scoreText:  { margin: '4px 0', fontSize: 13, color: '#166534' },
  msg:        { color: 'green', marginBottom: 12, fontWeight: 500 },
};