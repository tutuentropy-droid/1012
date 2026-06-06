import { useEffect, useMemo, useRef, useState } from 'react';
import type { TasteGraph, TasteNode, TasteCategory, Work } from '@/types';
import { TASTE_CATEGORY_LABELS, TYPE_LABELS, STATUS_LABELS } from '@/types';
import SealStamp from '@/components/SealStamp';
import Loading from '@/components/common/Loading';
import Modal from '@/components/common/Modal';
import { authApi } from '@/services';
import { useUserStore } from '@/stores/user';

interface Props {
  data: TasteGraph;
  loading?: boolean;
  onSealUpdate?: () => void;
}

const CATEGORY_COLORS: Record<TasteCategory, string> = {
  director: '#C0392B',
  actor: '#8E44AD',
  author: '#16A085',
  writer: '#2980B9',
  genre: '#D35400',
};

const CATEGORY_LABEL_CHARS: Record<TasteCategory, string> = {
  director: '导',
  actor: '演',
  author: '著',
  writer: '编',
  genre: '类',
};

export default function TasteGraphComponent({ data, loading, onSealUpdate }: Props) {
  const [activeNode, setActiveNode] = useState<TasteNode | null>(null);
  const [sealSuccess, setSealSuccess] = useState('');
  const longPressTimer = useRef<number | null>(null);
  const { user, setUser } = useUserStore();

  if (loading) return <Loading text="品味图谱绘制中..." />;

  const isSealExist = (node: TasteNode) => {
    if (!user?.tasteSeals) return false;
    return user.tasteSeals.some(
      (s) => s.name === node.name && s.category === node.category
    );
  };

  const handleNodeLongPress = (node: TasteNode) => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = window.setTimeout(async () => {
      await handleStampSeal(node);
    }, 650);
  };

  const handleStampSeal = async (node: TasteNode) => {
    if (isSealExist(node)) {
      setSealSuccess(`「${node.name}」已是品味印记`);
      window.setTimeout(() => setSealSuccess(''), 2500);
      return;
    }
    try {
      const updatedUser = await authApi.addTasteSeal({
        name: node.name,
        category: node.category,
        count: node.count,
        avgRating: node.avgRating,
      });
      setUser(updatedUser);
      setSealSuccess(`「${node.name}」已盖印为品味印记`);
      window.setTimeout(() => setSealSuccess(''), 2500);
      onSealUpdate?.();
    } catch (e: any) {
      setSealSuccess(e.message || '盖印失败');
      window.setTimeout(() => setSealSuccess(''), 2500);
    }
  };

  const handleNodeMouseUp = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const nodeWorks = useMemo(() => {
    if (!activeNode || !data.works) return [];
    return activeNode.works.map((id) => data.works[id]).filter(Boolean) as Work[];
  }, [activeNode, data.works]);

  const layout = useMemo(() => computeLayout(data), [data]);

  return (
    <div style={{ position: 'relative' }}>
      {sealSuccess && (
        <div style={{
          position: 'absolute', top: 16, left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 28px',
          background: 'var(--xuan-white)',
          border: '1px solid var(--zhusha)',
          fontFamily: 'var(--font-keishu)',
          fontSize: 14, letterSpacing: '0.2em',
          color: 'var(--zhusha)',
          boxShadow: 'var(--shadow-ink)',
          zIndex: 20,
          animation: 'pageUnroll 300ms both',
        }}>
          {sealSuccess}
        </div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: '320px 1fr',
        gap: 24, alignItems: 'start',
      }}>
        <LegendPanel data={data} />
        <div style={{
          background: 'radial-gradient(ellipse at center, #FAF6EA 0%, #F2EAD3 100%)',
          border: '1px solid rgba(139,105,20,0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <svg
            width="100%"
            height="560"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            style={{ display: 'block' }}
          >
            <defs>
              <radialGradient id="inkGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(61,61,61,0.12)" />
                <stop offset="100%" stopColor="rgba(61,61,61,0)" />
              </radialGradient>
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <radialGradient key={cat} id={`glow-${cat}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
              ))}
              <filter id="inkBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.2" />
              </filter>
              <filter id="softShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(26,26,26,0.25)" />
              </filter>
            </defs>

            {layout.links.map((link, i) => (
              <g key={i}>
                <line
                  x1={link.source.x} y1={link.source.y}
                  x2={link.target.x} y2={link.target.y}
                  stroke="rgba(61,61,61,0.08)"
                  strokeWidth={Math.max(1, link.value * 0.8)}
                />
              </g>
            ))}

            {layout.nodes.map((node) => {
              const isActive = activeNode?.id === node.id;
              const r = computeRadius(node);
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setActiveNode(node)}
                  onMouseLeave={() => setActiveNode(null)}
                  onMouseDown={() => handleNodeLongPress(node)}
                  onMouseUp={handleNodeMouseUp}
                  onClick={() => setActiveNode(node)}
                >
                  <circle r={r + 18} fill={`url(#glow-${node.category})`} opacity={isActive ? 1 : 0.5} />
                  <circle r={r} fill="var(--xuan-white)" stroke={CATEGORY_COLORS[node.category]} strokeWidth={isActive ? 2.5 : 1.5} filter="url(#softShadow)" />
                  <circle r={r - 6} fill="none" stroke={CATEGORY_COLORS[node.category]} strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="var(--font-keishu)"
                    fontSize={Math.max(10, Math.min(16, r * 0.42))}
                    fill="var(--ink-strong)"
                    letterSpacing="0.05em"
                  >
                    {truncateName(node.name, Math.max(2, Math.floor(r / 11)))}
                  </text>
                  <g transform={`translate(${r - 4}, ${-r + 4})`}>
                    <circle r="10" fill={CATEGORY_COLORS[node.category]} />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="var(--font-keishu)"
                      fontSize="10"
                      fill="var(--xuan-white)"
                    >
                      {CATEGORY_LABEL_CHARS[node.category]}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          <div style={{
            position: 'absolute', bottom: 12, left: 16, right: 16,
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--font-pizhu)', fontSize: 11,
            color: 'var(--ink-light)', letterSpacing: '0.15em',
          }}>
            <span>· 轻点查看相关作品 ·</span>
            <span>· 长按盖印品味印记 ·</span>
          </div>
        </div>
      </div>

      <Modal open={!!activeNode} onClose={() => setActiveNode(null)} title={`${TASTE_CATEGORY_LABELS[activeNode?.category || 'director']} · ${activeNode?.name}`} width="680px">
        {activeNode && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '16px 20px', marginBottom: 20,
              background: `linear-gradient(90deg, ${CATEGORY_COLORS[activeNode.category]}15 0%, transparent 100%)`,
              borderLeft: `4px solid ${CATEGORY_COLORS[activeNode.category]}`,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--xuan-white)',
                border: `2px solid ${CATEGORY_COLORS[activeNode.category]}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-keishu)', fontSize: 28,
                color: CATEGORY_COLORS[activeNode.category],
                letterSpacing: '0.1em',
              }}>
                {CATEGORY_LABEL_CHARS[activeNode.category]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-keishu)', fontSize: 22,
                  letterSpacing: '0.2em', color: 'var(--ink-strong)',
                  marginBottom: 6,
                }}>{activeNode.name}</div>
                <div style={{
                  display: 'flex', gap: 24,
                  fontFamily: 'var(--font-pizhu)', fontSize: 13,
                  color: 'var(--ink-medium)', letterSpacing: '0.1em',
                }}>
                  <span>留痕 <strong style={{ color: CATEGORY_COLORS[activeNode.category], fontFamily: 'var(--font-keishu)', fontSize: 16 }}>{activeNode.count}</strong> 部</span>
                  {activeNode.avgRating > 0 && (
                    <span>平均品第 <strong style={{ color: 'var(--zhusha)', fontFamily: 'var(--font-keishu)', fontSize: 16 }}>{activeNode.avgRating}</strong></span>
                  )}
                </div>
              </div>
              <button
                className={isSealExist(activeNode) ? 'btn' : 'btn btn-primary'}
                onClick={() => handleStampSeal(activeNode)}
                disabled={isSealExist(activeNode)}
              >
                {isSealExist(activeNode) ? '已是印记' : '盖为印记'}
              </button>
            </div>

            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              <div style={{
                fontFamily: 'var(--font-keishu)', fontSize: 14,
                letterSpacing: '0.15em', color: 'var(--ink-medium)',
                marginBottom: 16,
              }}>· 相关作品 ·</div>
              {nodeWorks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-light)', fontFamily: 'var(--font-pizhu)', fontSize: 13, letterSpacing: '0.1em' }}>
                  卷中无载
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {nodeWorks.map((w) => (
                    <div key={w._id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 16px',
                      background: 'var(--xuan-light)',
                      border: '1px solid rgba(139,105,20,0.1)',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: w.moodColor || 'var(--zhusha-light)',
                        opacity: 0.6,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: 'var(--font-keishu)', fontSize: 14,
                          color: 'var(--ink-strong)', letterSpacing: '0.05em',
                          marginBottom: 4,
                        }}>{w.title}</div>
                        <div style={{
                          display: 'flex', gap: 10,
                          fontFamily: 'var(--font-pizhu)', fontSize: 11,
                          color: 'var(--ink-light)', letterSpacing: '0.08em',
                        }}>
                          <span>{TYPE_LABELS[w.type]}</span>
                          <span>{STATUS_LABELS[w.status]}</span>
                          {w.author && <span>{w.author}</span>}
                        </div>
                      </div>
                      {w.rating > 0 && <SealStamp value={w.rating} readonly size="sm" showLabel={false} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function LegendPanel({ data }: { data: TasteGraph }) {
  const sections: { title: string; key: TasteCategory; items: typeof data.topDirectors }[] = [
    { title: '导演', key: 'director', items: data.topDirectors.slice(0, 8) },
    { title: '作者', key: 'author', items: data.topAuthors.slice(0, 8) },
    { title: '演员', key: 'actor', items: data.topActors.slice(0, 8) },
    { title: '类型', key: 'genre', items: data.topGenres.slice(0, 8) },
  ];

  return (
    <div style={{
      background: 'var(--xuan-light)',
      border: '1px solid rgba(139,105,20,0.12)',
      padding: 20,
    }}>
      <div style={{
        fontFamily: 'var(--font-keishu)', fontSize: 18,
        letterSpacing: '0.3em', color: 'var(--ink-strong)',
        textAlign: 'center', marginBottom: 20,
        paddingBottom: 12, borderBottom: '1px solid rgba(139,105,20,0.15)',
      }}>
        品 味 谱 系
      </div>

      {sections.map((s) => s.items.length > 0 && (
        <div key={s.key} style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 10,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              background: CATEGORY_COLORS[s.key],
            }} />
            <span style={{
              fontFamily: 'var(--font-keishu)', fontSize: 13,
              letterSpacing: '0.15em', color: 'var(--ink-medium)',
            }}>{s.title}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {s.items.map((item, i) => (
              <div key={item.name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 10px',
                background: i < 3 ? `${CATEGORY_COLORS[s.key]}08` : 'transparent',
                borderLeft: `2px solid ${i < 3 ? CATEGORY_COLORS[s.key] : 'transparent'}`,
              }}>
                <span style={{
                  fontFamily: 'var(--font-keishu)', fontSize: 12,
                  color: 'var(--ink-light)', width: 18,
                }}>{i + 1}</span>
                <span style={{
                  flex: 1,
                  fontFamily: 'var(--font-keishu)', fontSize: 13,
                  color: 'var(--ink-strong)', letterSpacing: '0.05em',
                }}>{item.name}</span>
                <span style={{
                  fontFamily: 'var(--font-keishu)', fontSize: 12,
                  color: CATEGORY_COLORS[s.key],
                }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{
        marginTop: 16, paddingTop: 16,
        borderTop: '1px dashed rgba(139,105,20,0.15)',
        fontFamily: 'var(--font-pizhu)', fontSize: 11,
        color: 'var(--ink-light)', lineHeight: 1.8,
        letterSpacing: '0.05em',
      }}>
        · 左列为谱系榜单，右图为人物交游网<br />
        · 节点越大，留痕越多，墨色越浓<br />
        · 连线代表合作或同属关系
      </div>
    </div>
  );
}

function truncateName(name: string, maxChars: number) {
  if (!name) return '';
  if (name.length <= maxChars) return name;
  if (/[a-zA-Z]/.test(name)) {
    return name.slice(0, maxChars * 2);
  }
  return name.slice(0, maxChars);
}

function computeRadius(node: TasteNode) {
  const base = 18;
  const scale = Math.min(28, node.count * 3.5);
  return base + scale;
}

function computeLayout(data: TasteGraph) {
  const width = 760;
  const height = 560;
  const nodes = data.network.nodes || [];
  const links = data.network.links || [];
  const categories: TasteCategory[] = ['director', 'author', 'actor', 'writer', 'genre'];

  const byCategory: Record<string, TasteNode[]> = {};
  categories.forEach((c) => (byCategory[c] = []));
  nodes.forEach((n) => {
    if (!byCategory[n.category]) byCategory[n.category] = [];
    byCategory[n.category].push(n);
  });

  const positioned: Array<TasteNode & { x: number; y: number }> = [];
  const centerX = width / 2;
  const centerY = height / 2;

  const categoryPositions: Record<string, { x: number; y: number; radius: number }> = {
    director: { x: centerX - 180, y: centerY - 100, radius: 120 },
    author: { x: centerX + 180, y: centerY - 100, radius: 110 },
    actor: { x: centerX, y: centerY + 120, radius: 150 },
    writer: { x: centerX - 180, y: centerY + 100, radius: 90 },
    genre: { x: centerX + 180, y: centerY + 100, radius: 100 },
  };

  categories.forEach((cat) => {
    const list = byCategory[cat] || [];
    const pos = categoryPositions[cat];
    const sorted = [...list].sort((a, b) => b.count - a.count);
    sorted.forEach((node, i) => {
      const r = computeRadius(node);
      const angle = (i / Math.max(1, sorted.length)) * Math.PI * 2 + (cat.length * 0.5);
      const distance = pos.radius * (0.3 + (i / Math.max(1, sorted.length)) * 0.7);
      const x = pos.x + Math.cos(angle) * distance;
      const y = pos.y + Math.sin(angle) * distance;
      positioned.push({
        ...node,
        x: Math.max(r + 20, Math.min(width - r - 20, x)),
        y: Math.max(r + 20, Math.min(height - r - 20, y)),
      });
    });
  });

  const nodeMap = new Map(positioned.map((n) => [n.id, n]));
  const posLinks = links
    .map((l) => {
      const s = nodeMap.get(l.source);
      const t = nodeMap.get(l.target);
      if (!s || !t) return null;
      return { source: s, target: t, value: l.value };
    })
    .filter(Boolean) as Array<{ source: typeof positioned[0]; target: typeof positioned[0]; value: number }>;

  return { width, height, nodes: positioned, links: posLinks };
}
