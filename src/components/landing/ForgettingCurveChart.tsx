import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import { Slider } from "@/components/ui/slider";

const CHART_W = 600;
const CHART_H = 320;
const PAD = { top: 20, right: 40, bottom: 50, left: 50 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

const REVIEWS = [
  { label: "Sem revisão", stability: 1, color: "hsl(38 92% 50%)" },
  { label: "1ª revisão", stability: 2.5, color: "hsl(42 95% 55%)" },
  { label: "2ª revisão", stability: 6.25, color: "hsl(195 100% 42%)" },
  { label: "3ª revisão", stability: 15.6, color: "hsl(168 64% 40%)" },
  { label: "4ª revisão", stability: 39, color: "hsl(160 84% 39%)" },
];

const MAX_DAYS = 30;
const POINTS = 80;

function retention(t: number, S: number) {
  return Math.exp(-t / S);
}

function generateCurve(stability: number) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= POINTS; i++) {
    const t = (i / POINTS) * MAX_DAYS;
    const r = retention(t, stability);
    pts.push({
      x: PAD.left + (t / MAX_DAYS) * INNER_W,
      y: PAD.top + (1 - r) * INNER_H,
    });
  }
  return pts;
}

function pointsToPath(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

function pointsToArea(pts: { x: number; y: number }[]) {
  const baseline = PAD.top + INNER_H;
  const path = pointsToPath(pts);
  return `${path} L${pts[pts.length - 1].x.toFixed(2)},${baseline} L${pts[0].x.toFixed(2)},${baseline} Z`;
}

// Calculate optimal review day when R drops to 85%
function getReviewDay(stability: number): number {
  return -stability * Math.log(0.85);
}

export function ForgettingCurveChart() {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [hoveredCurve, setHoveredCurve] = useState<number | null>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const [showTarget, setShowTarget] = useState(false);
  
  // Interactive mode state
  const [interactiveS, setInteractiveS] = useState<number>(1);
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    let start: number;
    const duration = 1800;
    function tick(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setAnimProgress(p);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => setShowTarget(true), 300);
    }
    requestAnimationFrame(tick);
  }, [isInView]);

  const curves = useMemo(() => REVIEWS.map((r) => generateCurve(r.stability)), []);
  
  // Generate interactive curve
  const interactiveCurve = useMemo(() => generateCurve(interactiveS), [interactiveS]);
  const interactiveReviewDay = useMemo(() => getReviewDay(interactiveS), [interactiveS]);
  const interactiveReviewPoint = useMemo(() => {
    if (interactiveReviewDay > MAX_DAYS) return null;
    const r = 0.85;
    return {
      day: interactiveReviewDay,
      x: PAD.left + (interactiveReviewDay / MAX_DAYS) * INNER_W,
      y: PAD.top + (1 - r) * INNER_H,
    };
  }, [interactiveReviewDay]);

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];
  // X-axis labels
  const xLabels = [0, 5, 10, 15, 20, 25, 30];

  // Target retention line at 85%
  const targetY = PAD.top + (1 - 0.85) * INNER_H;

  return (
    <div className="w-full space-y-4">
      <svg
        ref={ref}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-auto"
        style={{ maxHeight: 340 }}
      >
        <defs>
          {REVIEWS.map((r, i) => (
            <linearGradient key={i} id={`curve-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={r.color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={r.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
          {/* Gradient for interactive mode */}
          <linearGradient id="curve-grad-interactive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yLabels.map((v) => {
          const y = PAD.top + (1 - v / 100) * INNER_H;
          return (
            <g key={`y-${v}`}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + INNER_W}
                y2={y}
                stroke="hsl(200 12% 13%)"
                strokeWidth={0.5}
                strokeDasharray={v === 0 || v === 100 ? "0" : "4 3"}
              />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="hsl(230 15% 50%)" fontSize={10} fontFamily="monospace">
                {v}%
              </text>
            </g>
          );
        })}
        {xLabels.map((d) => {
          const x = PAD.left + (d / MAX_DAYS) * INNER_W;
          return (
            <g key={`x-${d}`}>
              <line x1={x} y1={PAD.top} x2={x} y2={PAD.top + INNER_H} stroke="hsl(200 12% 13%)" strokeWidth={0.5} strokeDasharray="4 3" />
              <text x={x} y={PAD.top + INNER_H + 16} textAnchor="middle" fill="hsl(230 15% 50%)" fontSize={10} fontFamily="monospace">
                {d}d
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text x={PAD.left + INNER_W / 2} y={CHART_H - 4} textAnchor="middle" fill="hsl(230 15% 50%)" fontSize={11} fontWeight={600}>
          Dias após estudo
        </text>
        <text
          x={12}
          y={PAD.top + INNER_H / 2}
          textAnchor="middle"
          fill="hsl(230 15% 50%)"
          fontSize={11}
          fontWeight={600}
          transform={`rotate(-90, 12, ${PAD.top + INNER_H / 2})`}
        >
          Retenção
        </text>

        {/* Target retention line */}
        {showTarget && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <line
              x1={PAD.left}
              y1={targetY}
              x2={PAD.left + INNER_W}
              y2={targetY}
              stroke="hsl(160 84% 39%)"
              strokeWidth={1}
              strokeDasharray="6 4"
              opacity={0.6}
            />
            <text x={PAD.left + INNER_W + 4} y={targetY + 4} fill="hsl(160 84% 39%)" fontSize={9} fontFamily="monospace">
              85%
            </text>
          </motion.g>
        )}

        {/* Curves — areas + lines */}
        {isInteractiveMode ? (
          // Interactive single curve
          <g style={{ cursor: "pointer" }}>
            {/* Area fill */}
            <path
              d={pointsToArea(interactiveCurve)}
              fill="url(#curve-grad-interactive)"
              opacity={0.5}
              style={{ transition: "opacity 0.3s" }}
            />
            {/* Line */}
            <path
              d={pointsToPath(interactiveCurve)}
              fill="none"
              stroke="hsl(160 84% 39%)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Marker dot at optimal review point */}
            {interactiveReviewPoint && (
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <circle 
                  cx={interactiveReviewPoint.x} 
                  cy={interactiveReviewPoint.y} 
                  r={6} 
                  fill="hsl(160 84% 39%)" 
                  stroke="hsl(200 25% 3.5%)" 
                  strokeWidth={2} 
                />
                <motion.circle
                  cx={interactiveReviewPoint.x}
                  cy={interactiveReviewPoint.y}
                  r={6}
                  fill="none"
                  stroke="hsl(160 84% 39%)"
                  strokeWidth={1.5}
                  animate={{ r: [6, 14, 6], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {/* Label for interactive marker */}
                <text
                  x={interactiveReviewPoint.x}
                  y={interactiveReviewPoint.y - 12}
                  textAnchor="middle"
                  fill="hsl(160 84% 39%)"
                  fontSize={10}
                  fontWeight={600}
                >
                  Próxima revisão: {interactiveReviewDay.toFixed(1)} dias
                </text>
              </motion.g>
            )}
          </g>
        ) : (
          // Standard mode with all 5 curves
          curves.map((pts, i) => {
            const visiblePts = pts.slice(0, Math.ceil(animProgress * pts.length));
            if (visiblePts.length < 2) return null;
            const isHovered = hoveredCurve === i;
            const dimmed = hoveredCurve !== null && !isHovered;
            
            // Get review point
            const reviewDay = -REVIEWS[i].stability * Math.log(0.85);
            const showReviewMarker = reviewDay <= MAX_DAYS && showTarget;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredCurve(i)}
                onMouseLeave={() => setHoveredCurve(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Area fill */}
                <path
                  d={pointsToArea(visiblePts)}
                  fill={`url(#curve-grad-${i})`}
                  opacity={dimmed ? 0.15 : isHovered ? 0.5 : 0.3}
                  style={{ transition: "opacity 0.3s" }}
                />
                {/* Line */}
                <path
                  d={pointsToPath(visiblePts)}
                  fill="none"
                  stroke={REVIEWS[i].color}
                  strokeWidth={isHovered ? 3 : 2}
                  opacity={dimmed ? 0.25 : 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: "opacity 0.3s, stroke-width 0.2s" }}
                />
                {/* Animated dot at the end of the drawing */}
                {animProgress < 1 && visiblePts.length > 0 && (
                  <circle
                    cx={visiblePts[visiblePts.length - 1].x}
                    cy={visiblePts[visiblePts.length - 1].y}
                    r={4}
                    fill={REVIEWS[i].color}
                    opacity={dimmed ? 0.3 : 1}
                  />
                )}
                {/* Review marker dot */}
                {showReviewMarker && (
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                  >
                    <circle 
                      cx={PAD.left + (reviewDay / MAX_DAYS) * INNER_W}
                      cy={targetY}
                      r={5} 
                      fill={REVIEWS[i].color} 
                      stroke="hsl(200 25% 3.5%)" 
                      strokeWidth={2} 
                    />
                    <motion.circle
                      cx={PAD.left + (reviewDay / MAX_DAYS) * INNER_W}
                      cy={targetY}
                      r={5}
                      fill="none"
                      stroke={REVIEWS[i].color}
                      strokeWidth={1.5}
                      animate={{ r: [5, 12, 5], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                  </motion.g>
                )}
                {/* Invisible wider hitbox */}
                <path d={pointsToPath(visiblePts)} fill="none" stroke="transparent" strokeWidth={16} />
              </g>
            );
          })
        )}
      </svg>

      {/* Mode Toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => setIsInteractiveMode(false)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            !isInteractiveMode 
              ? "bg-primary text-primary-foreground" 
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Todas as Curvas
        </button>
        <button
          onClick={() => setIsInteractiveMode(true)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isInteractiveMode 
              ? "bg-primary text-primary-foreground" 
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Modo Interativo
        </button>
      </div>

      {/* Interactive Controls */}
      {isInteractiveMode && (
        <motion.div
          className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Estabilidade (S)</label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">S = 1.0</span>
              <span className="text-lg font-bold text-primary min-w-[60px] text-center">
                {interactiveS.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">S = 50.0</span>
            </div>
          </div>
          
          <Slider
            value={[interactiveS]}
            onValueChange={([val]) => setInteractiveS(val)}
            min={1}
            max={50}
            step={0.5}
            className="w-full"
          />
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-background/50 rounded-md">
              <p className="text-muted-foreground text-xs mb-1">Próxima revisão ideal</p>
              <p className="font-semibold text-foreground">
                {interactiveReviewDay > MAX_DAYS 
                  ? ">{30} dias" 
                  : `${interactiveReviewDay.toFixed(1)} dias`}
              </p>
            </div>
            <div className="p-3 bg-background/50 rounded-md">
              <p className="text-muted-foreground text-xs mb-1">Retenção após 7 dias</p>
              <p className="font-semibold text-foreground">
                {(retention(7, interactiveS) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Ajuste S para ver como a estabilidade afeta a curva de retenção e o tempo ideal para a próxima revisão.
          </p>
        </motion.div>
      )}

      {/* Legend - only show in non-interactive mode */}
      {!isInteractiveMode && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {REVIEWS.map((r, i) => (
            <motion.button
              key={r.label}
              className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors"
              style={{
                color: hoveredCurve === i ? r.color : "hsl(230 15% 50%)",
                background: hoveredCurve === i ? `${r.color.replace(")", " / 0.1)")}` : "transparent",
              }}
              onMouseEnter={() => setHoveredCurve(i)}
              onMouseLeave={() => setHoveredCurve(null)}
              initial={{ opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 + i * 0.08 }}
            >
              <span className="w-3 h-[3px] rounded-full" style={{ background: r.color }} />
              {r.label}
              <span className="text-[10px] opacity-60">(S={r.stability})</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Annotation */}
      <motion.p
        className="text-center text-xs text-muted-foreground max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.4 }}
      >
        R(t) = e<sup>−t/S</sup> — Cada revisão bem-sucedida multiplica a estabilidade S por ×2.5, tornando a curva mais suave e o intervalo entre revisões cada vez maior.
      </motion.p>
    </div>
  );
}
