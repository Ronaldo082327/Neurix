import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  mastery: number;
  category: "root" | "branch" | "leaf";
}

interface GraphEdge {
  from: string;
  to: string;
}

const nodes: GraphNode[] = [
  { id: "root", label: "Dir. Constitucional", x: 50, y: 50, mastery: 0.72, category: "root" },
  { id: "pc", label: "Poder Constituinte", x: 20, y: 22, mastery: 0.62, category: "branch" },
  { id: "cc", label: "Controle de Const.", x: 80, y: 20, mastery: 0.35, category: "branch" },
  { id: "df", label: "Dir. Fundamentais", x: 25, y: 78, mastery: 0.81, category: "branch" },
  { id: "re", label: "Remédios Const.", x: 78, y: 80, mastery: 0.44, category: "branch" },
  { id: "pco", label: "P.C. Originário", x: 8, y: 8, mastery: 0.58, category: "leaf" },
  { id: "pcd", label: "P.C. Derivado", x: 35, y: 6, mastery: 0.49, category: "leaf" },
  { id: "adi", label: "ADI / ADC", x: 92, y: 6, mastery: 0.28, category: "leaf" },
  { id: "adpf", label: "ADPF", x: 68, y: 8, mastery: 0.31, category: "leaf" },
  { id: "ind", label: "Dir. Individuais", x: 8, y: 92, mastery: 0.88, category: "leaf" },
  { id: "soc", label: "Dir. Sociais", x: 40, y: 92, mastery: 0.75, category: "leaf" },
  { id: "hc", label: "Habeas Corpus", x: 62, y: 92, mastery: 0.52, category: "leaf" },
  { id: "ms", label: "Mandado Seg.", x: 92, y: 92, mastery: 0.39, category: "leaf" },
];

const edges: GraphEdge[] = [
  { from: "root", to: "pc" },
  { from: "root", to: "cc" },
  { from: "root", to: "df" },
  { from: "root", to: "re" },
  { from: "pc", to: "pco" },
  { from: "pc", to: "pcd" },
  { from: "cc", to: "adi" },
  { from: "cc", to: "adpf" },
  { from: "df", to: "ind" },
  { from: "df", to: "soc" },
  { from: "re", to: "hc" },
  { from: "re", to: "ms" },
];

function getMasteryColor(mastery: number): string {
  if (mastery >= 0.7) return "hsl(160 84% 39%)";
  if (mastery >= 0.5) return "hsl(42 95% 55%)";
  return "hsl(38 92% 50%)";
}

function getMasteryGlow(mastery: number): string {
  if (mastery >= 0.7) return "hsl(160 84% 39% / 0.4)";
  if (mastery >= 0.5) return "hsl(42 95% 55% / 0.4)";
  return "hsl(38 92% 50% / 0.4)";
}

function getMasteryLabel(mastery: number): string {
  if (mastery >= 0.7) return "Dominado";
  if (mastery >= 0.5) return "Em progresso";
  return "Precisa revisar";
}

function getNodeSize(category: GraphNode["category"]): number {
  if (category === "root") return 28;
  if (category === "branch") return 20;
  return 14;
}

export function AnimatedCognitiveGraph() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<GraphNode | null>(null);
  const [activePulseIndex, setActivePulseIndex] = useState(0);

  const getNode = useCallback((id: string) => nodes.find((n) => n.id === id)!, []);

  // Cycle through edges for sequential pulse effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePulseIndex((prev) => (prev + 1) % edges.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const connectedTo = hoveredNode
    ? edges
        .filter((e) => e.from === hoveredNode || e.to === hoveredNode)
        .flatMap((e) => [e.from, e.to])
    : [];

  return (
    <div className="relative w-full aspect-square max-w-[520px] mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feFlood floodColor="hsl(160 84% 39%)" floodOpacity="0.6" result="glowColor" />
            <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-yellow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feFlood floodColor="hsl(42 95% 55%)" floodOpacity="0.6" result="glowColor" />
            <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feFlood floodColor="hsl(38 92% 50%)" floodOpacity="0.6" result="glowColor" />
            <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feFlood floodColor="hsl(168 64% 40%)" floodOpacity="0.5" result="glowColor" />
            <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(168 64% 40%)" stopOpacity="0.03" />
            <stop offset="100%" stopColor="hsl(168 64% 40%)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background ambient glow */}
        <circle cx="50" cy="50" r="48" fill="url(#bg-glow)" />

        {/* Edges with animated dash */}
        {edges.map((edge, i) => {
          const from = getNode(edge.from);
          const to = getNode(edge.to);
          const isHighlighted =
            hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode);
          const isDimmed = hoveredNode && !isHighlighted;
          const isActivePulse = i === activePulseIndex || i === (activePulseIndex + 6) % edges.length;

          return (
            <g key={`edge-${edge.from}-${edge.to}`}>
              {/* Base edge */}
              <motion.line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHighlighted ? "hsl(168 64% 40%)" : "hsl(200 12% 18%)"}
                strokeWidth={isHighlighted ? 0.6 : 0.3}
                strokeOpacity={isDimmed ? 0.1 : isHighlighted ? 0.9 : 0.35}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.04 }}
              />
              {/* Glowing overlay on hover */}
              {isHighlighted && (
                <motion.line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="hsl(168 64% 40%)"
                  strokeWidth={1.2}
                  strokeOpacity={0.15}
                  filter="url(#glow-blue)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </g>
          );
        })}

        {/* Traveling data pulses — multiple concurrent */}
        {edges.map((edge, i) => {
          const from = getNode(edge.from);
          const to = getNode(edge.to);
          return (
            <g key={`pulse-group-${i}`}>
              {/* Primary pulse */}
              <motion.circle
                r={0.7}
                fill="hsl(168 64% 40%)"
                filter="url(#glow-blue)"
                initial={{ cx: from.x, cy: from.y, opacity: 0 }}
                animate={{
                  cx: [from.x, to.x],
                  cy: [from.y, to.y],
                  opacity: [0, 0.9, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.5,
                  repeat: Infinity,
                  repeatDelay: edges.length * 0.3,
                  ease: "easeInOut",
                }}
              />
              {/* Secondary reverse pulse */}
              <motion.circle
                r={0.4}
                fill="hsl(168 64% 52%)"
                initial={{ cx: to.x, cy: to.y, opacity: 0 }}
                animate={{
                  cx: [to.x, from.x],
                  cy: [to.y, from.y],
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.7 + 1,
                  repeat: Infinity,
                  repeatDelay: edges.length * 0.5,
                  ease: "easeInOut",
                }}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const size = getNodeSize(node.category);
          const r = size / 6;
          const isHovered = hoveredNode === node.id;
          const isConnected = connectedTo.includes(node.id);
          const isDimmed = hoveredNode && !isHovered && !isConnected;
          const glowFilter = node.mastery >= 0.7 ? "url(#glow-green)" : node.mastery >= 0.5 ? "url(#glow-yellow)" : "url(#glow-red)";

          return (
            <motion.g
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.06, type: "spring", stiffness: 180 }}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => setActiveNode(activeNode?.id === node.id ? null : node)}
            >
              {/* Breathing outer ring */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={r + 2.5}
                fill="none"
                stroke={getMasteryColor(node.mastery)}
                strokeWidth={0.2}
                strokeOpacity={0.12}
                animate={{
                  r: [r + 2, r + 3.5, r + 2],
                  strokeOpacity: [0.08, 0.2, 0.08],
                }}
                transition={{
                  duration: 3 + (i % 3),
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Mastery arc (progress ring) */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={r + 1.2}
                fill="none"
                stroke={getMasteryColor(node.mastery)}
                strokeWidth={0.4}
                strokeDasharray={`${node.mastery * 2 * Math.PI * (r + 1.2)} ${(1 - node.mastery) * 2 * Math.PI * (r + 1.2)}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                opacity={isDimmed ? 0.15 : 0.6}
                transform={`rotate(-90 ${node.x} ${node.y})`}
                initial={{ strokeDasharray: `0 ${2 * Math.PI * (r + 1.2)}` }}
                whileInView={{
                  strokeDasharray: `${node.mastery * 2 * Math.PI * (r + 1.2)} ${(1 - node.mastery) * 2 * Math.PI * (r + 1.2)}`,
                }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.5 + i * 0.08, ease: "easeOut" }}
              />

              {/* Hover glow ring */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={r + 1.5}
                fill="none"
                stroke={getMasteryColor(node.mastery)}
                strokeWidth={isHovered ? 0.5 : 0.2}
                strokeOpacity={isHovered ? 0.7 : 0}
                filter={isHovered ? glowFilter : undefined}
                animate={{
                  r: isHovered ? r + 4 : r + 1.5,
                  strokeOpacity: isHovered ? 0.7 : 0,
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Main circle */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={getMasteryColor(node.mastery)}
                fillOpacity={isDimmed ? 0.15 : isHovered ? 1 : 0.75}
                filter={isHovered ? glowFilter : undefined}
                animate={{
                  r: isHovered ? r * 1.35 : r,
                  fillOpacity: isDimmed ? 0.15 : isHovered ? 1 : 0.75,
                }}
                transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
              />

              {/* Inner pulse for hovered node */}
              {isHovered && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={r * 0.5}
                  fill="white"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 0.3, 0], r: [r * 0.3, r * 1.5, r * 2] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}

              {/* Label */}
              <motion.text
                x={node.x}
                y={node.y + r + 3}
                textAnchor="middle"
                fill="hsl(210 40% 85%)"
                fontSize={node.category === "root" ? 2.8 : node.category === "branch" ? 2.2 : 1.8}
                fontWeight={node.category === "root" ? 700 : 500}
                opacity={isDimmed ? 0.15 : 1}
                className="select-none pointer-events-none"
              >
                {node.label}
              </motion.text>

              {/* Mastery % inside node (root/branch only) */}
              {(node.category === "root" || node.category === "branch") && (
                <motion.text
                  x={node.x}
                  y={node.y + 0.8}
                  textAnchor="middle"
                  fill="hsl(200 25% 3.5%)"
                  fontSize={node.category === "root" ? 2.4 : 1.8}
                  fontWeight={700}
                  opacity={isDimmed ? 0.15 : 1}
                  className="select-none pointer-events-none"
                >
                  {Math.round(node.mastery * 100)}%
                </motion.text>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {activeNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border/60 rounded-xl p-4 shadow-2xl backdrop-blur-md w-[280px] z-10"
          >
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: getMasteryColor(activeNode.mastery) }}
                animate={{
                  boxShadow: [
                    `0 0 0px ${getMasteryGlow(activeNode.mastery)}`,
                    `0 0 10px ${getMasteryGlow(activeNode.mastery)}`,
                    `0 0 0px ${getMasteryGlow(activeNode.mastery)}`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="font-bold text-foreground text-sm">{activeNode.label}</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Domínio</span>
                <span className="font-mono font-bold text-foreground text-sm">
                  {Math.round(activeNode.mastery * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-2 rounded-full"
                  style={{ backgroundColor: getMasteryColor(activeNode.mastery) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${activeNode.mastery * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground">Status</span>
                <span
                  className="font-semibold"
                  style={{ color: getMasteryColor(activeNode.mastery) }}
                >
                  {getMasteryLabel(activeNode.mastery)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Categoria</span>
                <span className="text-foreground capitalize">{activeNode.category === "root" ? "Raiz" : activeNode.category === "branch" ? "Ramo" : "Folha"}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
        {[
          { color: "hsl(160 84% 39%)", label: "Dominado (>70%)" },
          { color: "hsl(42 95% 55%)", label: "Em progresso" },
          { color: "hsl(38 92% 50%)", label: "Revisar (<50%)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <motion.div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
              animate={{
                boxShadow: [`0 0 0px ${item.color.replace(")", " / 0)")}`, `0 0 6px ${item.color.replace(")", " / 0.5)")}`, `0 0 0px ${item.color.replace(")", " / 0)")}`],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: Math.random() }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
