import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/user';

const navItems = [
  { path: '/', label: '首页', icon: '卷' },
  { path: '/works', label: '书卷', icon: '册' },
  { path: '/notes', label: '笔记', icon: '批' },
  { path: '/statistics', label: '统计', icon: '图' },
];

export default function Layout() {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="xuan-paper" style={{ minHeight: '100vh' }}>
      <header className="site-header" style={{
        padding: 'var(--spacing-2xl) var(--spacing-3xl)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'linear-gradient(180deg, var(--xuan-white) 60%, transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="seal-text" style={{ transform: 'rotate(-2deg)' }}>痕</div>
          <div>
            <h1 style={{ fontSize: 28, letterSpacing: '0.4em', margin: 0 }}>痕迹</h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-light)', letterSpacing: '0.2em', fontFamily: 'var(--font-keishu)' }}>
              读书观剧，皆是人生
            </p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: 8 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                fontFamily: 'var(--font-keishu)',
                fontSize: 16,
                letterSpacing: '0.15em',
                padding: '8px 20px',
                color: isActive ? 'var(--zhusha)' : 'var(--ink-medium)',
                borderBottom: isActive ? '2px solid var(--zhusha)' : '2px solid transparent',
                transition: 'all var(--dur-fast)',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-keishu)', color: 'var(--ink-medium)', letterSpacing: '0.1em' }}>
            {user?.username}
          </span>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: 14 }}>
            出户
          </button>
        </div>
      </header>

      <hr className="ink-divider" style={{ margin: 0 }} />

      <main className="app-container page-enter">
        <Outlet />
      </main>

      <footer style={{
        padding: 'var(--spacing-xl) var(--spacing-3xl) var(--spacing-2xl)',
        textAlign: 'center',
        color: 'var(--ink-light)',
        fontSize: 12,
        letterSpacing: '0.2em',
        fontFamily: 'var(--font-keishu)',
      }}>
        <hr className="ink-divider" />
        墨痕深浅，皆是岁月 · 痕迹 Henji © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
