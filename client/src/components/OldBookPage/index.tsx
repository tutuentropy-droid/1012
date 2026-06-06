import { useState } from 'react';
import type { Note, NoteWithWork, Work } from '@/types';
import { formatDate, formatShortDate } from '@/utils/date';
import { useUserStore } from '@/stores/user';

interface Props {
  note: Note | NoteWithWork;
  work?: Work;
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  variant?: 'vertical' | 'horizontal';
}

export default function OldBookPage({ note, work, onEdit, onDelete, variant = 'vertical' }: Props) {
  const { chineseColors, binding } = useUserStore();
  const [hovered, setHovered] = useState(false);
  const sealText = binding.sealStyle === 'yiyue' ? '已阅'
    : binding.sealStyle === 'shenpin' ? '神品'
    : binding.sealStyle === 'jingdu' ? '静读' : '';

  const colorMeta = chineseColors.find((c) => c.hex === note.moodColor);
  const workTitle = work?.title || (typeof note.workId === 'object' ? (note.workId as any).title : '');
  const workType = work?.type || (typeof note.workId === 'object' ? (note.workId as any).type : '');

  const locationText = note.location
    ? [
        note.location.chapter ? `第 ${note.location.chapter} 章` : '',
        note.location.episode ? `第 ${note.location.episode} 集` : '',
        note.location.page ? `第 ${note.location.page} 页` : '',
      ].filter(Boolean).join(' · ')
    : '';

  return (
    <div
      className="old-book-page"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: 'var(--xuan-cream)',
        padding: variant === 'vertical' ? '32px 28px 28px 40px' : '24px 28px',
        marginBottom: 24,
        boxShadow: 'var(--shadow-paper)',
        border: '1px solid rgba(139, 105, 20, 0.1)',
        transition: 'all var(--dur-normal) var(--ease-scroll)',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* 左侧折痕 */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 24,
        background: 'linear-gradient(90deg, rgba(139,105,20,0.12) 0%, transparent 100%)',
        borderRight: '1px dashed rgba(139, 105, 20, 0.15)',
      }} />

      {/* 横线纹理 */}
      <div style={{
        position: 'absolute',
        inset: '24px 24px 24px 40px',
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 29px, rgba(74,85,104,0.08) 30px)',
        backgroundSize: '100% 30px',
        pointerEvents: 'none',
      }} />

      {/* 角落墨梅装饰 */}
      {!sealText && (
        <svg width="48" height="48" viewBox="0 0 48 48" style={{
          position: 'absolute', bottom: 8, right: 8, opacity: 0.12,
        }}>
          <circle cx="24" cy="24" r="3" fill="#1A1A1A" />
          <circle cx="18" cy="20" r="2.5" fill="#1A1A1A" />
          <circle cx="30" cy="20" r="2.5" fill="#1A1A1A" />
          <circle cx="20" cy="30" r="2.5" fill="#1A1A1A" />
          <circle cx="28" cy="30" r="2.5" fill="#1A1A1A" />
        </svg>
      )}

      {/* 闲章 */}
      {sealText && (
        <div className="corner-seal corner-seal-bottom-right" style={{ width: 44, height: 44, fontSize: 13 }}>
          {sealText}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 顶部元信息 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, paddingBottom: 8,
          borderBottom: '1px solid rgba(139,105,20,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {workTitle && (
              <span style={{
                fontFamily: 'var(--font-keishu)',
                color: 'var(--ink-heavy)',
                fontSize: 14,
                letterSpacing: '0.1em',
              }}>
                《{workTitle}》{workType ? ` · ${workType === 'tv' ? '剧集' : workType === 'book' ? '书籍' : workType === 'movie' ? '电影' : '其他'}` : ''}
              </span>
            )}
            {locationText && (
              <span style={{
                fontFamily: 'var(--font-pizhu)',
                fontSize: 'var(--fs-pizhu)',
                color: 'var(--ink-light)',
              }}>
                {locationText}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {note.moodColor && (
              <div
                title={colorMeta ? `${colorMeta.name} · ${colorMeta.desc}` : ''}
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: note.moodColor,
                  border: '2px solid var(--xuan-white)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{
              fontFamily: 'var(--font-pizhu)',
              fontSize: 'var(--fs-pizhu)',
              color: 'var(--ink-light)',
            }}>
              {formatDate(note.createdAt)}
            </span>
          </div>
        </div>

        {/* 笔记内容 */}
        <div style={{
          fontFamily: 'var(--font-xingkai)',
          fontSize: 'var(--fs-body)',
          lineHeight: '30px',
          color: 'var(--ink-medium)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          textShadow: '0 0 1px rgba(26,26,26,0.1)',
          letterSpacing: '0.04em',
        }}>
          {note.content}
        </div>

        {/* 操作区 */}
        {hovered && (onEdit || onDelete) && (
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'flex-end',
            marginTop: 16, paddingTop: 8,
            borderTop: '1px dashed rgba(139,105,20,0.15)',
          }}>
            {onEdit && (
              <button className="btn btn-ghost" style={{ fontSize: 13, padding: '4px 12px' }} onClick={() => onEdit(note as Note)}>
                改批
              </button>
            )}
            {onDelete && (
              <button
                className="btn btn-ghost"
                style={{ fontSize: 13, padding: '4px 12px', color: 'var(--zhusha)' }}
                onClick={() => onDelete(note._id)}
              >
                抹去
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
