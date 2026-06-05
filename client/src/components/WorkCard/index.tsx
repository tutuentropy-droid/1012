import { Link } from 'react-router-dom';
import type { Work } from '@/types';
import { STATUS_LABELS, TYPE_LABELS } from '@/types';
import SealStamp from '@/components/SealStamp';
import { formatRelative } from '@/utils/date';

interface Props {
  work: Work;
  onUpdate?: (work: Work) => void;
}

const statusColorMap: Record<string, string> = {
  wish: 'var(--yanzi)',
  watching: 'var(--qingzhu)',
  watched: 'var(--zhusha)',
  paused: 'var(--daishi)',
  dropped: 'var(--ink-charred)',
};

export default function WorkCard({ work, onUpdate }: Props) {
  const progressText = work.type === 'tv' && work.totalEpisodes
    ? `${work.currentEpisode} / ${work.totalEpisodes} 集`
    : (work.type === 'book' || work.type === 'other') && work.totalPages
    ? `${work.currentPage} / ${work.totalPages} 页`
    : work.type === 'tv'
    ? `第 ${work.currentEpisode} 集`
    : work.type === 'book' || work.type === 'other'
    ? `第 ${work.currentPage} 页`
    : '';

  return (
    <Link
      to={`/works/${work._id}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          position: 'relative',
          background: 'var(--xuan-light)',
          padding: 28,
          border: '1px solid rgba(139,105,20,0.12)',
          transition: 'all var(--dur-normal) var(--ease-scroll)',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        className="xuan-paper"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-paper)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'none';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
      >
        {work.moodColor && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 5, height: '100%',
            background: work.moodColor, opacity: 0.7,
          }} />
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11, fontFamily: 'var(--font-keishu)',
                  letterSpacing: '0.15em', padding: '2px 8px',
                  border: `1px solid ${statusColorMap[work.status]}`,
                  color: statusColorMap[work.status],
                  borderRadius: 2,
                }}
              >
                {STATUS_LABELS[work.status]}
              </span>
              <span style={{
                fontSize: 11, fontFamily: 'var(--font-keishu)',
                letterSpacing: '0.15em', color: 'var(--ink-light)',
              }}>
                {TYPE_LABELS[work.type]}
              </span>
            </div>

            <h3 style={{
              fontFamily: 'var(--font-keishu)',
              fontSize: 20, letterSpacing: '0.08em',
              color: 'var(--ink-strong)', margin: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {work.title}
            </h3>

            {work.subtitle && (
              <p style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-pizhu)',
                fontSize: 13, color: 'var(--ink-light)',
                letterSpacing: '0.05em',
              }}>
                {work.subtitle}
              </p>
            )}

            {work.author && (
              <p style={{
                margin: '8px 0 0',
                fontFamily: 'var(--font-keishu)',
                fontSize: 13, color: 'var(--ink-charred)',
                letterSpacing: '0.08em',
              }}>
                {work.type === 'tv' || work.type === 'movie' ? '导演' : '作者'}：{work.author}
              </p>
            )}

            {progressText && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{
                    fontSize: 12, fontFamily: 'var(--font-keishu)',
                    color: 'var(--ink-light)', letterSpacing: '0.1em',
                  }}>
                    进度
                  </span>
                  <span style={{
                    fontSize: 12, fontFamily: 'var(--font-keishu)',
                    color: 'var(--ink-medium)', letterSpacing: '0.1em',
                  }}>
                    {progressText}
                  </span>
                </div>
                <div style={{
                  height: 3, background: 'rgba(139,105,20,0.1)',
                  borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${work.progressPercent || 0}%`,
                    background: work.status === 'watched' ? 'var(--zhusha)' : 'var(--cangse)',
                    borderRadius: 2,
                    transition: 'width var(--dur-normal)',
                  }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
            {work.rating > 0 && <SealStamp value={work.rating} readonly size="sm" showLabel={false} />}
            {work.noteCount > 0 && (
              <span style={{
                fontFamily: 'var(--font-keishu)',
                fontSize: 12, letterSpacing: '0.1em',
                color: 'var(--daishi)',
              }}>
                批 × {work.noteCount}
              </span>
            )}
          </div>
        </div>

        {work.tags && work.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
            {work.tags.slice(0, 4).map((tag) => (
              <span
                key={tag._id}
                style={{
                  fontFamily: 'var(--font-pizhu)',
                  fontSize: 11, letterSpacing: '0.1em',
                  padding: '2px 10px',
                  background: tag.color || 'rgba(139,105,20,0.1)',
                  color: tag.color ? 'var(--xuan-white)' : 'var(--ink-medium)',
                  borderRadius: 999,
                }}
              >
                {tag.name}
              </span>
            ))}
            {work.tags.length > 4 && (
              <span style={{ fontSize: 11, color: 'var(--ink-light)' }}>…</span>
            )}
          </div>
        )}

        <div style={{
          position: 'absolute', bottom: 8, right: 16,
          fontFamily: 'var(--font-pizhu)',
          fontSize: 11, color: 'var(--ink-light)',
          letterSpacing: '0.08em',
        }}>
          {formatRelative(work.updatedAt)}
        </div>
      </div>
    </Link>
  );
}
