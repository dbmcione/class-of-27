import logoUrl from '../assets/logo.png';
import type { RoundScore } from './scores';

export type ScorecardInput = RoundScore & {
  collegeName: string;
  playerName: string;
  timeLabel: string;
};

/** "22 September 2026" — the day the round was played. */
function playedOn(): string {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const W = 1000;
const H = 1250;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Wraps to `maxWidth`, returning the lines. Assumes the font is already set. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const next = line === '' ? word : `${line} ${word}`;
    if (ctx.measureText(next).width > maxWidth && line !== '') {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // A missing logo must not fail the card.
    img.src = src;
  });
}

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0b1233');
  sky.addColorStop(0.5, '#070b21');
  sky.addColorStop(1, '#04051a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Aurora ribbons, drawn as soft radial blobs.
  const blobs: [number, number, number, string][] = [
    [180, 200, 420, 'rgba(70, 230, 179, 0.22)'],
    [560, 120, 460, 'rgba(79, 209, 255, 0.18)'],
    [860, 340, 420, 'rgba(155, 123, 255, 0.20)'],
    [320, 520, 500, 'rgba(70, 230, 179, 0.10)'],
    [780, 700, 460, 'rgba(155, 123, 255, 0.10)'],
  ];
  for (const [x, y, r, colour] of blobs) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, colour);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  // Stars. Fixed positions so the card is identical every time it is made.
  let seed = 7;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let i = 0; i < 90; i++) {
    const x = random() * W;
    const y = random() * H;
    const r = random() * 1.8 + 0.5;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + random() * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Renders the shareable scorecard. Returns the PNG blob and a preview URL. */
export async function generateScorecard(
  input: ScorecardInput,
): Promise<{ blob: Blob; dataUrl: string } | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  drawBackground(ctx);

  const logo = await loadImage(logoUrl);
  if (logo) {
    const logoW = 210;
    const logoH = (logo.height / logo.width) * logoW;
    ctx.drawImage(logo, 70, 70, logoW, logoH);
  }

  ctx.textAlign = 'center';

  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = 'rgba(159, 176, 217, 0.95)';
  ctx.letterSpacing = '3px';
  ctx.fillText("CLASS OF '27 CAMPUS CHALLENGE", W / 2, 300);
  ctx.letterSpacing = '0px';

  // --- Score, with room to breathe before the time line.
  const scoreText = `${input.solved}/${input.total}`;
  ctx.font = `800 210px ${FONT}`;
  const scoreGrad = ctx.createLinearGradient(W / 2 - 220, 0, W / 2 + 220, 0);
  scoreGrad.addColorStop(0, '#46e6b3');
  scoreGrad.addColorStop(0.5, '#4fd1ff');
  scoreGrad.addColorStop(1, '#9b7bff');
  ctx.fillStyle = scoreGrad;
  ctx.fillText(scoreText, W / 2, 530);

  ctx.font = `600 30px ${FONT}`;
  ctx.fillStyle = 'rgba(159, 176, 217, 0.9)';
  ctx.fillText(`solved in ${input.timeLabel}`, W / 2, 625);

  // --- Name panel, sized to its own content so the text sits centred
  // whether the college name runs to one line or two.
  const panelX = 60;
  const panelW = W - panelX * 2;
  const panelPadY = 52;
  const nameLine = 62;
  const collegeLine = 40;
  const nameToCollege = 12;

  ctx.font = `500 29px ${FONT}`;
  const collegeLines = wrap(ctx, input.collegeName, panelW - 110).slice(0, 2);

  const panelH =
    panelPadY * 2 + nameLine + nameToCollege + collegeLines.length * collegeLine;
  const panelY = 700;

  const panelFill = ctx.createLinearGradient(0, panelY, 0, panelY + panelH);
  panelFill.addColorStop(0, 'rgba(255, 255, 255, 0.085)');
  panelFill.addColorStop(1, 'rgba(255, 255, 255, 0.035)');
  ctx.fillStyle = panelFill;
  roundedRect(ctx, panelX, panelY, panelW, panelH, 32);
  ctx.fill();

  const panelEdge = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
  panelEdge.addColorStop(0, 'rgba(70, 230, 179, 0.45)');
  panelEdge.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
  panelEdge.addColorStop(1, 'rgba(155, 123, 255, 0.45)');
  ctx.strokeStyle = panelEdge;
  ctx.lineWidth = 2;
  roundedRect(ctx, panelX, panelY, panelW, panelH, 32);
  ctx.stroke();

  // Middle baseline makes the vertical centring exact rather than eyeballed.
  ctx.textBaseline = 'middle';

  ctx.font = `700 50px ${FONT}`;
  ctx.fillStyle = '#f3f6ff';
  ctx.fillText(input.playerName, W / 2, panelY + panelPadY + nameLine / 2);

  ctx.font = `500 29px ${FONT}`;
  ctx.fillStyle = 'rgba(176, 191, 228, 0.95)';
  collegeLines.forEach((line, i) => {
    ctx.fillText(
      line,
      W / 2,
      panelY + panelPadY + nameLine + nameToCollege + collegeLine * i + collegeLine / 2,
    );
  });

  ctx.textBaseline = 'alphabetic';

  // --- Footer, spaced off the panel rather than fixed to the canvas.
  const panelBottom = panelY + panelH;

  ctx.font = `700 40px ${FONT}`;
  ctx.fillStyle = '#f3f6ff';
  ctx.fillText('Think you can beat it?', W / 2, panelBottom + 116);

  ctx.font = `500 26px ${FONT}`;
  ctx.fillStyle = 'rgba(159, 176, 217, 0.7)';
  ctx.fillText(playedOn(), W / 2, panelBottom + 202);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) return null;

  return { blob, dataUrl: canvas.toDataURL('image/png') };
}
