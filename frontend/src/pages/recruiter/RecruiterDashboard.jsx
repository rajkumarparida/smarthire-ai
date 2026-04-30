import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import api                     from '../../utils/api';
import { useAuth }             from '../../context/AuthContext';

export default function RecruiterDashboard() {
  const [jobs, setJobs]     = useState([]);
  const [counts, setCounts] = useState({});  // jobId → applicant count
  const [loading, setLoading] = useState(true);
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();

  useEffect(() => {
    api.get('/jobs/my-jobs').then(async res => {
      setJobs(res.data);

      // Fetch applicant count per job
      const countMap = {};
      await Promise.all(res.data.map(async job => {
        const r = await api.get(`/applications/${job._id}/applicants`);
        countMap[job._id] = r.data.length;
      }));
      setCounts(countMap);
    }).finally(() => setLoading(false));
  }, []);

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    await api.delete(`/jobs/${id}`);
    setJobs(jobs.filter(j => j._id !== id));
  };

  // ── Summary stats ─────────────────────────────────────────────
  const totalApplicants = Object.values(counts).reduce((s, c) => s + c, 0);
  const activeJobs      = jobs.filter(j => j.isActive).length;

  if (loading) return <p style={styles.center}>Loading dashboard...</p>;

  return (
    <div style={styles.container}>

      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div style={styles.topBar}>
        <div>
          <h2 style={{ margin: 0 }}>🏢 Recruiter Dashboard</h2>
          <p style={styles.subtitle}>Welcome back, {user?.name}</p>
        </div>
        <div style={styles.topActions}>
          <button style={styles.btnPost}
            onClick={() => navigate('/recruiter/post-job')}>
            + Post New Job
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
          { label: 'Jobs Posted',      value: jobs.length,      color: '#6366f1', icon: '📋' },
          { label: 'Active Jobs',      value: activeJobs,       color: '#16a34a', icon: '✅' },
          { label: 'Total Applicants', value: totalApplicants,  color: '#f59e0b', icon: '👥' },
          { label: 'Avg Applicants',   value: jobs.length
              ? Math.round(totalApplicants / jobs.length) : 0,  color: '#2563eb', icon: '📊' },
        ].map(s => (
          <div key={s.label}
            style={{ ...styles.statCard, borderTop: `4px solid ${s.color}` }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
            <p style={styles.statLabel}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Jobs Table ───────────────────────────────────────────── */}
      <div style={styles.tableBox}>
        <div style={styles.tableHeader}>
          <h3 style={{ margin: 0 }}>Your Job Postings</h3>
        </div>

        {jobs.length === 0 && (
          <div style={styles.emptyBox}>
            <p style={{ fontSize: 36 }}>📭</p>
            <p>No jobs posted yet.</p>
            <button style={styles.btnPost}
              onClick={() => navigate('/recruiter/post-job')}>
              Post Your First Job
            </button>
          </div>
        )}

        {jobs.map(job => (
          <div key={job._id} style={styles.jobRow}>

            {/* Left */}
            <div style={styles.jobLeft}>
              <div style={styles.jobDot(job.isActive)} />
              <div>
                <p style={styles.jobTitle}>{job.title}</p>
                <p style={styles.jobMeta}>
                  {job.company} • {job.location} • {job.experienceLevel}
                </p>
                <div style={styles.skillRow}>
                  {job.requiredSkills?.slice(0, 4).map(s => (
                    <span key={s} style={styles.skillPill}>{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right */}
            <div style={styles.jobRight}>
              {/* Applicant count badge */}
              <div style={styles.countBadge}>
                <p style={styles.countNum}>{counts[job._id] || 0}</p>
                <p style={styles.countLabel}>Applicants</p>
              </div>

              {/* Last date */}
              {job.lastDate && (
                <p style={styles.deadline}>
                  📅 {new Date(job.lastDate).toLocaleDateString()}
                </p>
              )}

              {/* Actions */}
              <div style={styles.actionRow}>
                <button style={styles.btnView}
                  onClick={() => navigate(`/recruiter/applicants/${job._id}`)}>
                  View Applicants
                </button>
                <button style={styles.btnExam}
                  onClick={() => navigate(`/recruiter/applicants/${job._id}`)}>
                  Manage
                </button>
                <button style={styles.btnDel}
                  onClick={() => deleteJob(job._id)}>
                  🗑
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container:   { padding: 28, maxWidth: 960, margin: '0 auto' },
  center:      { textAlign: 'center', marginTop: 80, fontSize: 18 },
  topBar:      { display: 'flex', justifyContent: 'space-between',
                 alignItems: 'flex-start', marginBottom: 24 },
  subtitle:    { color: '#64748b', margin: '4px 0 0', fontSize: 14 },
  topActions:  { display: 'flex', gap: 8 },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                 gap: 16, marginBottom: 24 },
  statCard:    { background: '#fff', padding: 20, borderRadius: 10,
                 boxShadow: '0 2px 8px rgba(0,0,0,0.07)', textAlign: 'center' },
  statValue:   { fontSize: 28, fontWeight: 800, margin: '4px 0' },
  statLabel:   { color: '#64748b', fontSize: 13, margin: 0 },
  tableBox:    { background: '#fff', borderRadius: 10,
                 boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' },
  tableHeader: { padding: '16px 20px', borderBottom: '1px solid #f1f5f9' },
  emptyBox:    { textAlign: 'center', padding: 48, color: '#64748b' },
  jobRow:      { display: 'flex', justifyContent: 'space-between',
                 alignItems: 'center', padding: '18px 20px',
                 borderBottom: '1px solid #f1f5f9', gap: 16 },
  jobLeft:     { display: 'flex', gap: 12, flex: 1 },
  jobDot:      (active) => ({
                 width: 10, height: 10, borderRadius: '50%',
                 flexShrink: 0, marginTop: 6,
                 background: active ? '#16a34a' : '#94a3b8' }),
  jobTitle:    { margin: 0, fontWeight: 600, fontSize: 15 },
  jobMeta:     { margin: '3px 0', color: '#64748b', fontSize: 13 },
  skillRow:    { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 },
  skillPill:   { padding: '2px 8px', background: '#ede9fe', color: '#5b21b6',
                 borderRadius: 99, fontSize: 11 },
  jobRight:    { display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 },
  countBadge:  { textAlign: 'center', padding: '6px 14px',
                 background: '#f8fafc', borderRadius: 8,
                 border: '1px solid #e2e8f0' },
  countNum:    { margin: 0, fontWeight: 700, fontSize: 20, color: '#4f46e5' },
  countLabel:  { margin: 0, fontSize: 11, color: '#94a3b8' },
  deadline:    { fontSize: 12, color: '#94a3b8', margin: 0 },
  actionRow:   { display: 'flex', gap: 6 },
  btnPost:     { padding: '8px 16px', background: '#4f46e5', color: '#fff',
                 border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  btnView:     { padding: '6px 12px', background: '#10b981', color: '#fff',
                 border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  btnExam:     { padding: '6px 12px', background: '#f59e0b', color: '#fff',
                 border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  btnDel:      { padding: '6px 10px', background: '#fee2e2', color: '#dc2626',
                 border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  btnLogout:   { padding: '8px 16px', background: '#ef4444', color: '#fff',
                 border: 'none', borderRadius: 6, cursor: 'pointer' },
};