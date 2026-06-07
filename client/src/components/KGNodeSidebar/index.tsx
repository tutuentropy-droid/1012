import { useEffect, useState } from 'react';
import type { KGNodeDetail, KGNodeAnnotation, Rating, WorkType } from '@/types';
import { KG_CATEGORY_COLORS, KG_CATEGORY_LABELS, TYPE_LABELS } from '@/types';
import { kgApi } from '@/services';
import SealStamp from '@/components/SealStamp';
import Loading from '@/components/common/Loading';
import dayjs from 'dayjs';

interface Props {
  nodeId: string | null;
  onClose: () => void;
  onUpdate?: () => void;
  onJumpToNode?: (nodeId: string) => void;
}

export default function KGNodeSidebar({ nodeId, onClose, onUpdate, onJumpToNode }: Props) {
  const [detail, setDetail] = useState<KGNodeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!nodeId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    kgApi
      .getNodeDetail(nodeId)
      .then((d) => setDetail(d))
      .finally(() => setLoading(false));
  }, [nodeId]);

  const handleAddAnnotation = async () => {
    if (!nodeId || !newAnnotation.trim() || submitting) return;
    setSubmitting(true);
    try {
      const saved = await kgApi.addAnnotation(nodeId, newAnnotation.trim());
      if (detail) {
        setDetail({
          ...detail,
          node: {
            ...detail.node,
            annotations: [...detail.node.annotations, saved],
          },
        });
      }
      setNewAnnotation('');
      onUpdate?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAnnotation = async (annotationId: string) => {
    if (!nodeId) return;
    await kgApi.removeAnnotation(nodeId, annotationId);
    if (detail) {
      setDetail({
        ...detail,
        node: {
          ...detail.node,
          annotations: detail.node.annotations.filter((a) => a.id !== annotationId),
        },
      });
    }
    onUpdate?.();
  };

  const handleToggleHidden = async () => {
    if (!nodeId || !detail) return;
    const result = await kgApi.toggleHidden(nodeId);
    setDetail({ ...detail, node: { ...detail.node, isHidden: result.isHidden } });
    onUpdate?.();
  };

  if (!nodeId) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        background: 'var(--xuan-light)',
        borderLeft: '1px solid rgba(139,105,20,0.2)',
        boxShadow: '-4px 0 30px rgba(139,105,20,0.08)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 300ms var(--ease-scroll) both',
        zIndex: 10,
      }}
    >
      <div
        style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid rgba(139,105,20,0.15)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--xuan-white)',
            border: `2px solid ${detail ? KG_CATEGORY_COLORS[detail.node.category] : '#8B6914'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-keishu)',
            fontSize: 22,
            color: detail ? KG_CATEGORY_COLORS[detail.node.category] : '#8B6914',
            letterSpacing: '0.1em',
            flexShrink: 0,
          }}
        >
          {detail ? KG_CATEGORY_LABELS[detail.node.category][0] : ''}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 22, letterSpacing: '0.15em' }}>{detail?.node.name || '加载中...'}</h2>
            {detail?.node.isHidden && (
              <span
                style={{
                  padding: '2px 8px',
                  fontSize: 11,
                  fontFamily: 'var(--font-keishu)',
                  background: 'rgba(122,122,122,0.12)',
                  color: 'var(--ink-light)',
                  letterSpacing: '0.1em',
                  borderRadius: 2,
                }}
              >
                已划去
              </span>
            )}
          </div>
          <div style={{ marginTop: 6, fontFamily: 'var(--font-pizhu)', fontSize: 12, color: 'var(--ink-light)', letterSpacing: '0.1em' }}>
            {detail ? KG_CATEGORY_LABELS[detail.node.category] : ''} · 留痕 {detail?.node.frequency || 0} 处
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: 4,
            fontSize: 20,
            color: 'var(--ink-light)',
            fontFamily: 'var(--font-keishu)',
          }}
        >
          ×
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loading text="查阅典籍中..." />
        </div>
      ) : detail ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={handleToggleHidden} style={{ padding: '6px 14px', fontSize: 13 }}>
              {detail.node.isHidden ? '恢复显示' : '划去隐去'}
            </button>
          </div>

          {detail.node.synonyms && detail.node.synonyms.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, letterSpacing: '0.15em', color: 'var(--ink-medium)', marginBottom: 8 }}>
                · 别称 ·
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {detail.node.synonyms.map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: '4px 12px',
                      fontSize: 13,
                      fontFamily: 'var(--font-xingkai)',
                      background: 'rgba(139,105,20,0.06)',
                      color: 'var(--ink-medium)',
                      border: '1px solid rgba(139,105,20,0.15)',
                      borderRadius: 2,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {detail.connectedNodes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, letterSpacing: '0.15em', color: 'var(--ink-medium)', marginBottom: 10 }}>
                · 关联词 ·
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {detail.connectedNodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onJumpToNode?.(n.id)}
                    style={{
                      padding: '4px 12px',
                      fontSize: 13,
                      fontFamily: 'var(--font-keishu)',
                      background: `${KG_CATEGORY_COLORS[n.category]}0D`,
                      color: KG_CATEGORY_COLORS[n.category],
                      border: `1px solid ${KG_CATEGORY_COLORS[n.category]}33`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {n.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, letterSpacing: '0.15em', color: 'var(--ink-medium)', marginBottom: 10 }}>
              · 批注 ·
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {detail.node.annotations.length === 0 ? (
                <div style={{ fontFamily: 'var(--font-pizhu)', fontSize: 12, color: 'var(--ink-light)', padding: '12px 0' }}>
                  尚无批注，可自题数语
                </div>
              ) : (
                detail.node.annotations.map((a: KGNodeAnnotation) => (
                  <div
                    key={a.id}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--xuan-white)',
                      border: '1px solid rgba(139,105,20,0.1)',
                      borderLeft: '3px solid var(--daishi)',
                      position: 'relative',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-xingkai)', fontSize: 14, color: 'var(--ink-medium)', lineHeight: 1.8 }}>{a.content}</div>
                    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-pizhu)', fontSize: 11, color: 'var(--ink-light)', letterSpacing: '0.1em' }}>
                        {dayjs(a.createdAt).format('YYYY.MM.DD')}
                      </span>
                      <button
                        onClick={() => handleRemoveAnnotation(a.id)}
                        style={{ fontSize: 11, fontFamily: 'var(--font-pizhu)', color: 'var(--ink-light)' }}
                      >
                        删去
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
                placeholder="题批注于此..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid rgba(139,105,20,0.2)',
                  background: 'var(--xuan-white)',
                  fontSize: 13,
                  fontFamily: 'var(--font-xingkai)',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddAnnotation();
                }}
              />
              <button
                className="btn btn-primary"
                onClick={handleAddAnnotation}
                disabled={submitting || !newAnnotation.trim()}
                style={{ padding: '6px 16px', fontSize: 13 }}
              >
                题
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, letterSpacing: '0.15em', color: 'var(--ink-medium)', marginBottom: 10 }}>
              · 相关书卷 ·
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {detail.relatedItems.length === 0 ? (
                <div style={{ fontFamily: 'var(--font-pizhu)', fontSize: 12, color: 'var(--ink-light)', padding: '20px 0', textAlign: 'center' }}>
                  卷中无载
                </div>
              ) : (
                detail.relatedItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--xuan-white)',
                      border: '1px solid rgba(139,105,20,0.1)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.moodColor || (item.type === 'work' ? '#C84032' : '#8B6914'),
                        marginTop: 8,
                        flexShrink: 0,
                        opacity: 0.7,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-keishu)',
                            fontSize: 11,
                            padding: '1px 6px',
                            background: item.type === 'work' ? 'rgba(200,64,50,0.08)' : 'rgba(139,105,20,0.08)',
                            color: item.type === 'work' ? '#C84032' : '#8B6914',
                            letterSpacing: '0.1em',
                          }}
                        >
                          {item.type === 'work' ? (item.workType ? TYPE_LABELS[item.workType as WorkType] : '书卷') : '笔记'}
                        </span>
                        {item.title && (
                          <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 14, color: 'var(--ink-strong)', letterSpacing: '0.05em' }}>
                            {item.title}
                          </span>
                        )}
                        {item.workTitle && !item.title && (
                          <span style={{ fontFamily: 'var(--font-pizhu)', fontSize: 11, color: 'var(--ink-light)' }}>
                            《{item.workTitle}》
                          </span>
                        )}
                        {item.rating && item.rating > 0 && <SealStamp value={item.rating as Rating} readonly size="sm" showLabel={false} />}
                      </div>
                      {item.content && (
                        <div
                          style={{
                            fontFamily: 'var(--font-xingkai)',
                            fontSize: 13,
                            color: 'var(--ink-medium)',
                            lineHeight: 1.8,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.content}
                        </div>
                      )}
                      <div style={{ marginTop: 6, fontFamily: 'var(--font-pizhu)', fontSize: 11, color: 'var(--ink-light)', letterSpacing: '0.1em' }}>
                        {dayjs(item.createdAt).format('YYYY年M月D日')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
