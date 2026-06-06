import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { workApi, noteApi, statsApi } from '@/services';
import type { Work, NoteWithWork } from '@/types';
import WorkCard from '@/components/WorkCard';
import OldBookPage from '@/components/OldBookPage';
import Loading from '@/components/common/Loading';
import SealStamp from '@/components/SealStamp';
import { formatRelative } from '@/utils/date';
import { useUserStore } from '@/stores/user';

export default function Home() {
  const [recentWorks, setRecentWorks] = useState<Work[]>([]);
  const [recentNotes, setRecentNotes] = useState<NoteWithWork[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { binding } = useUserStore();
  const sealText = binding.sealStyle === 'yiyue' ? '已阅'
    : binding.sealStyle === 'shenpin' ? '神品'
    : binding.sealStyle === 'jingdu' ? '静读' : '';

  useEffect(() => {
    Promise.all([
      workApi.list({ pageSize: 6, sortBy: 'updatedAt', sortOrder: 'desc' }),
      noteApi.list({ pageSize: 3, sortBy: 'createdAt', sortOrder: 'desc' }),
      statsApi.overview(),
    ])
      .then(([works, notes, s]) => {
        setRecentWorks(works.items);
        setRecentNotes(notes.items);
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div style={{ position: 'relative' }}>
      {sealText && (
        <div className="corner-seal corner-seal-top-right">
          {sealText}
        </div>
      )}
      <section style={{
        textAlign: 'center',
        padding: 'var(--spacing-xl) 0 var(--spacing-2xl)',
        marginBottom: 'var(--spacing-xl)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-keishu)',
          fontSize: 42, letterSpacing: '0.5em',
          color: 'var(--ink-strong)',
          marginBottom: 16,
        }}>
          今 日 开 卷
        </h2>
        <p style={{
          fontFamily: 'var(--font-xingkai)',
          fontSize: 16,
          color: 'var(--ink-medium)',
          letterSpacing: '0.2em',
        }}>
          墨痕深浅，皆是岁月留下的痕迹
        </p>
        <div style={{
          display: 'flex', gap: 32, justifyContent: 'center',
          marginTop: 48, flexWrap: 'wrap',
        }}>
          <Link to="/works" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '20px 40px',
              border: '1px solid var(--zhusha)',
              color: 'var(--zhusha)',
              fontFamily: 'var(--font-keishu)',
              fontSize: 18, letterSpacing: '0.3em',
              transition: 'all var(--dur-fast)',
              borderRadius: 2,
            }}>
              ＋ 纳入新卷
            </div>
          </Link>
          <Link to="/dual-order" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '20px 40px',
              border: '1px solid var(--ink-medium)',
              color: 'var(--ink-strong)',
              fontFamily: 'var(--font-keishu)',
              fontSize: 18, letterSpacing: '0.3em',
              transition: 'all var(--dur-fast)',
              borderRadius: 2,
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--zhusha)';
                (e.currentTarget as HTMLDivElement).style.color = 'var(--zhusha)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ink-medium)';
                (e.currentTarget as HTMLDivElement).style.color = 'var(--ink-strong)';
              }}
            >
              谱 双序阁
            </div>
          </Link>
        </div>
      </section>

      {stats && (
        <section style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 24,
            padding: 'var(--spacing-xl)',
            background: 'var(--xuan-light)',
            border: '1px solid rgba(139,105,20,0.1)',
          }} className="xuan-paper">
            {[
              { label: '纳入卷中', value: stats.totalWorks, sub: '部作品' },
              { label: '批注留痕', value: stats.totalNotes, sub: '条笔记' },
              { label: '今年完卷', value: stats.watchedThisYear, sub: '部' },
              { label: '正在读', value: stats.watchingNow, sub: '部' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-keishu)',
                  fontSize: 40, color: 'var(--ink-strong)',
                  letterSpacing: '0.1em',
                }}>
                  {item.value}
                </div>
                <div style={{
                  fontFamily: 'var(--font-keishu)',
                  fontSize: 13, color: 'var(--ink-medium)',
                  letterSpacing: '0.2em', marginTop: 8,
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-pizhu)',
                  fontSize: 11, color: 'var(--ink-light)',
                  marginTop: 2,
                }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: 48,
      }}>
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 className="brush-underline">新近书卷</h2>
            <Link to="/works" style={{
              fontFamily: 'var(--font-keishu)',
              fontSize: 13, color: 'var(--ink-light)',
              letterSpacing: '0.15em',
            }}>
              查阅全部 →
            </Link>
          </div>

          {recentWorks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">卷中尚空</div>
              <div className="empty-state-desc">点"纳入新卷"，开启你的阅读观剧之旅</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {recentWorks.map((w) => (
                <WorkCard key={w._id} work={w} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 className="brush-underline">最新批注</h2>
            <Link to="/notes" style={{
              fontFamily: 'var(--font-keishu)',
              fontSize: 13, color: 'var(--ink-light)',
              letterSpacing: '0.15em',
            }}>
              全部笔记 →
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">未有批注</div>
              <div className="empty-state-desc">开卷提笔，记录此刻心情</div>
            </div>
          ) : (
            <div>
              {recentNotes.map((n) => (
                <OldBookPage key={n._id} note={n} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
