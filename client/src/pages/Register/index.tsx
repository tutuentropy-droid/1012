import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/services';
import { useUserStore } from '@/stores/user';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useUserStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.register(username, email, password);
      setAuth(result.token, result.user);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="xuan-paper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{
        width: '100%', maxWidth: 420,
        padding: '60px 48px',
        background: 'var(--xuan-light)',
        border: '1px solid rgba(139,105,20,0.15)',
        boxShadow: 'var(--shadow-paper)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="seal-text" style={{ fontSize: 20, display: 'inline-flex', marginBottom: 16 }}>迹</div>
          <h1 style={{ fontSize: 32, letterSpacing: '0.4em', fontFamily: 'var(--font-keishu)', color: 'var(--ink-strong)' }}>
            留名入卷
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <div style={{
              padding: 12, border: '1px solid var(--zhusha)',
              background: 'var(--zhusha-light)', color: 'var(--zhusha)',
              fontFamily: 'var(--font-keishu)', fontSize: 14, letterSpacing: '0.1em',
              borderRadius: 2, textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{
              display: 'block', marginBottom: 8,
              fontFamily: 'var(--font-keishu)', fontSize: 13,
              color: 'var(--ink-medium)', letterSpacing: '0.2em',
            }}>雅号</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="你的名字"
              minLength={2}
              maxLength={30}
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block', marginBottom: 8,
              fontFamily: 'var(--font-keishu)', fontSize: 13,
              color: 'var(--ink-medium)', letterSpacing: '0.2em',
            }}>邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block', marginBottom: 8,
              fontFamily: 'var(--font-keishu)', fontSize: 13,
              color: 'var(--ink-medium)', letterSpacing: '0.2em',
            }}>暗码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="至少 6 位"
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 12, padding: 14 }}>
            {loading ? '刻章中...' : '入卷'}
          </button>
        </form>

        <div style={{
          marginTop: 32, paddingTop: 24,
          borderTop: '1px dashed rgba(139,105,20,0.2)',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'var(--font-keishu)', fontSize: 13,
            color: 'var(--ink-light)', letterSpacing: '0.15em',
          }}>
            已在卷中？
            <Link to="/login" style={{ color: 'var(--zhusha)', marginLeft: 8 }}>推门而归</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
