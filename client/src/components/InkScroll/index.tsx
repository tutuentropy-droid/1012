import { useEffect, useRef, useState } from 'react';
import type { AnnualReport } from '@/types';
import { RATING_LABELS } from '@/types';
import SealStamp from '@/components/SealStamp';
import { getMonthLabel } from '@/utils/date';
import { useUserStore } from '@/stores/user';

interface Props {
  report: AnnualReport;
}

export default function InkScroll({ report }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { chineseColors } = useUserStore();
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setScale((s) => Math.max(0.5, Math.min(2, s - e.deltaY * 0.001)));
      }
    };
    const el = scrollRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, []);

  const sections = [
    {
      id: 'title',
      render: () => (
        <div style={{
          minWidth: 800, padding: '80px 100px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-keishu)',
            fontSize: 72, letterSpacing: '0.5em',
            color: 'var(--ink-strong)', writingMode: 'vertical-rl',
            textShadow: '0 0 2px rgba(0,0,0,0.2)',
            marginBottom: 40,
          }}>
            {report.year}年痕迹
          </div>
          <div style={{
            fontFamily: 'var(--font-xingkai)',
            fontSize: 20, color: 'var(--ink-medium)',
            letterSpacing: '0.3em', marginBottom: 60,
          }}>
            {user?.username} 的年度长卷
          </div>
          <div style={{ display: 'flex', gap: 80 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 48, color: 'var(--zhusha)', letterSpacing: '0.1em' }}>
                {report.summary.worksAdded}
              </div>
              <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 14, color: 'var(--ink-light)', letterSpacing: '0.2em', marginTop: 8 }}>新纳入卷</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 48, color: 'var(--cangse)', letterSpacing: '0.1em' }}>
                {report.summary.worksCompleted}
              </div>
              <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 14, color: 'var(--ink-light)', letterSpacing: '0.2em', marginTop: 8 }}>终卷在握</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 48, color: 'var(--daishi)', letterSpacing: '0.1em' }}>
                {report.summary.totalNotes}
              </div>
              <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 14, color: 'var(--ink-light)', letterSpacing: '0.2em', marginTop: 8 }}>批语留痕</div>
            </div>
          </div>
          <div className="seal-text" style={{ transform: 'rotate(-3deg)', marginTop: 80, fontSize: 18 }}>
            痕迹
          </div>
        </div>
      ),
    },
    {
      id: 'top-rated',
      render: () => (
        <div style={{ minWidth: 700, padding: '80px 80px', borderLeft: '1px solid var(--ink-flying)' }}>
          <h2 className="brush-underline" style={{ marginBottom: 48 }}>上上品录</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {report.topRated.length === 0 ? (
              <p style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-xingkai)', fontSize: 16 }}>此卷尚空，来年评点。</p>
            ) : report.topRated.map((work, i) => (
              <div key={work._id} style={{
                display: 'flex', alignItems: 'center', gap: 24,
                padding: '16px 24px',
                borderBottom: '1px dashed rgba(139,105,20,0.15)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-keishu)',
                  fontSize: 28, color: 'var(--ink-light)', letterSpacing: '0.1em',
                  width: 48,
                }}>
                  {['甲', '乙', '丙', '丁', '戊'][i]}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 22, letterSpacing: '0.08em', color: 'var(--ink-strong)' }}>
                    《{work.title}》
                  </div>
                  {work.author && (
                    <div style={{ fontFamily: 'var(--font-pizhu)', fontSize: 13, color: 'var(--ink-light)', marginTop: 4 }}>
                      {work.author}
                    </div>
                  )}
                </div>
                <SealStamp value={work.rating} readonly size="md" showLabel />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'monthly',
      render: () => (
        <div style={{ minWidth: 900, padding: '80px 80px', borderLeft: '1px solid var(--ink-flying)' }}>
          <h2 className="brush-underline" style={{ marginBottom: 48 }}>十二月令</h2>
          <svg width="800" height="300" viewBox="0 0 800 300">
            <defs>
              <linearGradient id="mountain" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="var(--cangse)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="var(--dai-blue)" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {report.monthlyBreakdown.map((m, i) => {
              const x = 40 + i * 62;
              const baseH = 40;
              const h = baseH + m.worksCompleted * 28 + m.notesCount * 4;
              const maxH = 220;
              const finalH = Math.min(h, maxH);
              return (
                <g key={m.month}>
                  <path
                    d={`M ${x} 260 L ${x + 30} ${260 - finalH} L ${x + 60} 260 Z`}
                    fill="url(#mountain)"
                    opacity={0.7}
                  />
                  <text x={x + 30} y={250 - finalH} textAnchor="middle" fill="var(--ink-heavy)" style={{ fontFamily: 'var(--font-keishu)', fontSize: 12 }}>
                    {m.worksCompleted > 0 ? m.worksCompleted : ''}
                  </text>
                  <text x={x + 30} y={285} textAnchor="middle" fill="var(--ink-charred)" style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, letterSpacing: '0.1em' }}>
                    {getMonthLabel(m.month)}
                  </text>
                </g>
              );
            })}
          </svg>
          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--ink-light)', fontFamily: 'var(--font-pizhu)', letterSpacing: '0.1em', textAlign: 'center' }}>
            山峦叠起，每一寸高度都是你读过的书、看过的剧
          </p>
        </div>
      ),
    },
    {
      id: 'moods',
      render: () => {
        const moodMap = new Map<string, number>();
        report.moodTimeline.forEach((m) => {
          moodMap.set(m.color, (moodMap.get(m.color) || 0) + 1);
        });
        const moodList = Array.from(moodMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
        return (
          <div style={{ minWidth: 500, padding: '80px 80px', borderLeft: '1px solid var(--ink-flying)' }}>
            <h2 className="brush-underline" style={{ marginBottom: 48 }}>心色谱</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
              {moodList.length === 0 ? (
                <p style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-xingkai)', fontSize: 16 }}>这一年未曾设色。</p>
              ) : moodList.map(([color, count]) => {
                const meta = chineseColors.find((c) => c.hex === color);
                return (
                  <div key={color} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: color, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '3px solid var(--xuan-white)' }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 16, letterSpacing: '0.1em', color: 'var(--ink-heavy)' }}>
                        {meta?.name || color}
                      </div>
                      <div style={{ fontFamily: 'var(--font-pizhu)', fontSize: 12, color: 'var(--ink-light)' }}>
                        {count} 次 · {meta?.desc || ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      },
    },
    {
      id: 'milestones',
      render: () => (
        <div style={{ minWidth: 600, padding: '80px 80px', borderLeft: '1px solid var(--ink-flying)' }}>
          <h2 className="brush-underline" style={{ marginBottom: 48 }}>时光印记</h2>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 20, top: 10, bottom: 10, width: 2,
              background: 'linear-gradient(180deg, var(--zhusha) 0%, var(--ink-flying) 100%)',
            }} />
            {report.milestones.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, padding: '16px 0', position: 'relative' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: i === 0 ? 'var(--zhusha)' : 'var(--xuan-white)',
                  border: '3px solid var(--zhusha)',
                  flexShrink: 0, marginTop: 8, marginLeft: 13,
                  boxShadow: '0 0 0 4px var(--xuan-white)',
                }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 12, color: 'var(--ink-light)', letterSpacing: '0.15em' }}>
                    {new Date(m.date).toLocaleDateString('zh-CN')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-xingkai)', fontSize: 17, color: 'var(--ink-medium)', marginTop: 4, letterSpacing: '0.05em' }}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'tags',
      render: () => (
        <div style={{ minWidth: 600, padding: '80px 80px', borderLeft: '1px solid var(--ink-flying)' }}>
          <h2 className="brush-underline" style={{ marginBottom: 48 }}>签花</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            {report.tagsCloud.length === 0 ? (
              <p style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-xingkai)', fontSize: 16 }}>未加签花。</p>
            ) : report.tagsCloud.map((t, i) => (
              <span
                key={t.tagId}
                style={{
                  fontFamily: 'var(--font-keishu)',
                  letterSpacing: '0.15em',
                  padding: `${6 + t.count * 0.5}px ${14 + t.count}px`,
                  background: i < 3 ? 'var(--zhusha-light)' : 'rgba(139,105,20,0.08)',
                  color: i < 3 ? 'var(--zhusha)' : 'var(--ink-medium)',
                  borderRadius: 999,
                  fontSize: `${12 + Math.min(t.count * 0.8, 10)}px`,
                  border: i < 3 ? '1px solid var(--zhusha)' : '1px solid transparent',
                }}
              >
                {t.tagName}
              </span>
            ))}
          </div>
          {report.wordCloud.length > 0 && (
            <>
              <h3 style={{ fontFamily: 'var(--font-keishu)', fontSize: 18, marginTop: 56, marginBottom: 24, letterSpacing: '0.15em' }}>批语碎金</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {report.wordCloud.slice(0, 20).map((w, i) => (
                  <span key={i} style={{
                    fontFamily: 'var(--font-xingkai)',
                    fontSize: `${13 + (20 - i) * 0.5}px`,
                    color: `rgba(26,26,26,${0.35 + (20 - i) * 0.025})`,
                    letterSpacing: '0.05em',
                  }}>
                    {w}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      id: 'ending',
      render: () => (
        <div style={{
          minWidth: 700, padding: '80px 100px',
          borderLeft: '1px solid var(--ink-flying)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-xingkai)',
            fontSize: 28, lineHeight: 2.2,
            color: 'var(--ink-medium)', letterSpacing: '0.15em',
            maxWidth: 500,
          }}>
            岁岁年年，墨痕深浅。<br />
            一卷合罢，再启新篇。
          </div>
          <div style={{
            marginTop: 60, display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <span style={{
              fontFamily: 'var(--font-keishu)',
              fontSize: 14, color: 'var(--ink-light)',
              letterSpacing: '0.3em',
            }}>
              {report.year} 年 腊月 吉日
            </span>
            <div className="seal-text" style={{ fontSize: 14 }}>
              {user?.username || '墨客'}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, padding: '0 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 14, color: 'var(--ink-light)', letterSpacing: '0.2em' }}>
            ← 拖动手卷浏览
          </span>
          <span style={{ color: 'var(--ink-flying)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em' }}>
            Ctrl + 滚轮缩放（{Math.round(scale * 100)}%）
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))} style={{ padding: '4px 12px', fontSize: 14 }}>缩小</button>
          <button className="btn btn-ghost" onClick={() => setScale(1)} style={{ padding: '4px 12px', fontSize: 14 }}>复原</button>
          <button className="btn btn-ghost" onClick={() => setScale((s) => Math.min(2, s + 0.1))} style={{ padding: '4px 12px', fontSize: 14 }}>放大</button>
        </div>
      </div>

      <div
        style={{
          background: 'var(--xuan-white)',
          boxShadow: 'var(--shadow-deep)',
          border: '1px solid rgba(139,105,20,0.15)',
          overflow: 'auto',
          padding: '0 0 24px 0',
          position: 'relative',
        }}
        className="xuan-paper"
      >
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            transform: `scale(${scale})`,
            transformOrigin: 'left top',
            transition: 'transform var(--dur-normal) var(--ease-scroll)',
          }}
        >
          <div style={{
            width: 60, flexShrink: 0,
            background: 'linear-gradient(90deg, rgba(139,105,20,0.2), rgba(139,105,20,0.05))',
          }} />
          {sections.map((s) => (
            <div key={s.id}>{s.render()}</div>
          ))}
          <div style={{
            width: 60, flexShrink: 0,
            background: 'linear-gradient(270deg, rgba(139,105,20,0.2), rgba(139,105,20,0.05))',
          }} />
        </div>
      </div>
    </div>
  );
}
