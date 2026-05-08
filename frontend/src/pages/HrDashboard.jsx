import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGE_BADGE = {
  interview: { bg:'#ede9fe', color:'#5b21b6', label:'In Review' },
  selected:  { bg:'#d1fae5', color:'#065f46', label:'Selected' },
  rejected:  { bg:'#fef2f2', color:'#991b1b', label:'Rejected' },
  exam:      { bg:'#e0f2fe', color:'#0c4a6e', label:'Exam' },
  applied:   { bg:'#f1f5f9', color:'#475569', label:'Applied' },
};

export default function HRDashboard() {
  const { jobId } = useParams();

  const [candidates, setCandidates] = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(new Set()); // multi-select
  const [filter,     setFilter]     = useState('all');     // all|pending|selected|rejected
  const [search,     setSearch]     = useState('');
  const [deciding,   setDeciding]   = useState({});        // { appId: true }
  const [modal,      setModal]      = useState(null);      // { app, action }
  const [remarks,    setRemarks]    = useState('');
  const [toast,      setToast]      = useState('');

  // ── Load data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [qRes, sRes] = await Promise.all([
        api.get(`/hr/${jobId}/queue`),
        api.get(`/hr/${jobId}/pipeline`),
      ]);
      setCandidates(qRes.data);
      setStats(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Single decision ───────────────────────────────────────────────────────
  const decide = async (appId, decision, remarksText) => {
    setDeciding(d => ({ ...d, [appId]: true }));
    try {
      const { data } = await api.patch(`/hr/${appId}/decision`, {
        decision, remarks: remarksText,
      });
      showToast(data.message);
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error');
    } finally {
      setDeciding(d => ({ ...d, [appId]: false }));
      setModal(null);
      setRemarks('');
    }
  };

  // ── Bulk decision ─────────────────────────────────────────────────────────
  const bulkDecide = async (decision) => {
    if (!selected.size) return;
    if (!window.confirm(`Apply "${decision}" to ${selected.size} candidates?`)) return;
    try {
      const { data } = await api.post('/hr/bulk-decision', {
        appIds: [...selected], decision, remarks,
      });
      showToast(data.message);
      setSelected(new Set());
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Bulk error');
    }
  };

  // ── Filter + search ───────────────────────────────────────────────────────
  const visible = candidates.filter(c => {
    const stageMatch = filter === 'all' ? true
      : filter === 'pending'  ? c.stage === 'interview'
      : c.stage === filter;
    const name = c.candidate?.name?.toLowerCase() || '';
    const searchMatch = name.includes(search.toLowerCase());
    return stageMatch && searchMatch;
  });

  const toggleSelect = (id) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll = () =>
    setSelected(new Set(visible.map(c => c._id)));

  if (loading) return (
    <div style={s.page}>
      <div style={{ textAlign:'center', color:'#94a3b8', paddingTop:80 }}>
        Loading HR dashboard…
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={{ margin:0, color:'#1e293b', fontSize:22 }}>
            🏢 Round 3 — HR Review Dashboard
          </h2>
          <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:14 }}>
            Review candidates who passed Round 1 & 2
          </p>
        </div>
      </div>

      {/* Pipeline stats */}
      {stats && (
        <div style={s.statsRow}>
          {[
            { label:'Total Applied',  val: stats.total,     icon:'👥', color:'#4f46e5' },
            { label:'In Exam',        val: stats.exam,      icon:'📝', color:'#0ea5e9' },
            { label:'In Interview',   val: stats.interview, icon:'🎥', color:'#8b5cf6' },
            { label:'Selected',       val: stats.selected,  icon:'✅', color:'#10b981' },
            { label:'Rejected',       val: stats.rejected,  icon:'❌', color:'#ef4444' },
          ].map(item => (
            <div key={item.label} style={s.statCard}>
              <span style={{ fontSize:22 }}>{item.icon}</span>
              <span style={{ fontSize:26, fontWeight:800, color:item.color }}>
                {item.val}
              </span>
              <span style={{ fontSize:12, color:'#64748b' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls bar */}
      <div style={s.controls}>
        <input
          style={s.searchInput}
          placeholder="🔍 Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display:'flex', gap:6 }}>
          {['all','pending','selected','rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              ...s.filterBtn,
              background: filter === f ? '#4f46e5' : '#f1f5f9',
              color:      filter === f ? '#fff'    : '#475569',
            }}>
              {f === 'pending' ? 'Pending Review' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
            <span style={{ color:'#64748b', fontSize:13, alignSelf:'center' }}>
              {selected.size} selected
            </span>
            <button style={{ ...s.bulkBtn, background:'#10b981' }}
              onClick={() => bulkDecide('selected')}>✅ Bulk Select</button>
            <button style={{ ...s.bulkBtn, background:'#ef4444' }}
              onClick={() => bulkDecide('rejected')}>❌ Bulk Reject</button>
          </div>
        )}
        <button style={s.filterBtn} onClick={selectAll}>Select All</button>
      </div>

      {/* Candidate table */}
      {visible.length === 0 ? (
        <div style={{ textAlign:'center', color:'#94a3b8', padding:'60px 0' }}>
          No candidates match current filter.
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={s.table}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                <Th><input type="checkbox" onChange={e => e.target.checked ? selectAll() : setSelected(new Set())} /></Th>
                <Th>#</Th>
                <Th>Candidate</Th>
                <Th>Exam Score</Th>
                <Th>Interview Score</Th>
                <Th>Face %</Th>
                <Th>Tab Switches</Th>
                <Th>Stage</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c, idx) => {
                const badge  = STAGE_BADGE[c.stage] || STAGE_BADGE.applied;
                const sess   = c.interviewSession;
                const totalPings = sess ? (sess.facePresent + sess.faceAbsent) || 1 : null;
                const facePct    = sess ? Math.round((sess.facePresent / totalPings) * 100) : '—';
                const tabSw      = sess ? sess.tabSwitches : '—';
                const isPending  = c.stage === 'interview';
                const isLoading  = deciding[c._id];

                return (
                  <tr key={c._id} style={{
                    background: selected.has(c._id) ? '#ede9fe' : 'transparent',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <Td>
                      <input type="checkbox"
                        checked={selected.has(c._id)}
                        onChange={() => toggleSelect(c._id)} />
                    </Td>
                    <Td style={{ color:'#94a3b8', fontSize:13 }}>{idx + 1}</Td>
                    <Td>
                      <p style={{ margin:0, fontWeight:700, color:'#1e293b' }}>
                        {c.candidate?.name || '—'}
                      </p>
                      <p style={{ margin:0, fontSize:12, color:'#64748b' }}>
                        {c.candidate?.email}
                      </p>
                    </Td>
                    <Td>
                      <ScorePill value={c.examScore} high={80} mid={60} />
                    </Td>
                    <Td>
                      <ScorePill value={c.interviewScore} high={75} mid={50} />
                    </Td>
                    <Td>
                      {sess
                        ? <ScorePill value={facePct} high={80} mid={60} suffix="%" />
                        : <span style={{ color:'#94a3b8', fontSize:12 }}>—</span>}
                    </Td>
                    <Td>
                      {sess
                        ? <span style={{
                            color: tabSw > 3 ? '#dc2626' : tabSw > 1 ? '#d97706' : '#10b981',
                            fontWeight:700, fontSize:14,
                          }}>{tabSw}</span>
                        : '—'}
                    </Td>
                    <Td>
                      <span style={{
                        ...s.badge, background: badge.bg, color: badge.color,
                      }}>{badge.label}</span>
                    </Td>
                    <Td>
                      {isPending ? (
                        <div style={{ display:'flex', gap:6 }}>
                          <ActionBtn
                            color="#10b981"
                            disabled={isLoading}
                            onClick={() => setModal({ app: c, action:'selected' })}
                          >✅ Select</ActionBtn>
                          <ActionBtn
                            color="#ef4444"
                            disabled={isLoading}
                            onClick={() => setModal({ app: c, action:'rejected' })}
                          >❌ Reject</ActionBtn>
                          <ActionBtn
                            color="#8b5cf6"
                            disabled={isLoading}
                            onClick={() => setModal({ app: c, action:'next_round' })}
                          >↗ Next</ActionBtn>
                        </div>
                      ) : (
                        <span style={{ fontSize:12, color:'#94a3b8' }}>Decided</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision modal */}
      {modal && (
        <div style={s.modalOverlay} onClick={() => setModal(null)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin:'0 0 6px', color:'#1e293b' }}>
              {modal.action === 'selected' ? '✅ Select Candidate'
                : modal.action === 'rejected' ? '❌ Reject Candidate'
                : '↗ Move to Next Round'}
            </h3>
            <p style={{ color:'#64748b', fontSize:14, marginBottom:16 }}>
              <strong>{modal.app.candidate?.name}</strong> —
              Exam: {modal.app.examScore}% · Interview: {modal.app.interviewScore}
            </p>
            <label style={s.label}>Remarks (optional)</label>
            <textarea
              style={s.textarea}
              rows={3}
              placeholder="Add feedback or notes for this candidate…"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button style={{ ...s.modalBtn,
                background: modal.action === 'selected' ? '#10b981'
                          : modal.action === 'rejected' ? '#ef4444'
                          : '#8b5cf6' }}
                onClick={() => decide(modal.app._id, modal.action, remarks)}>
                Confirm
              </button>
              <button style={{ ...s.modalBtn, background:'#64748b' }}
                onClick={() => { setModal(null); setRemarks(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Th({ children }) {
  return <th style={{ padding:'12px 16px', textAlign:'left',
    fontWeight:700, fontSize:12, color:'#64748b',
    borderBottom:'2px solid #e2e8f0', whiteSpace:'nowrap' }}>{children}</th>;
}
function Td({ children, style }) {
  return <td style={{ padding:'12px 16px', verticalAlign:'middle', ...style }}>{children}</td>;
}
function ActionBtn({ color, onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: color, color:'#fff', border:'none',
      borderRadius:6, padding:'5px 10px', fontSize:12,
      fontWeight:700, cursor:'pointer', opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  );
}
function ScorePill({ value, high, mid, suffix='' }) {
  if (value === null || value === undefined || value === '—')
    return <span style={{ color:'#94a3b8', fontSize:12 }}>—</span>;
  const n = Number(value);
  const color = n >= high ? '#10b981' : n >= mid ? '#f59e0b' : '#ef4444';
  return (
    <span style={{ fontWeight:800, fontSize:15, color }}>
      {n}{suffix}
    </span>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = {
  page:   { minHeight:'100vh', background:'#f8fafc',
            fontFamily:'system-ui,sans-serif', padding:'24px 28px' },
  header: { marginBottom:20 },
  statsRow: { display:'flex', gap:14, marginBottom:22, flexWrap:'wrap' },
  statCard: { flex:'1 1 160px', background:'#fff', borderRadius:12,
              padding:'16px 20px', display:'flex', flexDirection:'column',
              alignItems:'center', gap:4,
              boxShadow:'0 1px 8px rgba(0,0,0,0.06)' },
  controls: { display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' },
  searchInput: { padding:'9px 14px', borderRadius:8, border:'1.5px solid #e2e8f0',
                 fontSize:14, outline:'none', minWidth:200 },
  filterBtn: { padding:'8px 14px', borderRadius:8, border:'none',
               cursor:'pointer', fontWeight:600, fontSize:13 },
  bulkBtn:   { padding:'8px 14px', borderRadius:8, border:'none',
               color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13 },
  table: { width:'100%', borderCollapse:'collapse', background:'#fff',
           borderRadius:12, overflow:'hidden',
           boxShadow:'0 1px 8px rgba(0,0,0,0.06)' },
  badge: { borderRadius:99, padding:'3px 10px', fontWeight:700, fontSize:12 },
  toast: { position:'fixed', bottom:24, right:24, background:'#1e293b',
           color:'#fff', padding:'12px 20px', borderRadius:10,
           fontWeight:600, fontSize:14, zIndex:999,
           boxShadow:'0 4px 16px rgba(0,0,0,0.2)' },
  modalOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
                  display:'flex', alignItems:'center', justifyContent:'center', zIndex:998 },
  modalCard: { background:'#fff', borderRadius:16, padding:'32px 28px',
               width:440, boxShadow:'0 8px 40px rgba(0,0,0,0.2)' },
  label:   { display:'block', fontWeight:600, fontSize:13, color:'#374151', marginBottom:6 },
  textarea:{ width:'100%', padding:'10px 12px', borderRadius:8,
             border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box',
             resize:'vertical', outline:'none' },
  modalBtn:{ flex:1, padding:'12px 0', color:'#fff', border:'none',
             borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' },
};