// ═══ LOGIN PAGE ═══
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (!res.success) setError(res.error || 'Login failed');
    } catch (err) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0B1120', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 380, padding: 40, background: '#111A2E', borderRadius: 16, border: '1px solid #1E2D47', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏗️</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E5A822', margin: 0 }}>Construction CMS</h1>
            <p style={{ fontSize: 12, color: '#8899AA', marginTop: 4 }}>Moatbrook Ltd &amp; Max Building Services</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 11, color: '#8899AA', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="gavril@moatbrook.co.uk"
              style={{ width: '100%', padding: '10px 14px', marginBottom: 14, marginTop: 4, borderRadius: 8, background: '#0F1829', border: '1px solid #1E2D47', color: '#E8EEF4', fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }} />

            <label style={{ fontSize: 11, color: '#8899AA', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: '100%', padding: '10px 14px', marginBottom: 20, marginTop: 4, borderRadius: 8, background: '#0F1829', border: '1px solid #1E2D47', color: '#E8EEF4', fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }} />

            {error && <div style={{ padding: '8px 12px', borderRadius: 6, background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', fontSize: 12, marginBottom: 14, textAlign: 'center' }}>{error}</div>}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: 8, background: loading ? '#333' : '#E5A822', border: 'none', color: '#000', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#556677' }}>Default: gavril@moatbrook.co.uk / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
