import { motion } from "framer-motion";

interface NeurixLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  variant?: "full" | "icon";
}

/**
 * NEURIX — Cognitive Synthesis Logo
 *
 * Visual concept: A neural synapse merging with a digital twin structure.
 * Organic curves meet geometric precision — bioluminescent teal & amber
 * represent the fusion of technology and biology in cognitive learning.
 *
 * The central hexagonal node represents the "digital twin" core.
 * Branching dendrite paths symbolize knowledge pathways.
 * Pulsing synaptic points show active learning connections.
 */
export function NeurixLogo({ size = 40, className = "", animated = true, variant = "icon" }: NeurixLogoProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // Scale factor based on 40px base
  const f = s / 40;

  // Colors from the new Cognitive Synthesis palette
  const teal = "#14B8A6";       // Primary: bioluminescent teal
  const amber = "#F59E0B";      // Secondary: synaptic amber
  const cyan = "#06B6D4";       // Neural cyan
  const emerald = "#10B981";    // Growth emerald
  const tealGlow = "#14B8A680"; // Teal with opacity for glow

  // Synaptic node positions (neural network topology)
  const nodes = [
    { x: cx, y: cy, r: 3.5 * f, primary: true },           // Central core
    { x: cx - 12 * f, y: cy - 10 * f, r: 2 * f },          // Top-left dendrite
    { x: cx + 13 * f, y: cy - 8 * f, r: 2.2 * f },         // Top-right dendrite
    { x: cx - 14 * f, y: cy + 7 * f, r: 1.8 * f },         // Bottom-left dendrite
    { x: cx + 11 * f, y: cy + 11 * f, r: 2 * f },          // Bottom-right dendrite
    { x: cx - 5 * f, y: cy - 16 * f, r: 1.4 * f },         // Top dendrite tip
    { x: cx + 6 * f, y: cy + 16 * f, r: 1.4 * f },         // Bottom dendrite tip
    { x: cx + 17 * f, y: cy + 2 * f, r: 1.5 * f },         // Right dendrite tip
  ];

  // Axon/dendrite connections (organic curves between nodes)
  const connections = [
    // Core to primary dendrites
    { from: 0, to: 1, curve: 4 * f },
    { from: 0, to: 2, curve: -3 * f },
    { from: 0, to: 3, curve: -5 * f },
    { from: 0, to: 4, curve: 3 * f },
    // Dendrite branching
    { from: 1, to: 5, curve: 2 * f },
    { from: 4, to: 6, curve: -2 * f },
    { from: 2, to: 7, curve: 2 * f },
    // Cross-connections (knowledge transfer pathways)
    { from: 1, to: 3, curve: 8 * f },
    { from: 2, to: 4, curve: -6 * f },
  ];

  // Generate organic curved path between two nodes
  const curvePath = (fromIdx: number, toIdx: number, curve: number) => {
    const a = nodes[fromIdx];
    const b = nodes[toIdx];
    const mx = (a.x + b.x) / 2 + curve;
    const my = (a.y + b.y) / 2 - curve * 0.5;
    return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
  };

  // DNA-like double helix in the center (represents "digital twin")
  const helixPath1 = `M ${cx - 4 * f} ${cy - 5 * f} C ${cx + 2 * f} ${cy - 2 * f} ${cx - 2 * f} ${cy + 2 * f} ${cx + 4 * f} ${cy + 5 * f}`;
  const helixPath2 = `M ${cx + 4 * f} ${cy - 5 * f} C ${cx - 2 * f} ${cy - 2 * f} ${cx + 2 * f} ${cy + 2 * f} ${cx - 4 * f} ${cy + 5 * f}`;

  return (
    <motion.svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={animated ? { opacity: 0, scale: 0.8 } : false}
      animate={animated ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <defs>
        {/* Bioluminescent glow filter */}
        <filter id="neurix-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={2.5 * f} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Synaptic pulse glow */}
        <filter id="synapse-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={4 * f} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Neural gradient — teal to cyan */}
        <linearGradient id="neural-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={teal} />
          <stop offset="50%" stopColor={cyan} />
          <stop offset="100%" stopColor={emerald} />
        </linearGradient>

        {/* Core gradient — teal to amber (bio meets tech) */}
        <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={amber} stopOpacity="1" />
          <stop offset="60%" stopColor={teal} stopOpacity="0.9" />
          <stop offset="100%" stopColor={cyan} stopOpacity="0.6" />
        </radialGradient>

        {/* Ambient glow */}
        <radialGradient id="ambient-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={teal} stopOpacity="0.15" />
          <stop offset="100%" stopColor={teal} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient background glow */}
      <circle cx={cx} cy={cy} r={18 * f} fill="url(#ambient-glow)" />

      {/* Axon connections — organic curves */}
      {connections.map((conn, i) => (
        <motion.path
          key={`conn-${i}`}
          d={curvePath(conn.from, conn.to, conn.curve)}
          stroke="url(#neural-grad)"
          strokeWidth={1.2 * f}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 0.5 } : false}
          transition={{ duration: 1, delay: 0.3 + i * 0.08, ease: "easeInOut" }}
        />
      ))}

      {/* Synaptic pulse traveling along connections */}
      {animated && connections.slice(0, 5).map((conn, i) => (
        <motion.circle
          key={`pulse-${i}`}
          r={1.2 * f}
          fill={teal}
          filter="url(#synapse-glow)"
          opacity={0.8}
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{
            duration: 2 + i * 0.3,
            delay: 1 + i * 0.4,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
          }}
          style={{
            offsetPath: `path('${curvePath(conn.from, conn.to, conn.curve)}')`,
          }}
        />
      ))}

      {/* DNA double helix at center (digital twin symbol) */}
      <motion.path
        d={helixPath1}
        stroke={teal}
        strokeWidth={1.5 * f}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
        filter="url(#neurix-glow)"
        initial={animated ? { pathLength: 0 } : false}
        animate={animated ? { pathLength: 1 } : false}
        transition={{ duration: 1.2, delay: 0.5 }}
      />
      <motion.path
        d={helixPath2}
        stroke={amber}
        strokeWidth={1.5 * f}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
        filter="url(#neurix-glow)"
        initial={animated ? { pathLength: 0 } : false}
        animate={animated ? { pathLength: 1 } : false}
        transition={{ duration: 1.2, delay: 0.7 }}
      />

      {/* Helix cross-rungs (base pairs) */}
      {[-3, 0, 3].map((offset, i) => (
        <motion.line
          key={`rung-${i}`}
          x1={cx - 2 * f}
          y1={cy + offset * f}
          x2={cx + 2 * f}
          y2={cy + offset * f}
          stroke={teal}
          strokeWidth={0.8 * f}
          strokeLinecap="round"
          opacity={0.3}
          initial={animated ? { opacity: 0 } : false}
          animate={animated ? { opacity: 0.3 } : false}
          transition={{ duration: 0.5, delay: 1 + i * 0.15 }}
        />
      ))}

      {/* Synaptic nodes */}
      {nodes.map((node, i) => (
        <motion.g key={`node-${i}`}>
          {/* Outer glow ring */}
          {node.primary && animated && (
            <motion.circle
              cx={node.x}
              cy={node.y}
              r={node.r * 2.5}
              fill="none"
              stroke={teal}
              strokeWidth={0.5 * f}
              opacity={0.3}
              animate={{
                r: [node.r * 2, node.r * 3],
                opacity: [0.3, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          )}

          {/* Node body */}
          <motion.circle
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill={node.primary ? "url(#core-grad)" : teal}
            filter="url(#neurix-glow)"
            opacity={node.primary ? 1 : 0.7}
            initial={animated ? { scale: 0, opacity: 0 } : false}
            animate={animated ? { scale: 1, opacity: node.primary ? 1 : 0.7 } : false}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.06, type: "spring" }}
          />

          {/* Inner highlight */}
          <circle
            cx={node.x - node.r * 0.25}
            cy={node.y - node.r * 0.3}
            r={node.r * 0.35}
            fill="white"
            opacity={0.3}
          />
        </motion.g>
      ))}

      {/* Central core bright point */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={1.5 * f}
        fill="white"
        opacity={0.9}
        animate={animated ? { opacity: [0.6, 1, 0.6] } : false}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

/**
 * Full logo with wordmark
 */
export function NeurixLogoFull({
  size = 40,
  className = "",
  animated = true,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <NeurixLogo size={size} animated={animated} />
      <span className="font-display text-xl font-bold tracking-wider gradient-text">
        NEURIX
      </span>
    </div>
  );
}
