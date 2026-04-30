export default function Spinner({ text = 'Loading...' }) {
  return (
    <div style={{ textAlign:'center', marginTop: 80 }}>
      <div style={{
        width: 44, height: 44, border: '4px solid #e2e8f0',
        borderTop: '4px solid #4f46e5', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#64748b' }}>{text}</p>
    </div>
  );
}