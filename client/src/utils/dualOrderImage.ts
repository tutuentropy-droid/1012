import type { Work } from '@/types';
import { formatDate } from './date';

interface ExportParams {
  works: Work[];
  heartOrder: string[];
  username: string;
  sealText?: string;
}

const XUAN_WHITE = '#F5EFE0';
const INK_STRONG = '#1A1A1A';
const INK_MEDIUM = '#4A4A4A';
const INK_LIGHT = '#7A7A7A';
const ZHUSHA = '#C84032';
const DAISHI = '#8B6914';
const RIVER_START = '#D6E4FF';
const RIVER_END = '#7EA1C4';

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPaperTexture(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  const originalAlpha = ctx.globalAlpha;
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 80; i++) {
    const px = x + Math.random() * w;
    const py = y + Math.random() * h;
    const pr = 0.5 + Math.random() * 1.5;
    ctx.fillStyle = Math.random() > 0.5 ? INK_MEDIUM : DAISHI;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = originalAlpha;
  ctx.restore();
}

function drawVerticalText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  lineGap: number = 4
) {
  ctx.save();
  ctx.font = `${fontSize}px "STFangsong", "FangSong", "华文仿宋", serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const chars = text.split('');
  let currentY = y;
  chars.forEach((ch) => {
    ctx.fillText(ch, x, currentY);
    const metrics = ctx.measureText(ch);
    currentY += metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + lineGap;
  });
  ctx.restore();
}

function drawSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  text: string,
  rotation: number = -3
) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-size / 2, -size / 2);

  ctx.fillStyle = ZHUSHA;
  ctx.globalAlpha = 0.88;
  drawRoundRect(ctx, 0, 0, size, size, 4);
  ctx.fill();

  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = XUAN_WHITE;
  ctx.lineWidth = 2;
  drawRoundRect(ctx, 3, 3, size - 6, size - 6, 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = XUAN_WHITE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (text.length <= 2) {
    ctx.font = `bold ${Math.floor(size * 0.42)}px "STFangsong", "FangSong", serif`;
    text.split('').forEach((ch, i) => {
      const ty = size * (0.3 + i * 0.4);
      ctx.fillText(ch, size / 2, ty);
    });
  } else {
    ctx.font = `bold ${Math.floor(size * 0.28)}px "STFangsong", "FangSong", serif`;
    const chars = text.slice(0, 4).split('');
    const positions: [number, number][] = [
      [0.3, 0.3], [0.7, 0.3],
      [0.3, 0.7], [0.7, 0.7],
    ];
    chars.forEach((ch: string, i: number) => {
      if (positions[i]) {
        ctx.fillText(ch, size * positions[i][0], size * positions[i][1]);
      }
    });
  }

  ctx.restore();
}

function drawBoat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  title: string,
  moodColor?: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  const s = size;
  ctx.beginPath();
  ctx.moveTo(-s * 0.8, s * 0.08);
  ctx.quadraticCurveTo(0, s * 0.55, s * 0.8, s * 0.08);
  ctx.lineTo(s * 0.62, -s * 0.18);
  ctx.quadraticCurveTo(0, -s * 0.08, -s * 0.62, -s * 0.18);
  ctx.closePath();

  const boatGrad = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.5);
  boatGrad.addColorStop(0, '#8B6914');
  boatGrad.addColorStop(0.5, '#6B4F10');
  boatGrad.addColorStop(1, '#4A3708');
  ctx.fillStyle = boatGrad;
  ctx.fill();

  ctx.fillStyle = '#A07C1A';
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(-s * 0.65, s * 0.02);
  ctx.quadraticCurveTo(0, s * 0.25, s * 0.65, s * 0.02);
  ctx.lineTo(s * 0.52, -s * 0.08);
  ctx.quadraticCurveTo(0, -s * 0.02, -s * 0.52, -s * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#5A4010';
  ctx.lineWidth = Math.max(1, s * 0.04);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.1);
  ctx.lineTo(0, -s * 0.7);
  ctx.stroke();

  ctx.fillStyle = XUAN_WHITE;
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = Math.max(0.5, s * 0.02);
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(s * 0.04, -s * 0.7);
  ctx.lineTo(s * 0.5, -s * 0.38);
  ctx.lineTo(s * 0.04, -s * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (moodColor) {
    ctx.fillStyle = moodColor;
    ctx.beginPath();
    ctx.arc(0, s * 0.18, Math.max(2, s * 0.08), 0, Math.PI * 2);
    ctx.fill();
  }

  if (title) {
    ctx.fillStyle = INK_MEDIUM;
    ctx.font = `${Math.max(8, s * 0.25)}px "STFangsong", "FangSong", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const displayTitle = title.length > 5 ? title.slice(0, 5) + '…' : title;
    ctx.fillText(displayTitle, 0, s * 0.4);
  }

  ctx.restore();
}

function drawBook(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  typeLabel: string,
  rating: number,
  moodColor?: string
) {
  ctx.save();

  const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
  if (moodColor) {
    const { r, g, b } = hexToRgb(moodColor);
    bgGrad.addColorStop(0, `rgba(${r},${g},${b},0.2)`);
    bgGrad.addColorStop(1, XUAN_WHITE);
  } else {
    bgGrad.addColorStop(0, XUAN_WHITE);
    bgGrad.addColorStop(1, '#E8DDC7');
  }
  ctx.fillStyle = bgGrad;
  ctx.strokeStyle = rgba(DAISHI, 0.25);
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);

  if (moodColor) {
    ctx.fillStyle = moodColor;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x + 3, y, w - 6, 3);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = INK_STRONG;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.max(11, Math.floor(w * 0.18))}px "STFangsong", "FangSong", serif`;

  const displayTitle = title.slice(0, 6);
  const charSize = Math.floor(h / (displayTitle.length + 2));
  const startY = y + h * 0.15;
  displayTitle.split('').forEach((ch, i) => {
    ctx.fillText(ch, x + w / 2, startY + i * charSize);
  });

  ctx.fillStyle = INK_LIGHT;
  ctx.font = `${Math.max(8, Math.floor(w * 0.12))}px "STFangsong", "FangSong", serif`;
  ctx.fillText(typeLabel, x + w / 2, y + h - 18);

  if (rating > 0) {
    const sealSize = Math.min(22, w * 0.38);
    const sx = x + (w - sealSize) / 2;
    const sy = y + h - sealSize - 4;
    ctx.save();
    ctx.translate(sx + sealSize / 2, sy + sealSize / 2);
    ctx.rotate(((rating % 3 - 1) * 2 * Math.PI) / 180);
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = ZHUSHA;
    drawRoundRect(ctx, -sealSize / 2, -sealSize / 2, sealSize, sealSize, 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = XUAN_WHITE;
    ctx.font = `bold ${Math.floor(sealSize * 0.4)}px "STFangsong", "FangSong", serif`;
    const ratingTexts = ['', '下', '次', '中', '上', '上'];
    const sealTxt = ratingTexts[rating] || '';
    ctx.fillText(sealTxt, 0, 1);
    ctx.restore();
  }

  ctx.restore();
}

export async function generateDualOrderImage({
  works,
  heartOrder,
  username,
  sealText = '痕迹',
}: ExportParams): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布');

  const W = 1600;
  const H = 900;
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = XUAN_WHITE;
  ctx.fillRect(0, 0, W, H);
  drawPaperTexture(ctx, 0, 0, W, H);

  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, rgba(DAISHI, 0.25));
  borderGrad.addColorStop(0.5, rgba(DAISHI, 0.1));
  borderGrad.addColorStop(1, rgba(DAISHI, 0.25));
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  ctx.strokeStyle = rgba(DAISHI, 0.3);
  ctx.lineWidth = 1;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  const midX = W / 2;
  ctx.strokeStyle = rgba(INK_LIGHT, 0.25);
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(midX, 80);
  ctx.lineTo(midX, H - 100);
  ctx.stroke();
  ctx.setLineDash([]);

  drawVerticalText(ctx, '时', 110, 80, 36, INK_STRONG, 8);
  drawVerticalText(ctx, '序', 110, 140, 36, INK_STRONG, 8);
  drawVerticalText(ctx, '岁 月 长 河', 155, 95, 16, INK_LIGHT, 14);

  drawVerticalText(ctx, '心', W - 110, 80, 36, INK_STRONG, 8);
  drawVerticalText(ctx, '序', W - 110, 140, 36, INK_STRONG, 8);
  drawVerticalText(ctx, '心 中 谱 系', W - 155, 95, 16, INK_LIGHT, 14);

  const timeSorted = [...works].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const riverArea = {
    x: 200,
    y: 260,
    w: midX - 260,
    h: 480,
  };

  const riverY = riverArea.y + riverArea.h / 2;
  ctx.save();
  const riverGrad = ctx.createLinearGradient(riverArea.x, 0, riverArea.x + riverArea.w, 0);
  riverGrad.addColorStop(0, rgba(RIVER_START, 0.2));
  riverGrad.addColorStop(0.3, rgba('#B8CCE8', 0.3));
  riverGrad.addColorStop(0.6, rgba('#9BB5D6', 0.4));
  riverGrad.addColorStop(1, rgba(RIVER_END, 0.55));
  ctx.fillStyle = riverGrad;
  ctx.beginPath();
  ctx.moveTo(riverArea.x, riverY);
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = riverArea.x + t * riverArea.w;
    const wave = Math.sin(t * Math.PI * 2.5) * 18;
    ctx.lineTo(x, riverY - 35 + wave);
  }
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const x = riverArea.x + t * riverArea.w;
    const wave = Math.sin(t * Math.PI * 2.3 + 0.5) * 14;
    ctx.lineTo(x, riverY + 40 + wave);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const minTime = timeSorted.length > 0 ? new Date(timeSorted[0].createdAt).getTime() : 0;
  const maxTime = timeSorted.length > 0 ? new Date(timeSorted[timeSorted.length - 1].createdAt).getTime() : 1;
  const timeRange = Math.max(maxTime - minTime, 1);

  timeSorted.forEach((work, i) => {
    const t = (new Date(work.createdAt).getTime() - minTime) / timeRange;
    const bx = riverArea.x + 30 + t * (riverArea.w - 60);
    const rowOffset = (i % 3 - 1) * 60;
    const by = riverY + rowOffset + Math.sin(i * 1.7) * 10;
    const densityFactor = 0.5 + t * 0.5;
    const bSize = 22 + densityFactor * 18;
    ctx.globalAlpha = 0.5 + densityFactor * 0.5;
    drawBoat(ctx, bx, by, bSize, work.title, work.moodColor);
    ctx.globalAlpha = 1;
  });

  if (timeSorted.length > 0) {
    ctx.fillStyle = rgba(INK_LIGHT, 0.7);
    ctx.font = '13px "STFangsong", "FangSong", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(formatDate(timeSorted[0].createdAt, 'YYYY年MM月'), riverArea.x, riverArea.y + riverArea.h + 30);
    ctx.textAlign = 'right';
    ctx.fillText(formatDate(timeSorted[timeSorted.length - 1].createdAt, 'YYYY年MM月'), riverArea.x + riverArea.w, riverArea.y + riverArea.h + 30);
  }

  const workMap = new Map(works.map((w) => [w._id, w]));
  const heartSorted = heartOrder
    .map((id) => workMap.get(id))
    .filter(Boolean) as Work[];
  const remaining = works.filter((w) => !heartOrder.includes(w._id));
  const fullHeartSorted = [...heartSorted, ...remaining];

  const shelfArea = {
    x: midX + 80,
    y: 230,
    w: W - midX - 160,
    h: 520,
  };

  const cols = 6;
  const bookW = 70;
  const bookGap = 16;
  const rowH = 170;
  const totalColW = cols * bookW + (cols - 1) * bookGap;
  const startX = shelfArea.x + (shelfArea.w - totalColW) / 2;

  fullHeartSorted.forEach((work, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    if (row * rowH > shelfArea.h) return;

    const bx = startX + col * (bookW + bookGap);
    const by = shelfArea.y + row * rowH;
    const heightVar = (work.rating || 0) * 8;
    const bh = 130 + heightVar;

    drawBook(
      ctx,
      bx,
      by,
      bookW,
      bh,
      work.title,
      ({ tv: '剧集', book: '书籍', movie: '电影', other: '其他' } as Record<string, string>)[work.type] || '',
      work.rating,
      work.moodColor
    );

    if (col === cols - 1 || i === fullHeartSorted.length - 1) {
      const shelfY = by + 150;
      ctx.fillStyle = '#6B4F10';
      ctx.fillRect(startX - 10, shelfY, totalColW + 20, 6);
      ctx.fillStyle = '#4A3708';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(startX - 6, shelfY + 6, totalColW + 12, 3);
      ctx.globalAlpha = 1;
    }
  });

  ctx.save();
  ctx.translate(W - 220, H - 160);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.fillStyle = INK_MEDIUM;
  ctx.font = '14px "STKaiti", "KaiTi", serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  const now = formatDate(new Date().toISOString(), 'YYYY年MM月DD日');
  ctx.fillText(`${username || '墨客'} 识于 ${now}`, 0, 0);
  ctx.restore();

  drawSeal(ctx, W - 140, H - 140, 60, sealText || username?.slice(0, 2) || '痕迹', -4);

  drawSeal(ctx, 180, H - 150, 44, '双序', 3);

  return canvas.toDataURL('image/png');
}

export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
