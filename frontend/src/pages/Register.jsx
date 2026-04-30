import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>SmartHire AI — Register</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} name="name"     placeholder="Full Name"      onChange={handleChange} required />
          <input style={styles.input} name="email"    placeholder="Email"          onChange={handleChange} type="email" required />
          <input style={styles.input} name="password" placeholder="Password"       onChange={handleChange} type="password" required />
          <select style={styles.input} name="role" onChange={handleChange}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>
          <button style={styles.button} type="submit">Register</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 12 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' },
  card:      { background: '#fff', padding: 32, borderRadius: 10, width: 360, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  title:     { textAlign: 'center', marginBottom: 20, color: '#333' },
  input:     { width: '100%', padding: 10, marginBottom: 14, borderRadius: 6, border: '1px solid #ccc', fontSize: 14, boxSizing: 'border-box' },
  button:    { width: '100%', padding: 10, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer' },
  error:     { color: 'red', marginBottom: 10, textAlign: 'center' },
};