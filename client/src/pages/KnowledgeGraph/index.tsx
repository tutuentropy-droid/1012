import { useEffect, useMemo, useRef, useState } from 'react';
import type { KnowledgeGraph, KGEdge, KGNodeCategory, KGTimelineSnapshot } from '@/types';
import { KG_CATEGORY_COLORS, KG_CATEGORY_LABELS } from '@/types';
import { kgApi } from '@/services';
import KnowledgeGraphCanvas from '@/components/KnowledgeGraphCanvas';
import KGNodeSidebar from '@/components/KGNodeSidebar';
import Loading from '@/components/common/Loading';
import dayjs from 'dayjs';

type ViewMode = 'graph' | 'timeline';

export default function KnowledgeGraphPage() {
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [manualConnectMode, setManualConnectMode] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<KGNodeCategory>>(
    new Set(['person', 'place', 'era', 'imagery', 'theme', 'work'])
  );
  const [showHidden, setShowHidden] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; edge: KGEdge } | null>(null);
  const [timelineIndex, setTimelineIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quarterSummary, setQuarterSummary] = useState<KGTimelineSnapshot | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const svgRef = useRef<SVGSVGElement>(null);
  const playTimerRef = useRef<number | null>(null);

  const loadGraph = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await kgApi.getGraph(force);
      setGraph(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  useEffect(() => {
    return () => {
      if (playTimerRef.current) window.clearInterval(playTimerRef.current);
    };
  }, []);

  const visibleNodeIds = useMemo(() => {
    if (!graph) return new Set<string>();
    const ids = new Set<string>();
    graph.nodes.forEach((n) => {
      if (!activeCategories.has(n.category)) return;
      if (!showHidden && n.isHidden) return;
      if (timelineIndex >= 0 && graph.timeline.length > 0) {
        const cumNodes = new Set<string>();
        for (let i = 0; i <= timelineIndex && i < graph.timeline.length; i++) {
          graph.timeline[i].newNodes.forEach((id) => cumNodes.add(id));
        }
        if (!cumNodes.has(n.id)) return;
      }
      ids.add(n.id);
    });
    return ids;
  }, [graph, activeCategories, showHidden, timelineIndex]);

  const highlightNodeIds = useMemo(() => {
    if (!selectedNodeId || !graph) return undefined;
    const ids = new Set<string>([selectedNodeId]);
    graph.edges.forEach((e) => {
      if (e.source === selectedNodeId) ids.add(e.target);
      if (e.target === selectedNodeId) ids.add(e.source);
    });
    return ids;
  }, [selectedNodeId, graph]);

  const handleManualConnect = async (sourceId: string, targetId: string) => {
    try {
      await kgApi.addManualEdge(sourceId, targetId);
      await loadGraph();
      setManualConnectMode(false);
    } catch (e: any) {
      alert(e.message || '连线失败');
    }
  };

  const handleEdgeContextMenu = (edge: KGEdge, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, edge });
  };

  const handleDeleteEdge = async () => {
    if (!contextMenu) return;
    await kgApi.removeEdge(contextMenu.edge.id);
    setContextMenu(null);
    await loadGraph();
  };

  const toggleCategory = (cat: KGNodeCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handlePlayTimeline = () => {
    if (!graph || graph.timeline.length === 0) return;
    setIsPlaying(true);
    setTimelineIndex(-1);
    let idx = -1;
    playTimerRef.current = window.setInterval(() => {
      idx++;
      if (idx >= graph.timeline.length) {
        if (playTimerRef.current) window.clearInterval(playTimerRef.current);
        setIsPlaying(false);
        setQuarterSummary(null);
        return;
      }
      setTimelineIndex(idx);
      setQuarterSummary(graph.timeline[idx]);
    }, 1800);
  };

  const handleStopTimeline = () => {
    if (playTimerRef.current) window.clearInterval(playTimerRef.current);
    setIsPlaying(false);
    setTimelineIndex(-1);
    setQuarterSummary(null);
  };

  const handleExportImage = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svgBlob = new Blob(['<?xml version="1.0" standalone="no"?>\r\n' + source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(scale, scale);
      ctx.fillStyle = '#FAF6EA';
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `知识谱-${dayjs().format('YYYYMMDD')}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
    };
    img.src = url;
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    const blob = await kgApi.exportData(format);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob as any);
    a.download = `知识谱词表-${dayjs().format('YYYYMMDD')}.${format}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleJumpToNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loading text="知识谱绘制中..." />
      </div>
    );
  }

  if (!graph) return null;

  return (
    <div
      style={{ position: 'relative' }}
      onClick={() => setContextMenu(null)}
    >
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, letterSpacing: '0.3em', marginBottom: 8 }}>知 识 谱</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-light)', fontFamily: 'var(--font-pizhu)', letterSpacing: '0.15em' }}>
          墨线相连，浓淡知情 · 共 {graph.nodes.length} 词 · {graph.edges.length} 缘 · {graph.totalNotes} 条笔记
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ background: 'var(--xuan-light)', border: '1px solid rgba(139,105,20,0.12)', padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 16, letterSpacing: '0.25em', textAlign: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(139,105,20,0.15)' }}>
              类 目
            </div>
            {(['person', 'place', 'era', 'imagery', 'theme', 'work'] as KGNodeCategory[]).map((cat) => {
              const count = graph.nodes.filter((n) => n.category === cat).length;
              const active = activeCategories.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    width: '100%',
                    textAlign: 'left',
                    background: active ? `${KG_CATEGORY_COLORS[cat]}0D` : 'transparent',
                    borderLeft: active ? `3px solid ${KG_CATEGORY_COLORS[cat]}` : '3px solid transparent',
                    opacity: active ? 1 : 0.45,
                    marginBottom: 4,
                  }}
                >
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: KG_CATEGORY_COLORS[cat] }} />
                  <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-strong)', letterSpacing: '0.1em', flex: 1 }}>
                    {KG_CATEGORY_LABELS[cat]}
                  </span>
                  <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 12, color: KG_CATEGORY_COLORS[cat] }}>{count}</span>
                </button>
              );
            })}

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed rgba(139,105,20,0.15)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'var(--font-pizhu)', fontSize: 12, color: 'var(--ink-medium)', letterSpacing: '0.1em' }}>
                <input
                  type="checkbox"
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                  style={{ accentColor: 'var(--zhusha)' }}
                />
                显示已划去词语
              </label>
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className={manualConnectMode ? 'btn btn-primary' : 'btn'}
                onClick={() => setManualConnectMode(!manualConnectMode)}
                style={{ padding: '8px 14px', fontSize: 13 }}
              >
                {manualConnectMode ? '连线中（朱砂）' : '朱砂连线'}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => loadGraph(true)}
                disabled={refreshing}
                style={{ padding: '8px 14px', fontSize: 13 }}
              >
                {refreshing ? '重绘中...' : '重绘图谱'}
              </button>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed rgba(139,105,20,0.15)' }}>
              <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 12, letterSpacing: '0.15em', color: 'var(--ink-medium)', marginBottom: 10 }}>
                导出
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button className="btn btn-ghost" onClick={handleExportImage} style={{ padding: '6px 12px', fontSize: 12 }}>
                  高清图 PNG
                </button>
                <button className="btn btn-ghost" onClick={() => handleExportData('json')} style={{ padding: '6px 12px', fontSize: 12 }}>
                  词表 JSON
                </button>
                <button className="btn btn-ghost" onClick={() => handleExportData('csv')} style={{ padding: '6px 12px', fontSize: 12 }}>
                  词表 CSV
                </button>
              </div>
            </div>

            <div style={{ marginTop: 16, fontFamily: 'var(--font-pizhu)', fontSize: 11, color: 'var(--ink-light)', lineHeight: 1.9, letterSpacing: '0.05em' }}>
              · 点选词语查阅详情<br />
              · 右键朱砂线可删去<br />
              · 拖动词语可调位置<br />
              · 墨色越浓，关联越深
            </div>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <div
            style={{
              position: 'relative',
              border: '1px solid rgba(139,105,20,0.15)',
              overflow: 'hidden',
            }}
          >
            <KnowledgeGraphCanvas
              data={graph}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onEdgeContextMenu={handleEdgeContextMenu}
              manualConnectMode={manualConnectMode}
              onManualConnect={handleManualConnect}
              visibleNodeIds={visibleNodeIds}
              highlightNodeIds={highlightNodeIds}
              hoveredNodeId={hoveredNodeId}
              onHoverNode={setHoveredNodeId}
              svgRef={svgRef}
            />

            {manualConnectMode && (
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '10px 24px',
                  background: 'var(--xuan-white)',
                  border: '1px solid var(--zhusha)',
                  fontFamily: 'var(--font-keishu)',
                  fontSize: 13,
                  color: 'var(--zhusha)',
                  letterSpacing: '0.2em',
                  boxShadow: 'var(--shadow-ink)',
                  zIndex: 5,
                }}
              >
                · 依次点选两词以朱砂牵线 ·
              </div>
            )}

            {quarterSummary && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  right: selectedNodeId ? 396 : 16,
                  padding: '16px 20px',
                  background: 'var(--xuan-white)',
                  border: '1px solid rgba(139,105,20,0.2)',
                  boxShadow: 'var(--shadow-deep)',
                  animation: 'pageUnroll 400ms var(--ease-scroll) both',
                  zIndex: 5,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 16, color: 'var(--ink-strong)', letterSpacing: '0.2em' }}>
                    {quarterSummary.quarter}
                  </span>
                  <span style={{ fontFamily: 'var(--font-pizhu)', fontSize: 11, color: 'var(--ink-light)', letterSpacing: '0.1em' }}>
                    +{quarterSummary.newNodes.length} 词 · +{quarterSummary.newEdges.length} 缘
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-xingkai)', fontSize: 14, color: 'var(--ink-medium)', lineHeight: 1.9 }}>
                  {quarterSummary.summary}
                </div>
                {quarterSummary.topTerms.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {quarterSummary.topTerms.map((t) => (
                      <span key={t} style={{ fontFamily: 'var(--font-keishu)', fontSize: 12, padding: '2px 10px', background: 'var(--zhusha-light)', color: 'var(--zhusha)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <KGNodeSidebar
              nodeId={selectedNodeId}
              onClose={() => setSelectedNodeId(null)}
              onUpdate={() => loadGraph()}
              onJumpToNode={handleJumpToNode}
            />
          </div>

          {graph.timeline.length > 0 && (
            <div style={{ marginTop: 16, padding: '16px 24px', background: 'var(--xuan-light)', border: '1px solid rgba(139,105,20,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--font-keishu)', fontSize: 14, letterSpacing: '0.2em', color: 'var(--ink-strong)' }}>
                  · 岁 月 长 卷 ·
                </div>
                {isPlaying ? (
                  <button className="btn" onClick={handleStopTimeline} style={{ padding: '4px 14px', fontSize: 12 }}>
                    停止回放
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handlePlayTimeline} style={{ padding: '4px 14px', fontSize: 12 }}>
                    回放生长
                  </button>
                )}
                <div style={{ flex: 1 }} />
                <span style={{ fontFamily: 'var(--font-pizhu)', fontSize: 12, color: 'var(--ink-light)', letterSpacing: '0.1em' }}>
                  {timelineIndex >= 0 ? graph.timeline[timelineIndex]?.quarter : '全部时期'}
                </span>
              </div>
              <div style={{ position: 'relative', padding: '20px 0 10px' }}>
                <div style={{ height: 2, background: 'rgba(139,105,20,0.2)', position: 'relative' }}>
                  {graph.timeline.map((snap, idx) => {
                    const left = ((idx + 1) / (graph.timeline.length + 1)) * 100;
                    const isActive = idx <= timelineIndex || timelineIndex < 0;
                    const isCurrent = idx === timelineIndex;
                    return (
                      <div
                        key={snap.id || idx}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: `${left}%`,
                          transform: 'translate(-50%, -50%)',
                          width: isCurrent ? 14 : 10,
                          height: isCurrent ? 14 : 10,
                          borderRadius: '50%',
                          background: isActive ? (isCurrent ? 'var(--zhusha)' : 'var(--daishi)') : 'rgba(139,105,20,0.25)',
                          border: '2px solid var(--xuan-light)',
                          cursor: 'pointer',
                          transition: 'all 200ms',
                        }}
                        onClick={() => {
                          if (isPlaying) return;
                          setTimelineIndex(timelineIndex === idx ? -1 : idx);
                          setQuarterSummary(timelineIndex === idx ? null : snap);
                        }}
                        title={snap.quarter}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  {graph.timeline.map((snap, idx) => {
                    const left = ((idx + 1) / (graph.timeline.length + 1)) * 100;
                    return (
                      <div
                        key={snap.id || idx}
                        style={{
                          position: 'absolute',
                          left: `${left}%`,
                          transform: 'translateX(-50%)',
                          top: 38,
                          fontFamily: 'var(--font-pizhu)',
                          fontSize: 10,
                          color: idx === timelineIndex ? 'var(--zhusha)' : 'var(--ink-light)',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {snap.quarter.replace(/年/, '.').replace('Q', '季')}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--xuan-white)',
            border: '1px solid rgba(139,105,20,0.2)',
            boxShadow: 'var(--shadow-deep)',
            zIndex: 1000,
            minWidth: 120,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.edge.type === 'manual' && (
            <button
              onClick={handleDeleteEdge}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                textAlign: 'left',
                fontFamily: 'var(--font-keishu)',
                fontSize: 13,
                color: 'var(--zhusha)',
                letterSpacing: '0.1em',
              }}
            >
              删去此线
            </button>
          )}
          <div
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-pizhu)',
              fontSize: 11,
              color: 'var(--ink-light)',
              borderTop: contextMenu.edge.type === 'manual' ? '1px solid rgba(139,105,20,0.1)' : 'none',
              letterSpacing: '0.05em',
            }}
          >
            {contextMenu.edge.type === 'manual' ? '朱砂手牵线' : `墨线 · 关联度 ${contextMenu.edge.weight}`}
          </div>
        </div>
      )}
    </div>
  );
}
