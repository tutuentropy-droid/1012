import { useState, useMemo } from 'react';
import type { Work } from '@/types';
import { TYPE_LABELS } from '@/types';
import SealStamp from '@/components/SealStamp';

interface Props {
  works: Work[];
  order: string[];
  onChange: (newOrder: string[]) => void;
  onSelect?: (work: Work) => void;
}

export default function HeartShelf({ works, order, onChange, onSelect }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const orderedWorks = useMemo(() => {
    const workMap = new Map(works.map((w) => [w._id, w]));
    const ordered = order
      .map((id) => workMap.get(id))
      .filter(Boolean) as Work[];
    const remaining = works.filter((w) => !order.includes(w._id));
    return [...ordered, ...remaining];
  }, [works, order]);

  const shelfRows = useMemo(() => {
    const rows: Work[][] = [];
    const perRow = 4;
    for (let i = 0; i < orderedWorks.length; i += perRow) {
      rows.push(orderedWorks.slice(i, i + perRow));
    }
    if (rows.length === 0) rows.push([]);
    return rows;
  }, [orderedWorks]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedId;
    if (!sourceId || sourceId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const currentIds = orderedWorks.map((w) => w._id);
    const sourceIdx = currentIds.indexOf(sourceId);
    const targetIdx = currentIds.indexOf(targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newOrder = [...currentIds];
    newOrder.splice(sourceIdx, 1);
    newOrder.splice(targetIdx, 0, sourceId);
    onChange(newOrder);

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

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
        }}>书架尚空</div>
        <div style={{
          fontFamily: 'var(--font-pizhu)',
          fontSize: 13,
          color: 'var(--ink-light)',
          letterSpacing: '0.1em',
        }}>尚无可排之卷</div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
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
        }}>心 序</div>
        <div style={{
          fontFamily: 'var(--font-pizhu)',
          fontSize: 12,
          color: 'var(--ink-light)',
          letterSpacing: '0.15em',
        }}>手自排定 · 心中谱系</div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 24px 24px',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {shelfRows.map((row, rowIdx) => (
            <div key={rowIdx} style={{ position: 'relative' }}>
              <div style={{
                display: 'flex',
                gap: 14,
                padding: '16px 12px 8px',
                minHeight: 160,
                alignItems: 'flex-end',
                borderBottom: `6px solid`,
                borderImage: 'linear-gradient(90deg, transparent 3%, #6B4F10 3%, #6B4F10 97%, transparent 97%) 1',
              }}>
                {row.map((work) => {
                  const isDragging = draggedId === work._id;
                  const isDragOver = dragOverId === work._id;
                  return (
                    <div
                      key={work._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, work._id)}
                      onDragOver={(e) => handleDragOver(e, work._id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, work._id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onSelect?.(work)}
                      style={{
                        flex: '0 0 auto',
                        width: 96,
                        height: 130 + (work.rating || 0) * 6,
                        background: work.moodColor
                          ? `linear-gradient(180deg, ${work.moodColor}33 0%, var(--xuan-light) 100%)`
                          : 'var(--xuan-light)',
                        border: isDragOver
                          ? '2px dashed var(--zhusha)'
                          : '1px solid rgba(139,105,20,0.2)',
                        borderRadius: '2px 2px 0 0',
                        padding: '10px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        opacity: isDragging ? 0.4 : 1,
                        transform: isDragging ? 'rotate(-3deg) scale(0.95)' : 'none',
                        transition: 'all var(--dur-fast) var(--ease-scroll)',
                        boxShadow: isDragOver
                          ? '0 0 0 3px var(--zhusha-light)'
                          : '0 2px 6px rgba(139,105,20,0.1)',
                        position: 'relative',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 4,
                        right: 4,
                        height: 3,
                        background: work.moodColor || 'var(--zhusha)',
                        opacity: 0.7,
                      }} />

                      <div style={{
                        writingMode: 'vertical-rl',
                        fontFamily: 'var(--font-keishu)',
                        fontSize: 14,
                        color: 'var(--ink-strong)',
                        letterSpacing: '0.15em',
                        lineHeight: 1.5,
                        textAlign: 'center',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        maxHeight: 80,
                        overflow: 'hidden',
                      }}>
                        {work.title.slice(0, 8)}
                        {work.title.length > 8 && '…'}
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-pizhu)',
                          fontSize: 9,
                          color: 'var(--ink-light)',
                          letterSpacing: '0.08em',
                        }}>
                          {TYPE_LABELS[work.type]}
                        </div>
                        {work.rating > 0 && (
                          <SealStamp value={work.rating} readonly size="sm" showLabel={false} />
                        )}
                      </div>
                    </div>
                  );
                })}

                {row.length < 4 && (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start',
                    paddingBottom: 2,
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-pizhu)',
                      fontSize: 11,
                      color: 'var(--ink-light)',
                      letterSpacing: '0.15em',
                      opacity: 0.5,
                    }}>
                      — 留白以待 —
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                height: 4,
                background: 'linear-gradient(90deg, transparent, #4A3708 20%, #4A3708 80%, transparent)',
                opacity: 0.6,
                margin: '0 8px',
              }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 24px 16px',
        fontFamily: 'var(--font-pizhu)',
        fontSize: 11,
        color: 'var(--ink-light)',
        letterSpacing: '0.1em',
      }}>
        <span>上 · 首选</span>
        <span>拖拽书卷以排定次序</span>
        <span>下 · 次选</span>
      </div>
    </div>
  );
}
