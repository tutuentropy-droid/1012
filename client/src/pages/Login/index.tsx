import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '@/services';
import { useUserStore } from '@/stores/user';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      setAuth(result.token, result.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || '登录失败');
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
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="seal-text" style={{ fontSize: 20, display: 'inline-flex', marginBottom: 16 }}>痕</div>
          <h1 style={{ fontSize: 36, letterSpacing: '0.5em', fontFamily: 'var(--font-keishu)', color: 'var(--ink-strong)' }}>
            痕迹
          </h1>
          <p style={{
            fontFamily: 'var(--font-keishu)', fontSize: 13,
            color: 'var(--ink-light)', letterSpacing: '0.3em',
            marginTop: 12,
          }}>
            读书观剧，皆是人生
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
            }}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="至少 6 位"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 16, padding: 14 }}>
            {loading ? '墨迹渐显...' : '推门而入'}
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
            初来乍到？
            <Link to="/register" style={{ color: 'var(--zhusha)', marginLeft: 8 }}>留名于此</Link>
          </p>
          <p style={{
            marginTop: 16, fontFamily: 'var(--font-pizhu)', fontSize: 11,
            color: 'var(--ink-light)', lineHeight: 1.8,
          }}>
            测试账号：demo@henji.app / 123456
          </p>
        </div>
      </div>
    </div>
  );
}
