import { useMemo } from 'react';
import type { Work } from '@/types';
import { formatDate } from '@/utils/date';

interface Props {
  works: Work[];
  onSelect?: (work: Work) => void;
}

interface RiverWork extends Work {
  position: number;
  size: number;
  row: number;
  opacity: number;
}

export default function TimeRiver({ works, onSelect }: Props) {
  const riverWorks = useMemo<RiverWork[]>(() => {
    if (works.length === 0) return [];

    const sorted = [...works].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return aTime - bTime;
    });

    const times = sorted.map((w) => new Date(w.createdAt).getTime());
    const minTime = times[0];
    const maxTime = times[times.length - 1];
    const timeRange = Math.max(maxTime - minTime, 1);

    return sorted.map((w, i) => {
      const t = new Date(w.createdAt).getTime();
      const normalized = (t - minTime) / timeRange;
      const position = 8 + normalized * 84;

      const densityFactor = normalized;
      const size = 28 + densityFactor * 20;

      const row = i % 3;
      const opacity = 0.55 + densityFactor * 0.4;

      return {
        ...w,
        position,
        size,
        row,
        opacity,
      };
    });
  }, [works]);

  if (works.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 500,
      }}>
        <div style={{
          fontFamily: 'var(--font-keishu)',
          fontSize: 22,
          color: 'var(--ink-light)',
          letterSpacing: '0.2em',
          marginBottom: 12,
        }}>长河尚静</div>
        <div style={{
          fontFamily: 'var(--font-pizhu)',
          fontSize: 13,
          color: 'var(--ink-light)',
          letterSpacing: '0.1em',
        }}>尚无作品顺流而下</div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      position: 'relative',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '20px 0 12px',
      }}>
        <div style={{
          fontFamily: 'var(--font-keishu)',
          fontSize: 18,
          letterSpacing: '0.4em',
          color: 'var(--ink-strong)',
          marginBottom: 4,
        }}>时 序</div>
        <div style={{
          fontFamily: 'var(--font-pizhu)',
          fontSize: 12,
          color: 'var(--ink-light)',
          letterSpacing: '0.15em',
        }}>岁月长河 · 顺流而下</div>
      </div>

      <div style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        overflow: 'hidden',
        padding: '20px 24px',
      }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 600 500"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0 }}
        >
          <defs>
            <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D6E4FF" stopOpacity="0.15" />
              <stop offset="30%" stopColor="#B8CCE8" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#9BB5D6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7EA1C4" stopOpacity="0.5" />
            </linearGradient>
            <filter id="waterRipple" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="3" />
              <feDisplacementMap in="SourceGraphic" scale="4" />
            </filter>
            <linearGradient id="boatWood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B6914" />
              <stop offset="50%" stopColor="#6B4F10" />
              <stop offset="100%" stopColor="#4A3708" />
            </linearGradient>
          </defs>

          <path
            d="M 0 250 Q 100 220 200 255 T 400 245 T 600 260 L 600 290 Q 500 310 400 285 T 200 295 T 0 290 Z"
            fill="url(#riverGradient)"
            opacity="0.8"
          />
          <path
            d="M 0 255 Q 100 230 200 260 T 400 250 T 600 265"
            fill="none"
            stroke="#7EA1C4"
            strokeWidth="0.8"
            strokeOpacity="0.3"
            strokeDasharray="4 6"
          />
          <path
            d="M 0 280 Q 100 295 200 275 T 400 285 T 600 275"
            fill="none"
            stroke="#7EA1C4"
            strokeWidth="0.6"
            strokeOpacity="0.25"
            strokeDasharray="2 8"
          />

          {[0.12, 0.28, 0.45, 0.62, 0.78, 0.9].map((x, i) => (
            <circle
              key={i}
              cx={600 * x}
              cy={270 + Math.sin(i * 1.3) * 8}
              r={1.5}
              fill="#7EA1C4"
              opacity="0.4"
            />
          ))}
        </svg>

        <div style={{
          position: 'relative',
          height: '100%',
          width: '100%',
        }}>
          {riverWorks.map((work) => {
            const baseY = 38 + work.row * 28;
            return (
              <div
                key={work._id}
                onClick={() => onSelect?.(work)}
                style={{
                  position: 'absolute',
                  left: `${work.position}%`,
                  top: `${baseY}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  transition: 'transform var(--dur-normal) var(--ease-scroll)',
                  opacity: work.opacity,
                  zIndex: 10 + work.row,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translate(-50%, -50%) scale(1.15)';
                  (e.currentTarget as HTMLDivElement).style.zIndex = '100';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translate(-50%, -50%) scale(1)';
                  (e.currentTarget as HTMLDivElement).style.zIndex = `${10 + work.row}`;
                }}
                title={`《${work.title}》\n${formatDate(work.createdAt)}`}
              >
                <svg
                  width={work.size}
                  height={work.size * 0.6}
                  viewBox="0 0 60 36"
                  style={{ display: 'block', filter: `drop-shadow(0 2px 3px rgba(26,26,26,${0.08 + work.row * 0.04}))` }}
                >
                  <path
                    d="M 5 22 Q 30 34 55 22 L 50 14 Q 30 18 10 14 Z"
                    fill="url(#boatWood)"
                  />
                  <path
                    d="M 8 20 Q 30 28 52 20 L 48 16 Q 30 19 12 16 Z"
                    fill="#A07C1A"
                    opacity="0.5"
                  />
                  <rect x="25" y="4" width="1.2" height="14" fill="#5A4010" />
                  <path
                    d="M 26.2 4 L 40 12 L 26.2 14 Z"
                    fill="#F5EFE0"
                    stroke="#8B6914"
                    strokeWidth="0.5"
                    opacity="0.85"
                  />
                  {work.moodColor && (
                    <circle cx="30" cy="25" r="2" fill={work.moodColor} opacity="0.9" />
                  )}
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-keishu)',
                  fontSize: 10,
                  color: 'var(--ink-medium)',
                  letterSpacing: '0.08em',
                  maxWidth: 80,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {work.title}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          writingMode: 'vertical-rl',
          fontFamily: 'var(--font-pizhu)',
          fontSize: 11,
          color: 'var(--ink-light)',
          letterSpacing: '0.25em',
          opacity: 0.6,
        }}>
          {riverWorks.length > 0 && formatDate(riverWorks[0].createdAt, 'YYYY年MM月')}
        </div>
        <div style={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          writingMode: 'vertical-rl',
          fontFamily: 'var(--font-pizhu)',
          fontSize: 11,
          color: 'var(--ink-light)',
          letterSpacing: '0.25em',
          opacity: 0.6,
        }}>
          {riverWorks.length > 0 && formatDate(riverWorks[riverWorks.length - 1].createdAt, 'YYYY年MM月')}
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 24px 16px',
        fontFamily: 'var(--font-pizhu)',
        fontSize: 11,
        color: 'var(--ink-light)',
        letterSpacing: '0.1em',
      }}>
        <span>源头 · 初见</span>
        <span>共 {works.length} 叶小舟</span>
        <span>今时 · 此刻</span>
      </div>
    </div>
  );
}
