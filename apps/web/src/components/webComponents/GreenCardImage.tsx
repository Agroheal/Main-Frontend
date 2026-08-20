import { useRef, useState, type ReactNode } from "react";

/**
 * A self-contained, data-driven digital membership card, rendered as a
 * single SVG so it stays crisp at any display size and is trivial to
 * export as a PNG. Requires no npm dependencies beyond React — QR
 * encoding is optional/pluggable via the `qrRenderer` prop (see the
 * comment near `renderFallbackQr` below for how to wire in a real
 * encoder such as `react-qr-code` or `qrcode.react`).
 */

const CARD_WIDTH = 1260;
const CARD_HEIGHT = 794;
const CORNER_RADIUS = 28;
const MARGIN = 64;

const COLORS = {
  bgStart: "#0a2210",
  bgMid: "#12321a",
  bgEnd: "#173e20",
  border: "rgba(255,255,255,0.15)",
  accent: "#b8e034",
  offWhite: "#e7f0df",
  mutedGreenWhite: "#cfe2c2",
  leafMedium1: "#3f7a2c",
  leafMedium2: "#4f9337",
  badgeGreen: "#4b7f2e",
  white: "#ffffff",
};

const SANS = "Arial, Helvetica, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "'Courier New', Courier, monospace";

// ─── Seeded, deterministic randomness (no Math.random — same input always
// produces the same visual pattern) ─────────────────────────────────────

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Generic leaf silhouette, reused for the decorative top-right leaves
// and the seeded fallback pattern in the photo band ─────────────────────

const leafPathD = (size: number) => {
  const s = size;
  return `M ${s * 0.5} 0 C ${s * 0.95} ${s * 0.15} ${s} ${s * 0.55} ${s * 0.5} ${s} C ${s * 0.05} ${s * 0.55} 0 ${s * 0.15} ${s * 0.5} 0 Z`;
};

const Leaf = ({
  size,
  color,
  x,
  y,
  rotation = 0,
  opacity = 1,
  vein = true,
}: {
  size: number;
  color: string;
  x: number;
  y: number;
  rotation?: number;
  opacity?: number;
  vein?: boolean;
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotation})`} opacity={opacity}>
    <path d={leafPathD(size)} fill={color} />
    {vein && (
      <line
        x1={size * 0.5}
        y1={size * 0.1}
        x2={size * 0.5}
        y2={size * 0.9}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={Math.max(1, size * 0.015)}
      />
    )}
  </g>
);

// ─── Fallback QR-style module grid — a visual approximation only, NOT a
// scannable code. It seeds a 21x21 grid from `value` so the same member
// always gets the same pattern, and stamps the three standard QR
// "finder" squares in the corners so it reads as QR-like at a glance.
//
// To make it actually scannable, pass a real encoder via `qrRenderer`,
// e.g. with `react-qr-code`:
//   <GreenCardImage qrRenderer={(value, size) => (
//     <QRCode value={value} size={size} bgColor="#fff" fgColor="#111" />
//   )} />
// qrRenderer must return SVG-compatible markup (like react-qr-code does)
// rather than arbitrary HTML, so the card can still be reliably
// serialized and rasterized to a PNG.
const FINDER_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

function generateFallbackQrModules(value: string, gridSize = 21): boolean[][] {
  const rand = mulberry32(hashString(value || "green-card"));
  const grid: boolean[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => rand() < 0.42),
  );

  const stampFinder = (originRow: number, originCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const row = originRow + r;
        const col = originCol + c;
        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
          grid[row][col] = FINDER_PATTERN[r][c] === 1;
        }
      }
    }
  };

  stampFinder(0, 0);
  stampFinder(0, gridSize - 7);
  stampFinder(gridSize - 7, 0);

  return grid;
}

const renderFallbackQr = (value: string, boxSize: number) => {
  const gridSize = 21;
  const modules = generateFallbackQrModules(value, gridSize);
  const cell = boxSize / gridSize;
  return (
    <g>
      {modules.map((row, ry) =>
        row.map((filled, rx) =>
          filled ? (
            <rect
              key={`${rx}-${ry}`}
              x={rx * cell}
              y={ry * cell}
              width={cell}
              height={cell}
              fill="#111111"
            />
          ) : null,
        ),
      )}
    </g>
  );
};

// ─── Seeded fallback pattern for the photo band, used only when no
// `photoUrl` is supplied ─────────────────────────────────────────────────

const SCATTER_COLORS = ["#123a1a", "#1b4b23", "#0f2e15", "#204f28", "#153a1c"];

function renderPhotoFallback(seed: string, bandY: number, bandHeight: number) {
  const rand = mulberry32(hashString(seed || "green-card"));
  const shapes = Array.from({ length: 16 }, (_, i) => {
    const size = 90 + rand() * 160;
    return (
      <Leaf
        key={i}
        size={size}
        color={SCATTER_COLORS[Math.floor(rand() * SCATTER_COLORS.length)]}
        x={rand() * CARD_WIDTH - size / 2}
        y={bandY + rand() * bandHeight - size / 2}
        rotation={rand() * 360}
        opacity={0.55 + rand() * 0.3}
        vein={false}
      />
    );
  });
  return (
    <>
      <rect x={0} y={bandY} width={CARD_WIDTH} height={bandHeight} fill="#0d2812" />
      {shapes}
    </>
  );
}

// ─── Small hand-drawn icon glyphs (no icon library dependency) ─────────

const IdCardIcon = ({ size }: { size: number }) => (
  <g transform={`translate(${-size / 2} ${-size / 2})`}>
    <rect
      x={size * 0.1}
      y={size * 0.2}
      width={size * 0.8}
      height={size * 0.6}
      rx={size * 0.1}
      fill="none"
      stroke="#ffffff"
      strokeWidth={size * 0.07}
    />
    <circle cx={size * 0.32} cy={size * 0.5} r={size * 0.1} fill="#ffffff" />
    <line
      x1={size * 0.52}
      y1={size * 0.42}
      x2={size * 0.78}
      y2={size * 0.42}
      stroke="#ffffff"
      strokeWidth={size * 0.06}
    />
    <line
      x1={size * 0.52}
      y1={size * 0.58}
      x2={size * 0.72}
      y2={size * 0.58}
      stroke="#ffffff"
      strokeWidth={size * 0.06}
    />
  </g>
);

const CalendarIcon = ({ size }: { size: number }) => (
  <g transform={`translate(${-size / 2} ${-size / 2})`}>
    <rect
      x={size * 0.12}
      y={size * 0.22}
      width={size * 0.76}
      height={size * 0.66}
      rx={size * 0.08}
      fill="none"
      stroke="#ffffff"
      strokeWidth={size * 0.07}
    />
    <line
      x1={size * 0.12}
      y1={size * 0.42}
      x2={size * 0.88}
      y2={size * 0.42}
      stroke="#ffffff"
      strokeWidth={size * 0.06}
    />
    <line x1={size * 0.3} y1={size * 0.14} x2={size * 0.3} y2={size * 0.3} stroke="#ffffff" strokeWidth={size * 0.07} />
    <line x1={size * 0.7} y1={size * 0.14} x2={size * 0.7} y2={size * 0.3} stroke="#ffffff" strokeWidth={size * 0.07} />
  </g>
);

const CommunityIcon = ({ size }: { size: number }) => (
  <g transform={`translate(${-size / 2} ${-size / 2})`}>
    <circle cx={size * 0.36} cy={size * 0.38} r={size * 0.16} fill="#ffffff" />
    <circle cx={size * 0.64} cy={size * 0.38} r={size * 0.16} fill="#ffffff" />
    <path
      d={`M ${size * 0.12} ${size * 0.85} C ${size * 0.12} ${size * 0.6} ${size * 0.6} ${size * 0.6} ${size * 0.6} ${size * 0.85} Z`}
      fill="#ffffff"
    />
    <path
      d={`M ${size * 0.4} ${size * 0.85} C ${size * 0.4} ${size * 0.6} ${size * 0.88} ${size * 0.6} ${size * 0.88} ${size * 0.85} Z`}
      fill="#ffffff"
    />
  </g>
);

const LeafGlyph = ({ size }: { size: number }) => (
  <g transform={`translate(${-size / 2} ${-size / 2})`}>
    <path
      d={`M ${size * 0.2} ${size * 0.85} C ${size * 0.1} ${size * 0.4} ${size * 0.35} ${size * 0.1} ${size * 0.85} ${size * 0.15} C ${size * 0.8} ${size * 0.6} ${size * 0.55} ${size * 0.85} ${size * 0.2} ${size * 0.85} Z`}
      fill="none"
      stroke="#ffffff"
      strokeWidth={size * 0.06}
      strokeLinejoin="round"
    />
    <path
      d={`M ${size * 0.25} ${size * 0.78} L ${size * 0.72} ${size * 0.24}`}
      stroke="#ffffff"
      strokeWidth={size * 0.045}
      strokeLinecap="round"
    />
  </g>
);

// ─── Component ───────────────────────────────────────────────────────────

export interface GreenCardImageProps {
  orgName?: string;
  cardLabel?: string;
  tagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  memberName?: string;
  memberId?: string;
  memberSince?: string;
  footerText?: string;
  qrValue?: string;
  photoUrl?: string;
  fileName?: string;
  /** Optional pluggable real QR encoder — see the comment above `renderFallbackQr`. */
  qrRenderer?: (value: string, size: number) => ReactNode;
}

const GreenCardImage = ({
  orgName = "AgroHEAL",
  cardLabel = "GREEN CARD",
  tagline = "Grow Healthy Food, Restore Health, Create Wealth.",
  heroTitle = "GREEN CARD",
  heroSubtitle = "Seed of Hope, Future of Communities.",
  memberName,
  memberId = "AGC-000001-2026",
  memberSince = "AUGUST 2026",
  footerText = "TOGETHER, WE GROW HOPE\nAND BUILD THRIVING COMMUNITIES.",
  qrValue,
  photoUrl,
  fileName,
  qrRenderer,
}: GreenCardImageProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [exportError, setExportError] = useState(false);

  const resolvedQrValue = qrValue || memberId;
  const footerLines = footerText.split("\n");

  const bandY = CARD_HEIGHT * 0.6;
  const bandHeight = CARD_HEIGHT - bandY;

  const qrBoxSize = 150;
  const qrBoxX = CARD_WIDTH - MARGIN - qrBoxSize;
  const qrBoxY = 300;
  const qrPadding = 12;
  const qrInnerSize = qrBoxSize - qrPadding * 2;

  const memberRowY = 428;
  const memberValueY = 468;
  const memberCol2X = MARGIN + 320;

  const handleDownload = async () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    setPreparing(true);
    setExportError(false);

    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgEl);
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error("Failed to load card image for export"));
        img.src = url;
      });

      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = CARD_WIDTH * scale;
      canvas.height = CARD_HEIGHT * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      // Note: if `photoUrl` is served without CORS headers, this canvas
      // becomes "tainted" and toBlob will fail — the try/catch below
      // handles that gracefully rather than crashing.
      canvas.toBlob((blob) => {
        if (!blob) {
          setExportError(true);
          return;
        }
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        const safeName = (fileName || memberId || "green-card").replace(
          /[^a-z0-9-_]+/gi,
          "-",
        );
        link.download = `${safeName}.png`;
        link.click();
        URL.revokeObjectURL(downloadUrl);
      }, "image/png");
    } catch (err) {
      console.error("Green Card export failed", err);
      setExportError(true);
    } finally {
      setPreparing(false);
    }
  };

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
        width="100%"
        height="auto"
        style={{ display: "block", fontFamily: SANS }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="cardBg"
            x1="0"
            y1="0"
            x2={CARD_WIDTH}
            y2={CARD_HEIGHT}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={COLORS.bgStart} />
            <stop offset="50%" stopColor={COLORS.bgMid} />
            <stop offset="100%" stopColor={COLORS.bgEnd} />
          </linearGradient>
          <linearGradient id="bandOverlay" x1="0" y1={bandY} x2="0" y2={CARD_HEIGHT} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(0,0,0,0.75)" />
            <stop offset="40%" stopColor="rgba(0,0,0,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.75)" />
          </linearGradient>
          <linearGradient id="seam" x1="0" y1="0" x2={CARD_WIDTH} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <clipPath id="cardClip">
            <rect
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              rx={CORNER_RADIUS}
            />
          </clipPath>
          <clipPath id="bandClip">
            <rect x={0} y={bandY} width={CARD_WIDTH} height={bandHeight} />
          </clipPath>
        </defs>

        {/* Background */}
        <rect
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          rx={CORNER_RADIUS}
          fill="url(#cardBg)"
          stroke={COLORS.border}
          strokeWidth={1}
        />

        <g clipPath="url(#cardClip)">
          {/* Decorative top-right leaves */}
          <Leaf
            size={280}
            color={COLORS.leafMedium1}
            x={880}
            y={-40}
            rotation={18}
            opacity={0.85}
          />
          <Leaf
            size={220}
            color={COLORS.leafMedium2}
            x={1020}
            y={30}
            rotation={-24}
            opacity={0.9}
          />

          {/* Logo lockup */}
          <g transform={`translate(${MARGIN + 34} 98)`}>
            <circle r={34} fill="none" stroke="#ffffff" strokeWidth={2} />
            <LeafGlyph size={38} />
          </g>
          <text
            x={MARGIN + 84}
            y={88}
            fontSize={34}
            fontWeight={800}
            fill={COLORS.white}
          >
            {orgName}
          </text>
          <text
            x={MARGIN + 84}
            y={120}
            fontSize={24}
            fontWeight={800}
            letterSpacing={2}
            fill={COLORS.accent}
          >
            {cardLabel}
          </text>
          <text x={MARGIN} y={168} fontSize={16} fill={COLORS.offWhite}>
            {tagline}
          </text>

          {/* Hero */}
          <text
            x={MARGIN}
            y={300}
            fontSize={100}
            fontWeight={900}
            fill={COLORS.white}
          >
            {heroTitle}
          </text>
          <text
            x={MARGIN}
            y={350}
            fontSize={34}
            fontWeight={700}
            fontStyle="italic"
            fontFamily={SERIF}
            fill={COLORS.white}
          >
            {heroSubtitle}
          </text>
          {memberName && (
            <text
              x={MARGIN}
              y={384}
              fontSize={20}
              fill={COLORS.mutedGreenWhite}
            >
              {memberName}
            </text>
          )}

          {/* Member info row */}
          <g transform={`translate(${MARGIN + 18} ${memberRowY})`}>
            <circle r={18} fill={COLORS.badgeGreen} />
            <IdCardIcon size={20} />
          </g>
          <text
            x={MARGIN + 50}
            y={memberRowY + 5}
            fontSize={16}
            fontWeight={800}
            letterSpacing={1.5}
            fill={COLORS.accent}
          >
            MEMBER ID
          </text>
          <text
            x={MARGIN + 50}
            y={memberValueY}
            fontSize={24}
            fontWeight={700}
            fontFamily={MONO}
            fill={COLORS.white}
          >
            {memberId}
          </text>

          <g transform={`translate(${memberCol2X + 18} ${memberRowY})`}>
            <circle r={18} fill={COLORS.badgeGreen} />
            <CalendarIcon size={20} />
          </g>
          <text
            x={memberCol2X + 50}
            y={memberRowY + 5}
            fontSize={16}
            fontWeight={800}
            letterSpacing={1.5}
            fill={COLORS.accent}
          >
            MEMBER SINCE
          </text>
          <text
            x={memberCol2X + 50}
            y={memberValueY}
            fontSize={24}
            fontWeight={700}
            fill={COLORS.white}
          >
            {memberSince}
          </text>

          {/* QR code */}
          <rect
            x={qrBoxX}
            y={qrBoxY}
            width={qrBoxSize}
            height={qrBoxSize}
            rx={16}
            fill="#ffffff"
          />
          <g transform={`translate(${qrBoxX + qrPadding} ${qrBoxY + qrPadding})`}>
            {qrRenderer
              ? qrRenderer(resolvedQrValue, qrInnerSize)
              : renderFallbackQr(resolvedQrValue, qrInnerSize)}
          </g>

          {/* Photo / community band */}
          <g clipPath="url(#bandClip)">
            {photoUrl ? (
              <image
                href={photoUrl}
                x={0}
                y={bandY}
                width={CARD_WIDTH}
                height={bandHeight}
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              renderPhotoFallback(memberId, bandY, bandHeight)
            )}
            <rect
              x={0}
              y={bandY}
              width={CARD_WIDTH}
              height={bandHeight}
              fill="url(#bandOverlay)"
            />
          </g>
          <rect x={0} y={bandY - 2} width={CARD_WIDTH} height={4} fill="url(#seam)" />

          {/* Footer bar */}
          <g transform={`translate(${MARGIN + 30} ${CARD_HEIGHT - MARGIN - 30})`}>
            <circle r={30} fill={COLORS.badgeGreen} />
            <CommunityIcon size={34} />
          </g>
          <text
            x={MARGIN + 76}
            y={CARD_HEIGHT - MARGIN - 38}
            fontSize={26}
            fontWeight={800}
            fill={COLORS.white}
          >
            {footerLines.map((line, i) => (
              <tspan key={i} x={MARGIN + 76} dy={i === 0 ? 0 : 32}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      </svg>

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={handleDownload}
          disabled={preparing}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 12,
            border: "none",
            background: "#1e6b2f",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: 14,
            cursor: preparing ? "default" : "pointer",
            opacity: preparing ? 0.7 : 1,
          }}
        >
          {preparing ? "Preparing…" : "Download card"}
        </button>
        {exportError && (
          <p style={{ marginTop: 8, fontSize: 12, color: "#b91c1c" }}>
            Couldn't prepare the download — please try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default GreenCardImage;
