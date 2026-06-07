import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { KnowledgeGraph, KGNode, KGEdge, KGNodeCategory } from '@/types';
import { KG_CATEGORY_COLORS, KG_CATEGORY_LABELS } from '@/types';
import {
  runForceLayout,
  computeNodeRadius,
  getEdgeOpacity,
  getEdgeWidth,
  type PositionedNode,
} from '@/utils/forceLayout';
import dayjs from 'dayjs';

interface Props {
  data: KnowledgeGraph;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onEdgeContextMenu?: (edge: KGEdge, e: React.MouseEvent) => void;
  manualConnectMode: boolean;
  onManualConnect?: (sourceId: string, targetId: string) => void;
  visibleNodeIds?: Set<string>;
  highlightNodeIds?: Set<string>;
  hoveredNodeId?: string | null;
  onHoverNode?: (nodeId: string | null) => void;
  svgRef?: React.RefObject<SVGSVGElement>;
}

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 620;

const CATEGORY_LABEL_CHARS: Record<KGNodeCategory, string> = {
  person: '人',
  place: '地',
  era: '时',
  imagery: '象',
  theme: '题',
  work: '作',
};

export default function KnowledgeGraphCanvas({
  data,
  selectedNodeId,
  onSelectNode,
  onEdgeContextMenu,
  manualConnectMode,
  onManualConnect,
  visibleNodeIds,
  highlightNodeIds,
  hoveredNodeId,
  onHoverNode,
  svgRef: externalSvgRef,
}: Props) {
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const svgRef = externalSvgRef || internalSvgRef;
  const [draggingNode, setDraggingNode] = useState<PositionedNode | null>(null);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [positionCache, setPositionCache] = useState<Map<string, { x: number; y: number }>>(new Map());

  const layout = useMemo(() => {
    let nodes = data.nodes;
    if (visibleNodeIds) {
      nodes = nodes.filter((n) => visibleNodeIds.has(n.id));
    }
    let edges = data.edges;
    if (visibleNodeIds) {
      edges = edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
    }
    return runForceLayout(nodes, edges, CANVAS_WIDTH, CANVAS_HEIGHT, positionCache);
  }, [data, visibleNodeIds, positionCache]);

  const maxWeight = useMemo(() => {
    return Math.max(1, ...layout.edges.map((e) => e.weight));
  }, [layout.edges]);

  const isNodeHighlighted = useCallback(
    (nodeId: string) => {
      if (!highlightNodeIds) return true;
      return highlightNodeIds.has(nodeId);
    },
    [highlightNodeIds]
  );

  const handleNodeMouseDown = (e: React.MouseEvent, node: PositionedNode) => {
    if (manualConnectMode) {
      e.preventDefault();
      if (!connectSource) {
        setConnectSource(node.id);
      } else if (connectSource !== node.id) {
        onManualConnect?.(connectSource, node.id);
        setConnectSource(null);
      } else {
        setConnectSource(null);
      }
      return;
    }
    e.preventDefault();
    setDraggingNode(node);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
      setMousePos({ x, y });

      if (draggingNode) {
        const r = computeNodeRadius(draggingNode);
        const newX = Math.max(r, Math.min(CANVAS_WIDTH - r, x));
        const newY = Math.max(r, Math.min(CANVAS_HEIGHT - r, y));
        setPositionCache((prev) => {
          const next = new Map(prev);
          next.set(draggingNode.id, { x: newX, y: newY });
          return next;
        });
      }
    },
    [draggingNode, svgRef]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const connectSourceNode = connectSource ? layout.nodes.find((n) => n.id === connectSource) : null;

  return (
    <svg
      ref={svgRef as any}
      width="100%"
      height={CANVAS_HEIGHT}
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      style={{ display: 'block', background: 'radial-gradient(ellipse at center, #FAF6EA 0%, #F2EAD3 100%)' }}
      onMouseMove={handleMouseMove}
    >
      <defs>
        <radialGradient id="kg-ink-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(61,61,61,0.18)" />
          <stop offset="100%" stopColor="rgba(61,61,61,0)" />
        </radialGradient>
        {(['person', 'place', 'era', 'imagery', 'theme', 'work'] as KGNodeCategory[]).map((cat) => (
          <radialGradient key={cat} id={`kg-glow-${cat}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={KG_CATEGORY_COLORS[cat]} stopOpacity="0.4" />
            <stop offset="100%" stopColor={KG_CATEGORY_COLORS[cat]} stopOpacity="0" />
          </radialGradient>
        ))}
        <filter id="kg-ink-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
        <filter id="kg-soft-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="rgba(26,26,26,0.22)" />
        </filter>
        <pattern id="kg-paper-fiber" patternUnits="userSpaceOnUse" width="100" height="100">
          <rect width="100" height="100" fill="transparent" />
        </pattern>
      </defs>

      {data.clusters.map((cluster) => {
        const clusterNodes = layout.nodes.filter((n) => cluster.nodeIds.includes(n.id));
        if (clusterNodes.length < 3) return null;
        const xs = clusterNodes.map((n) => n.x);
        const ys = clusterNodes.map((n) => n.y);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        const rx = Math.max(...xs) - Math.min(...xs) + 80;
        const ry = Math.max(...ys) - Math.min(...ys) + 80;
        return (
          <g key={cluster.id} style={{ pointerEvents: 'none' }}>
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx / 2}
              ry={ry / 2}
              fill={cluster.color}
              fillOpacity={0.04}
              stroke={cluster.color}
              strokeOpacity={0.15}
              strokeWidth={1}
              strokeDasharray="4 6"
            />
            <text
              x={cx}
              y={cy - ry / 2 + 16}
              textAnchor="middle"
              fontFamily="var(--font-keishu)"
              fontSize={12}
              fill={cluster.color}
              fillOpacity={0.5}
              letterSpacing="0.2em"
            >
              · {cluster.label} ·
            </text>
          </g>
        );
      })}

      {layout.edges.map((edge) => {
        const isActive =
          selectedNodeId === edge.source.id ||
          selectedNodeId === edge.target.id ||
          hoveredNodeId === edge.source.id ||
          hoveredNodeId === edge.target.id;
        const opacity = edge.type === 'manual' ? 0.85 : getEdgeOpacity(edge.weight, maxWeight);
        const width = edge.type === 'manual' ? 2.5 : getEdgeWidth(edge.weight, maxWeight);
        const color = edge.type === 'manual' ? '#C84032' : '#1A1A1A';
        const isHighlighted = isNodeHighlighted(edge.source.id) && isNodeHighlighted(edge.target.id);
        return (
          <g key={edge.id}>
            <line
              x1={edge.source.x}
              y1={edge.source.y}
              x2={edge.target.x}
              y2={edge.target.y}
              stroke={color}
              strokeOpacity={isHighlighted ? (isActive ? opacity + 0.2 : opacity) : opacity * 0.25}
              strokeWidth={isActive ? width + 1 : width}
              strokeLinecap="round"
              filter={edge.type === 'manual' ? undefined : 'url(#kg-ink-blur)'}
              onContextMenu={(e) => {
                e.preventDefault();
                onEdgeContextMenu?.(
                  {
                    id: edge.id,
                    source: edge.source.id,
                    target: edge.target.id,
                    weight: edge.weight,
                    type: edge.type,
                    noteIds: [],
                    createdAt: '',
                  },
                  e
                );
              }}
              style={{ cursor: edge.type === 'manual' ? 'pointer' : 'default' }}
            />
            {edge.type === 'manual' && (
              <>
                <circle cx={edge.source.x} cy={edge.source.y} r={5} fill="#C84032" />
                <circle cx={edge.target.x} cy={edge.target.y} r={5} fill="#C84032" />
              </>
            )}
          </g>
        );
      })}

      {connectSourceNode && mousePos && (
        <line
          x1={connectSourceNode.x}
          y1={connectSourceNode.y}
          x2={mousePos.x}
          y2={mousePos.y}
          stroke="#C84032"
          strokeOpacity={0.6}
          strokeWidth={2}
          strokeDasharray="6 4"
          strokeLinecap="round"
        />
      )}

      {layout.nodes.map((node) => {
        const r = computeNodeRadius(node);
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeId === node.id;
        const isConnectSource = connectSource === node.id;
        const isDimmed = !isNodeHighlighted(node.id);
        const opacity = node.isHidden ? 0.25 : isDimmed && !isSelected && !isHovered ? 0.35 : 1;
        return (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            style={{ cursor: manualConnectMode ? 'crosshair' : 'pointer', opacity }}
            onMouseEnter={() => onHoverNode?.(node.id)}
            onMouseLeave={() => onHoverNode?.(null)}
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
            onClick={(e) => {
              if (!manualConnectMode && !draggingNode) {
                e.stopPropagation();
                onSelectNode(isSelected ? null : node.id);
              }
            }}
          >
            <circle r={r + 20} fill={`url(#kg-glow-${node.category})`} opacity={isSelected || isHovered ? 1 : 0.55} />

            {node.isHidden && (
              <line
                x1={-r * 0.9}
                y1={-r * 0.9}
                x2={r * 0.9}
                y2={r * 0.9}
                stroke="#7A7A7A"
                strokeWidth={2}
                strokeOpacity={0.7}
              />
            )}

            <circle
              r={r}
              fill={isConnectSource ? '#FFE4E1' : 'var(--xuan-white)'}
              stroke={isConnectSource ? '#C84032' : KG_CATEGORY_COLORS[node.category]}
              strokeWidth={isSelected || isConnectSource ? 3 : 1.8}
              filter="url(#kg-soft-shadow)"
            />
            <circle r={r - 5} fill="none" stroke={KG_CATEGORY_COLORS[node.category]} strokeWidth={1} strokeDasharray="2 3" opacity={0.35} />

            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-keishu)"
              fontSize={Math.max(10, Math.min(16, r * 0.4))}
              fill={node.isHidden ? '#7A7A7A' : 'var(--ink-strong)'}
              letterSpacing="0.04em"
            >
              {truncateNodeName(node.name, Math.max(2, Math.floor(r / 12)))}
            </text>

            <g transform={`translate(${r - 3}, ${-r + 3})`}>
              <circle r={9} fill={KG_CATEGORY_COLORS[node.category]} />
              <text textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-keishu)" fontSize={10} fill="var(--xuan-white)">
                {CATEGORY_LABEL_CHARS[node.category]}
              </text>
            </g>

            {node.annotations && node.annotations.length > 0 && (
              <g transform={`translate(${-r + 3}, ${-r + 3})`}>
                <circle r={7} fill="#8B6914" />
                <text textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-keishu)" fontSize={9} fill="var(--xuan-white)">
                  批
                </text>
              </g>
            )}

            {isSelected && (
              <circle r={r + 8} fill="none" stroke="#C84032" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7}>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        );
      })}

      {layout.nodes.length === 0 && (
        <text x={CANVAS_WIDTH / 2} y={CANVAS_HEIGHT / 2} textAnchor="middle" fontFamily="var(--font-keishu)" fontSize={18} fill="var(--ink-light)">
          笔记尚少，图谱未成，多读多记方有痕迹
        </text>
      )}
    </svg>
  );
}

function truncateNodeName(name: string, maxChars: number) {
  if (!name) return '';
  if (name.length <= maxChars) return name;
  if (/[a-zA-Z]/.test(name)) {
    return name.slice(0, maxChars * 2);
  }
  return name.slice(0, maxChars);
}
