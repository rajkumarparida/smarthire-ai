import { useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

export default function PostJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', company: '', location: '',
    requiredSkills: '', experienceLevel: 'fresher', salary: '', lastDate: ''
  });
  const [msg, setMsg] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/jobs', {
        ...form,
        requiredSkills: form.requiredSkills.split(',').map(s => s.trim())
      });
      setMsg('✅ Job posted successfully!');
      setTimeout(() => navigate('/recruiter/dashboard'), 1500);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to post job');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Post a New Job</h2>
        {msg && <p style={styles.msg}>{msg}</p>}
        <form onSubmit={handleSubmit}>
          {[
            { name: 'title',       placeholder: 'Job Title' },
            { name: 'company',     placeholder: 'Company Name' },
            { name: 'location',    placeholder: 'Location' },
            { name: 'salary',      placeholder: 'Salary (e.g. 4-6 LPA)' },
            { name: 'requiredSkills', placeholder: 'Skills (comma separated: React, Node.js)' },
          ].map(f => (
            <input key={f.name} style={styles.input} name={f.name}
              placeholder={f.placeholder} onChange={handleChange} required />
          ))}

          <select style={styles.input} name="experienceLevel" onChange={handleChange}>
            {['fresher','junior','mid','senior'].map(l =>
              <option key={l} value={l}>{l}</option>
            )}
          </select>

          <input style={styles.input} name="lastDate" type="date" onChange={handleChange} />

          <textarea style={{ ...styles.input, height: 100 }} name="description"
            placeholder="Job Description" onChange={handleChange} required />

          <button style={styles.button} type="submit">Post Job</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display:'flex', justifyContent:'center', padding: 40, background:'#f0f2f5', minHeight:'100vh' },
  card:      { background:'#fff', padding:32, borderRadius:10, width:480, boxShadow:'0 4px 12px rgba(0,0,0,0.1)', height:'fit-content' },
  title:     { textAlign:'center', marginBottom:20, color:'#333' },
  input:     { width:'100%', padding:10, marginBottom:14, borderRadius:6, border:'1px solid #ccc', fontSize:14, boxSizing:'border-box' },
  button:    { width:'100%', padding:10, background:'#4f46e5', color:'#fff', border:'none', borderRadius:6, fontSize:16, cursor:'pointer' },
  msg:       { textAlign:'center', marginBottom:12, color:'green' },
};