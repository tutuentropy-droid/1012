import { useState } from 'react';
import type { StatsOverview } from '@/types';
import { STATUS_LABELS, TYPE_LABELS } from '@/types';

interface Props {
  stats: StatsOverview;
}

interface FanSection {
  label: string;
  value: number;
  max: number;
  color: string;
}

export default function FoldingFan({ stats }: Props) {
  const [open, setOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const totalWorks = Math.max(1, stats.totalWorks);
  const totalNotes = Math.max(1, stats.totalNotes);

  const typeSections: FanSection[] = Object.entries(stats.byType).map(([k, v]) => ({
    label: TYPE_LABELS[k as keyof typeof TYPE_LABELS] || k,
    value: v,
    max: totalWorks,
    color: ['#C84032', '#4A5568', '#7BA05B', '#8B6914'][Object.keys(stats.byType).indexOf(k)] || '#666',
  }));

  const statusSections: FanSection[] = Object.entries(stats.byStatus).map(([k, v]) => ({
    label: STATUS_LABELS[k as keyof typeof STATUS_LABELS] || k,
    value: v,
    max: totalWorks,
    color: ['#9370DB', '#48C9B0', '#C84032', '#D9B64C', '#7A7A7A'][Object.keys(stats.byStatus).indexOf(k)] || '#666',
  }));

  const sections = [...typeSections, ...statusSections];
  const sectionCount = sections.length;
  const startAngle = -150;
  const endAngle = 150;
  const angleRange = endAngle - startAngle;
  const sectionAngle = angleRange / sectionCount;
  const outerR = 200;
  const innerR = 80;

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const cx = 240;
  const cy = 220;

  const renderSection = (section: FanSection, index: number) => {
    const sAngle = startAngle + index * sectionAngle + 2;
    const eAngle = sAngle + sectionAngle - 4;
    const fillRatio = section.max > 0 ? section.value / section.max : 0;
    const currentOuterR = innerR + (outerR - innerR) * Math.max(0.15, fillRatio);
    const isActive = activeSection === section.label;

    const p1 = polarToCartesian(cx, cy, innerR, sAngle);
    const p2 = polarToCartesian(cx, cy, currentOuterR, sAngle);
    const p3 = polarToCartesian(cx, cy, currentOuterR, eAngle);
    const p4 = polarToCartesian(cx, cy, innerR, eAngle);

    const largeArc = sectionAngle - 4 > 180 ? 1 : 0;
    const path = `
      M ${p1.x} ${p1.y}
      L ${p2.x} ${p2.y}
      A ${currentOuterR} ${currentOuterR} 0 ${largeArc} 0 ${p3.x} ${p3.y}
      L ${p4.x} ${p4.y}
      A ${innerR} ${innerR} 0 ${largeArc} 1 ${p1.x} ${p1.y}
      Z
    `;

    const midAngle = (sAngle + eAngle) / 2;
    const labelR = (innerR + currentOuterR) / 2;
    const labelPos = polarToCartesian(cx, cy, labelR, midAngle);
    const valuePos = polarToCartesian(cx, cy, (innerR + outerR) / 2 + 10, midAngle);

    return (
      <g
        key={section.label}
        style={{
          cursor: 'pointer',
          opacity: open ? (isActive || !activeSection ? 1 : 0.5) : 0.15,
          transition: 'all var(--dur-normal) var(--ease-scroll)',
          transformOrigin: `${cx}px ${cy}px`,
          transform: open ? 'none' : `rotate(${startAngle + index * 2}deg)`,
        }}
        onMouseEnter={() => setActiveSection(section.label)}
        onMouseLeave={() => setActiveSection(null)}
      >
        <path d={path} fill={section.color} opacity={0.75} stroke="var(--xuan-white)" strokeWidth="2" />
        <path d={path} fill="url(#fanTexture)" opacity={0.15} />
        <text
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--xuan-white)"
          style={{
            fontFamily: 'var(--font-keishu)',
            fontSize: 14,
            letterSpacing: '0.15em',
            writingMode: fillRatio < 0.4 ? 'vertical-rl' : 'initial',
          }}
        >
          {section.label}
        </text>
        {isActive && (
          <text
            x={valuePos.x}
            y={valuePos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={section.color}
            style={{ fontFamily: 'var(--font-keishu)', fontSize: 20, fontWeight: 'bold' }}
          >
            {section.value}
          </text>
        )}
      </g>
    );
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="480" height="280" viewBox="0 0 480 280">
        <defs>
          <pattern id="fanTexture" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--xuan-white)" strokeWidth="1" opacity="0.5" />
          </pattern>
          <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B6914" />
            <stop offset="100%" stopColor="#5D4511" />
          </radialGradient>
        </defs>

        {/* 扇骨 */}
        {sections.map((_, i) => {
          const angle = startAngle + i * sectionAngle + sectionAngle / 2;
          const outer = polarToCartesian(cx, cy, outerR - 10, angle);
          return (
            <line
              key={`rib-${i}`}
              x1={cx} y1={cy}
              x2={outer.x} y2={outer.y}
              stroke="#8B6914"
              strokeWidth="1"
              opacity={open ? 0.6 : 0.9}
              style={{ transition: 'all var(--dur-slow) var(--ease-scroll)' }}
            />
          );
        })}

        {/* 扇面 */}
        {sections.map((section, i) => renderSection(section, i))}

        {/* 扇轴 */}
        <circle cx={cx} cy={cy} r={18} fill="url(#hubGradient)" />
        <circle cx={cx} cy={cy} r={10} fill="#2D1F0A" />
        <circle cx={cx} cy={cy} r={3} fill="#D4AF37" />

        {/* 中心文字 */}
        <text
          x={cx} y={cy + 42}
          textAnchor="middle"
          fill="var(--ink-light)"
          style={{ fontFamily: 'var(--font-keishu)', fontSize: 11, letterSpacing: '0.2em' }}
        >
          {activeSection || '一轴折扇，半年光阴'}
        </text>
      </svg>

      <button
        onClick={() => setOpen(!open)}
        className="btn btn-ghost"
        style={{ marginTop: 8, fontSize: 13 }}
      >
        {open ? '合扇' : '展扇'}
      </button>

      <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { label: '作品总数', value: stats.totalWorks, color: 'var(--ink-strong)' },
          { label: '批注总数', value: stats.totalNotes, color: 'var(--zhusha)' },
          { label: '今年完成', value: stats.watchedThisYear, color: 'var(--cangse)' },
          { label: '正在进行', value: stats.watchingNow, color: 'var(--dai-blue)' },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-keishu)',
              fontSize: 32, color: item.color,
              letterSpacing: '0.1em',
            }}>
              {item.value}
            </div>
            <div style={{
              fontFamily: 'var(--font-keishu)',
              fontSize: 12, color: 'var(--ink-light)',
              letterSpacing: '0.2em', marginTop: 4,
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
