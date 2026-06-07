import type { KGNode, KGEdge } from '@/types';

export interface PositionedNode extends KGNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PositionedEdge {
  id: string;
  source: PositionedNode;
  target: PositionedNode;
  weight: number;
  type: 'cooccurrence' | 'manual';
}

export interface LayoutResult {
  width: number;
  height: number;
  nodes: PositionedNode[];
  edges: PositionedEdge[];
}

const REPULSION = 1800;
const ATTRACTION = 0.008;
const DAMPING = 0.85;
const CENTER_GRAVITY = 0.015;
const ITERATIONS = 300;

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function runForceLayout(
  nodes: KGNode[],
  edges: KGEdge[],
  width: number,
  height: number,
  existingPositions?: Map<string, { x: number; y: number }>
): LayoutResult {
  const centerX = width / 2;
  const centerY = height / 2;

  const positioned: PositionedNode[] = nodes.map((n, i) => {
    const existing = existingPositions?.get(n.id);
    const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2;
    const radius = Math.min(width, height) * 0.25;
    return {
      ...n,
      x: existing?.x ?? centerX + Math.cos(angle) * radius,
      y: existing?.y ?? centerY + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    };
  });

  const nodeMap = new Map(positioned.map((n) => [n.id, n]));

  const posEdges: PositionedEdge[] = edges
    .map((e) => {
      const s = nodeMap.get(e.source);
      const t = nodeMap.get(e.target);
      if (!s || !t) return null;
      return {
        id: e.id,
        source: s,
        target: t,
        weight: e.weight,
        type: e.type,
      };
    })
    .filter(Boolean) as PositionedEdge[];

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const a = positioned[i];
        const b = positioned[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) dist = 1;

        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    for (const edge of posEdges) {
      const s = edge.source;
      const t = edge.target;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) continue;

      const idealDist = 100 + (1 / (edge.weight + 0.5)) * 60;
      const displacement = dist - idealDist;
      const force = displacement * ATTRACTION * (edge.weight * 0.5 + 1);

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      s.vx += fx;
      s.vy += fy;
      t.vx -= fx;
      t.vy -= fy;
    }

    for (const node of positioned) {
      node.vx += (centerX - node.x) * CENTER_GRAVITY;
      node.vy += (centerY - node.y) * CENTER_GRAVITY;
    }

    const temperature = 1 - iter / ITERATIONS;
    const maxVelocity = 20 * temperature + 2;

    for (const node of positioned) {
      node.vx *= DAMPING;
      node.vy *= DAMPING;

      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > maxVelocity) {
        node.vx = (node.vx / speed) * maxVelocity;
        node.vy = (node.vy / speed) * maxVelocity;
      }

      node.x += node.vx;
      node.y += node.vy;

      const r = computeNodeRadius(node);
      const padding = r + 20;
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }

  return { width, height, nodes: positioned, edges: posEdges };
}

export function computeNodeRadius(node: KGNode): number {
  const base = 14;
  const scale = Math.min(26, Math.sqrt(node.frequency) * 5);
  return base + scale;
}

export function getEdgeOpacity(weight: number, maxWeight: number): number {
  if (maxWeight <= 0) return 0.15;
  const ratio = weight / maxWeight;
  return 0.12 + ratio * 0.55;
}

export function getEdgeWidth(weight: number, maxWeight: number): number {
  if (maxWeight <= 0) return 1;
  const ratio = weight / maxWeight;
  return 1 + ratio * 3.5;
}
