import { useEffect, useRef, useState } from 'react';
import type { HeatmapData, HeatmapWeek } from '@/types';
import { getWeekdayLabel } from '@/utils/date';
import dayjs from 'dayjs';

interface Props {
  data: HeatmapData;
  onDayClick?: (date: string, count: number) => void;
}

export default function InkHeatmap({ data, onDayClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverDay, setHoverDay] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  const [dpr] = useState(() => typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  const cellSize = 22;
  const cellGap = 5;
  const monthLabelHeight = 28;
  const dayLabelWidth = 36;
  const padding = { top: 10, right: 20, bottom: 10, left: 10 };

  const drawInkDot = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    level: number,
    maxLevel: number
  ) => {
    if (level === 0) {
      if (Math.random() < 0.04) {
        ctx.beginPath();
        ctx.arc(cx + (Math.random() - 0.5) * 6, cy + (Math.random() - 0.5) * 6, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(26, 26, 26, 0.08)';
        ctx.fill();
      }
      return;
    }

    const ratio = Math.max(0.2, level / Math.max(1, maxLevel));
    const baseR = cellSize * 0.2 + ratio * cellSize * 0.32;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.8);
    gradient.addColorStop(0, `rgba(26, 26, 26, ${0.25 + ratio * 0.6})`);
    gradient.addColorStop(0.5, `rgba(26, 26, 26, ${0.15 + ratio * 0.35})`);
    gradient.addColorStop(1, 'rgba(26, 26, 26, 0)');

    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(26, 26, 26, ${0.35 + ratio * 0.55})`;
    ctx.fill();

    if (ratio > 0.6 && Math.random() < 0.5) {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = baseR * (1.2 + Math.random() * 0.8);
        const dx = cx + Math.cos(angle) * dist;
        const dy = cy + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(dx, dy, 0.5 + Math.random() * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(26, 26, 26, 0.25)';
        ctx.fill();
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.weeks.length) return;

    const weeks = data.weeks.length;
    const width = padding.left + dayLabelWidth + weeks * (cellSize + cellGap) + padding.right;
    const height = padding.top + monthLabelHeight + 7 * (cellSize + cellGap) + padding.bottom;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const weekdays = ['一', '三', '五'];
    const weekdayIndices = [1, 3, 5];
    weekdays.forEach((label, i) => {
      ctx.fillStyle = 'var(--ink-light)';
      ctx.font = '11px var(--font-keishu)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        label,
        padding.left + dayLabelWidth - 6,
        padding.top + monthLabelHeight + weekdayIndices[i] * (cellSize + cellGap) + cellSize / 2
      );
    });

    const firstWeek = dayjs(data.weeks[0].weekStart);
    let lastMonth = -1;
    data.weeks.forEach((week, wi) => {
      const weekStart = dayjs(week.weekStart);
      const month = weekStart.month();
      if (month !== lastMonth && weekStart.date() <= 7) {
        ctx.fillStyle = 'var(--ink-charred)';
        ctx.font = '12px var(--font-keishu)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const x = padding.left + dayLabelWidth + wi * (cellSize + cellGap);
        ctx.fillText(`${month + 1}月`, x, padding.top + 8);
        lastMonth = month;
      }

      week.days.forEach((day, di) => {
        const cx = padding.left + dayLabelWidth + wi * (cellSize + cellGap) + cellSize / 2;
        const cy = padding.top + monthLabelHeight + di * (cellSize + cellGap) + cellSize / 2;
        drawInkDot(ctx, cx, cy, day.activityCount, Math.max(1, data.maxActivity));
      });
    });
  }, [data, dpr]);

  const handleMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const wi = Math.floor((x - padding.left - dayLabelWidth) / (cellSize + cellGap));
    const di = Math.floor((y - padding.top - monthLabelHeight) / (cellSize + cellGap));

    if (wi >= 0 && wi < data.weeks.length && di >= 0 && di < 7) {
      const day = data.weeks[wi].days[di];
      if (day) {
        setHoverDay({ date: day.date, count: day.activityCount, x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    } else {
      setHoverDay(null);
    }
  };

  const handleClick = () => {
    if (hoverDay && onDayClick) {
      onDayClick(hoverDay.date, hoverDay.count);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', overflowX: 'auto' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, paddingLeft: dayLabelWidth,
      }}>
        <h3 style={{
          fontFamily: 'var(--font-keishu)',
          fontSize: 18, letterSpacing: '0.15em',
          color: 'var(--ink-heavy)', margin: 0,
        }}>
          墨痕日历
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-light)', fontFamily: 'var(--font-keishu)', letterSpacing: '0.1em' }}>
          <span>少</span>
          {[1, 2, 3, 4].map((level) => (
            <svg key={level} width={16} height={16}>
              <circle cx={8} cy={8} r={2 + level * 1.5} fill={`rgba(26,26,26,${0.2 + level * 0.18})`} />
            </svg>
          ))}
          <span>多</span>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverDay(null)}
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        />
        {hoverDay && (
          <div style={{
            position: 'absolute',
            left: Math.min(hoverDay.x + 14, (canvasRef.current?.clientWidth || 500) - 120),
            top: hoverDay.y - 48,
            background: 'var(--ink-strong)',
            color: 'var(--xuan-white)',
            padding: '6px 12px',
            borderRadius: 4,
            fontFamily: 'var(--font-keishu)',
            fontSize: 12,
            letterSpacing: '0.1em',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}>
            {hoverDay.date} · 留痕 {hoverDay.count} 处
          </div>
        )}
      </div>

      <p style={{
        marginTop: 12, fontSize: 11, color: 'var(--ink-light)',
        fontFamily: 'var(--font-pizhu)', letterSpacing: '0.05em', lineHeight: 1.8,
        fontStyle: 'italic',
      }}>
        墨点疏密，如梅花落纸。每一点都是你留下的痕迹。
      </p>
    </div>
  );
}
