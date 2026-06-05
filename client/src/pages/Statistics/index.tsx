import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { statsApi } from '@/services';
import type { StatsOverview, HeatmapData, MonthlyStat } from '@/types';
import Loading from '@/components/common/Loading';
import FoldingFan from '@/components/FoldingFan';
import InkHeatmap from '@/components/InkHeatmap';
import { getMonthLabel } from '@/utils/date';
import { useUserStore } from '@/stores/user';

export default function Statistics() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [monthly, setMonthly] = useState<{ year: number; months: MonthlyStat[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const { chineseColors } = useUserStore();

  const currentYear = new Date().getFullYear();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [o, h, m] = await Promise.all([
        statsApi.overview(),
        statsApi.heatmap(52),
        statsApi.monthly(currentYear),
      ]);
      setOverview(o);
      setHeatmap(h);
      setMonthly(m);
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 className="brush-underline">痕迹统计</h1>
          <p style={{ fontFamily: 'var(--font-pizhu)', fontSize: 13, color: 'var(--ink-light)', marginTop: 8, letterSpacing: '0.1em' }}>
            观己所好，见心所向
          </p>
        </div>
        <Link to={`/annual-report/${currentYear}`} className="btn">
          {currentYear}年 · 展开长卷 →
        </Link>
      </div>

      {overview && (
        <section style={{
          marginBottom: 56,
          padding: 40,
          background: 'var(--xuan-light)',
          border: '1px solid rgba(139,105,20,0.12)',
        }} className="xuan-paper">
          <h2 style={{
            fontFamily: 'var(--font-keishu)',
            fontSize: 20, letterSpacing: '0.2em',
            color: 'var(--ink-heavy)',
            textAlign: 'center', marginBottom: 24,
          }}>一轴折扇 · 万卷统计</h2>
          <FoldingFan stats={overview} />
        </section>
      )}

      {heatmap && (
        <section style={{
          marginBottom: 56,
          padding: 40,
          background: 'var(--xuan-light)',
          border: '1px solid rgba(139,105,20,0.12)',
        }} className="xuan-paper">
          <InkHeatmap data={heatmap} />
        </section>
      )}

      {monthly && (
        <section style={{
          marginBottom: 56,
          padding: 40,
          background: 'var(--xuan-light)',
          border: '1px solid rgba(139,105,20,0.12)',
        }} className="xuan-paper">
          <h2 className="brush-underline" style={{ marginBottom: 32 }}>{currentYear}年 · 十二月令</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {monthly.months.map((m) => {
              const moodMeta = m.topMood ? chineseColors.find((c) => c.hex === m.topMood) : null;
              const hasData = m.worksCompleted > 0 || m.notesCount > 0;
              return (
                <div key={m.month} style={{
                  padding: 20,
                  background: hasData ? 'var(--xuan-white)' : 'transparent',
                  border: hasData ? '1px solid rgba(139,105,20,0.12)' : '1px dashed rgba(139,105,20,0.1)',
                  position: 'relative',
                  transition: 'all var(--dur-fast)',
                }} onMouseEnter={(e) => {
                  if (hasData) {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-ink)';
                  }
                }} onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}>
                  <div style={{
                    fontFamily: 'var(--font-keishu)',
                    fontSize: 18, letterSpacing: '0.15em',
                    color: hasData ? 'var(--ink-strong)' : 'var(--ink-flying)',
                    marginBottom: 12,
                  }}>
                    {getMonthLabel(m.month)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontFamily: 'var(--font-pizhu)', fontSize: 12,
                      color: hasData ? 'var(--ink-medium)' : 'var(--ink-flying)',
                    }}>
                      <span>终卷</span>
                      <span style={{ fontFamily: 'var(--font-keishu)', color: 'var(--zhusha)' }}>{m.worksCompleted}</span>
                    </div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontFamily: 'var(--font-pizhu)', fontSize: 12,
                      color: hasData ? 'var(--ink-medium)' : 'var(--ink-flying)',
                    }}>
                      <span>批注</span>
                      <span style={{ fontFamily: 'var(--font-keishu)', color: 'var(--cangse)' }}>{m.notesCount}</span>
                    </div>
                    {m.avgRating > 0 && (
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontFamily: 'var(--font-pizhu)', fontSize: 12,
                        color: 'var(--ink-medium)',
                      }}>
                        <span>品均</span>
                        <span style={{ fontFamily: 'var(--font-keishu)', color: 'var(--daishi)' }}>{m.avgRating}</span>
                      </div>
                    )}
                  </div>
                  {moodMeta && (
                    <div style={{
                      position: 'absolute', top: 16, right: 16,
                      width: 18, height: 18, borderRadius: '50%',
                      background: moodMeta.hex,
                      border: '2px solid var(--xuan-white)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }} title={`本月心情：${moodMeta.name}`} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {overview && overview.moodDistribution.length > 0 && (
        <section style={{
          padding: 40,
          background: 'var(--xuan-light)',
          border: '1px solid rgba(139,105,20,0.12)',
        }} className="xuan-paper">
          <h2 className="brush-underline" style={{ marginBottom: 32 }}>心色谱 · 全年</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {overview.moodDistribution.map((m) => {
              const meta = chineseColors.find((c) => c.hex === m.color);
              const total = overview.moodDistribution.reduce((s, x) => s + x.count, 0);
              const percent = Math.round((m.count / total) * 100);
              return (
                <div key={m.color} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: m.color,
                    border: '4px solid var(--xuan-white)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: 6,
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-keishu)', fontSize: 16,
                        letterSpacing: '0.15em', color: 'var(--ink-heavy)',
                      }}>{meta?.name || m.name}</span>
                      <span style={{
                        fontFamily: 'var(--font-keishu)', fontSize: 14,
                        color: 'var(--ink-medium)',
                      }}>{m.count} 次 · {percent}%</span>
                    </div>
                    <div style={{
                      height: 4, background: 'rgba(139,105,20,0.08)',
                      borderRadius: 2, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${percent}%`,
                        background: m.color, borderRadius: 2,
                      }} />
                    </div>
                    {meta?.desc && (
                      <div style={{
                        fontFamily: 'var(--font-pizhu)', fontSize: 11,
                        color: 'var(--ink-light)', marginTop: 4,
                      }}>{meta.desc}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
