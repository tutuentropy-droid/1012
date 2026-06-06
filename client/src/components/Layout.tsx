import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/user';
import BindingSettings from '@/components/BindingSettings';
import type { InkLevel } from '@/types';

const navItems = [
  { path: '/', label: '首页', icon: '卷' },
  { path: '/works', label: '书卷', icon: '册' },
  { path: '/notes', label: '笔记', icon: '批' },
  { path: '/statistics', label: '统计', icon: '图' },
];

const INK_HEX: Record<InkLevel, string> = {
  1: '#A0A0A0',
  2: '#808080',
  3: '#5A5A5A',
  4: '#3D3D3D',
  5: '#242424',
  6: '#0E0E0E',
};

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const lightenHex = (hex: string, amount: number) => {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(255 * amount));
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(255 * amount));
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(255 * amount));
  return `rgb(${r}, ${g}, ${b})`;
};

export default function Layout() {
  const { user, logout, binding } = useUserStore();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const level = binding.inkLevel;
    const current = INK_HEX[level];
    const strong = level >= 6 ? INK_HEX[6] : INK_HEX[(level + 1) as InkLevel] || INK_HEX[6];
    const light = level <= 1 ? INK_HEX[1] : INK_HEX[(level - 1) as InkLevel] || INK_HEX[1];
    root.style.setProperty('--ink-current', current);
    root.style.setProperty('--ink-current-strong', strong);
    root.style.setProperty('--ink-current-light', lightenHex(current, 0.25));
    root.style.setProperty('--ink-current-flying', hexToRgba(current, 0.1));
  }, [binding.inkLevel]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const paperClass = `paper-${binding.paperTexture} paper-fiber-hover`;

  return (
    <div className={paperClass} style={{ minHeight: '100vh', position: 'relative' }}>
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
                color: isActive ? 'var(--zhusha)' : 'var(--ink-current)',
                borderBottom: isActive ? '2px solid var(--zhusha)' : '2px solid transparent',
                transition: 'all var(--dur-fast)',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowSettings(true)}
            style={{ padding: '6px 14px', fontSize: 14 }}
          >
            装帧
          </button>
          <span style={{ fontFamily: 'var(--font-keishu)', color: 'var(--ink-current)', letterSpacing: '0.1em' }}>
            {user?.username}
          </span>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: 14 }}>
            出户
          </button>
        </div>
      </header>

      <hr className="ink-divider" style={{ margin: 0 }} />

      <main className="app-container page-enter" style={{ position: 'relative' }}>
        <Outlet />
      </main>

      <footer style={{
        padding: 'var(--spacing-xl) var(--spacing-3xl) var(--spacing-2xl)',
        textAlign: 'center',
        color: 'var(--ink-current-light)',
        fontSize: 12,
        letterSpacing: '0.2em',
        fontFamily: 'var(--font-keishu)',
      }}>
        <hr className="ink-divider" />
        墨痕深浅，皆是岁月 · 痕迹 Henji © {new Date().getFullYear()}
      </footer>

      <BindingSettings open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
