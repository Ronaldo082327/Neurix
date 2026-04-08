import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: "brain" | "discipline" | "topic";
  parentId?: string;
  pulsePhase: number;
  mass: number;
}

interface Edge {
  from: string;
  to: string;
}

interface Particle {
  x: number;
  y: number;
  fromId: string;
  toId: string;
  t: number;
  speed: number;
  size: number;
}

const DISCIPLINES_DATA = [
  {
    name: "Direito Constitucional",
    color: "147, 103, 245",
    topics: ["Direitos Fundamentais", "Organização do Estado", "Controle de Constitucionalidade", "Poder Legislativo", "Poder Executivo", "Remédios Constitucionais", "Princípios Fundamentais"],
  },
  {
    name: "Português",
    color: "200, 80, 255",
    topics: ["Interpretação de Texto", "Concordância Verbal", "Regência", "Crase", "Pontuação", "Coesão e Coerência", "Classes de Palavras"],
  },
  {
    name: "Raciocínio Lógico",
    color: "0, 195, 255",
    topics: ["Proposições", "Equivalências Lógicas", "Probabilidade", "Análise Combinatória", "Sequências", "Diagramas Lógicos"],
  },
  {
    name: "Direito Administrativo",
    color: "74, 222, 128",
    topics: ["Atos Administrativos", "Licitações", "Servidores Públicos", "Responsabilidade Civil", "Processo Administrativo", "Poderes Administrativos"],
  },
  {
    name: "Informática",
    color: "251, 191, 36",
    topics: ["Redes de Computadores", "Segurança da Informação", "Sistemas Operacionais", "Navegadores", "Computação em Nuvem"],
  },
  {
    name: "Direito Penal",
    color: "235, 80, 140",
    topics: ["Crimes contra a Pessoa", "Teoria da Pena", "Tipicidade", "Ilicitude", "Culpabilidade", "Crimes contra o Patrimônio", "Lei de Drogas"],
  },
  {
    name: "Direito Civil",
    color: "192, 132, 252",
    topics: ["Obrigações", "Contratos", "Direito de Família", "Responsabilidade Civil", "Prescrição e Decadência", "Direitos Reais"],
  },
  {
    name: "AFO",
    color: "45, 212, 191",
    topics: ["LOA", "LDO", "PPA", "Ciclo Orçamentário", "Créditos Adicionais", "Despesa Pública"],
  },
];

function buildGraph(w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Brain center
  nodes.push({
    id: "brain",
    label: "NEURIX",
    x: cx + (Math.random() - 0.5) * 20,
    y: cy + (Math.random() - 0.5) * 20,
    vx: 0, vy: 0,
    radius: 30,
    color: "147, 103, 245",
    type: "brain",
    pulsePhase: 0,
    mass: 8,
  });

  const discRadius = Math.min(w, h) * 0.28;

  DISCIPLINES_DATA.forEach((d, i) => {
    const angle = (i / DISCIPLINES_DATA.length) * Math.PI * 2 - Math.PI / 2;
    const dx = cx + Math.cos(angle) * discRadius + (Math.random() - 0.5) * 40;
    const dy = cy + Math.sin(angle) * discRadius + (Math.random() - 0.5) * 40;
    const discId = `disc-${i}`;

    nodes.push({
      id: discId,
      label: d.name,
      x: dx, y: dy,
      vx: 0, vy: 0,
      radius: 16,
      color: d.color,
      type: "discipline",
      pulsePhase: Math.random() * Math.PI * 2,
      mass: 4,
    });

    edges.push({ from: "brain", to: discId });

    // Topics
    d.topics.forEach((topic, j) => {
      const tAngle = angle + ((j - d.topics.length / 2) * 0.3);
      const tDist = discRadius + 60 + Math.random() * 80;
      const topicId = `topic-${i}-${j}`;

      nodes.push({
        id: topicId,
        label: topic,
        x: cx + Math.cos(tAngle) * tDist + (Math.random() - 0.5) * 50,
        y: cy + Math.sin(tAngle) * tDist + (Math.random() - 0.5) * 50,
        vx: 0, vy: 0,
        radius: 4 + Math.random() * 4,
        color: d.color,
        type: "topic",
        parentId: discId,
        pulsePhase: Math.random() * Math.PI * 2,
        mass: 1,
      });

      edges.push({ from: discId, to: topicId });
    });
  });

  // Cross-discipline edges
  for (let i = 0; i < DISCIPLINES_DATA.length; i++) {
    const next = (i + 1) % DISCIPLINES_DATA.length;
    edges.push({ from: `disc-${i}`, to: `disc-${next}` });
  }
  // A few diagonal connections
  edges.push({ from: "disc-0", to: "disc-4" });
  edges.push({ from: "disc-1", to: "disc-5" });
  edges.push({ from: "disc-2", to: "disc-6" });
  edges.push({ from: "disc-3", to: "disc-7" });

  // Some cross-topic connections for visual density
  for (let i = 0; i < DISCIPLINES_DATA.length; i++) {
    const next = (i + 1) % DISCIPLINES_DATA.length;
    // Connect last topic of discipline i to first topic of discipline next
    const lastJ = DISCIPLINES_DATA[i].topics.length - 1;
    edges.push({ from: `topic-${i}-${lastJ}`, to: `topic-${next}-0` });
  }

  return { nodes, edges };
}

interface NodeLabel {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  type: "brain" | "discipline" | "topic";
  alpha: number;
  isHovered: boolean;
}

export function CognitiveGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{ nodes: Node[]; edges: Edge[]; particles: Particle[] }>({ nodes: [], edges: [], particles: [] });
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const hoveredRef = useRef<string | null>(null);
  const [tooltip, setTooltip] = useState<{ label: string; color: string; x: number; y: number; topics?: string[] } | null>(null);
  const [nodeLabels, setNodeLabels] = useState<NodeLabel[]>([]);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const labelFrameRef = useRef(0);

  const init = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    sizeRef.current = { w: rect.width, h: rect.height };
    const { nodes, edges } = buildGraph(rect.width, rect.height);
    stateRef.current = { nodes, edges, particles: [] };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
      hoveredRef.current = null;
      setTooltip(null);
    };
    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("mouseleave", onLeave);

    const draw = () => {
      const { w, h } = sizeRef.current;
      const { nodes, edges, particles } = stateRef.current;
      const cx = w / 2;
      const cy = h / 2;
      timeRef.current++;
      const t = timeRef.current;

      ctx.clearRect(0, 0, w, h);

      // === Force-directed simulation (light) ===
      const repulsion = 800;
      const attraction = 0.003;
      const centerPull = 0.0004;
      const damping = 0.92;

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = (nodes[i].radius + nodes[j].radius) * 2;
          if (dist < minDist * 5) {
            const force = (repulsion * nodes[i].mass * nodes[j].mass) / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodes[i].vx += fx / nodes[i].mass;
            nodes[i].vy += fy / nodes[i].mass;
            nodes[j].vx -= fx / nodes[j].mass;
            nodes[j].vy -= fy / nodes[j].mass;
          }
        }
      }

      // Attraction along edges
      edges.forEach(edge => {
        const a = nodes.find(n => n.id === edge.from);
        const b = nodes.find(n => n.id === edge.to);
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const idealDist = a.type === "brain" || b.type === "brain" ? 160 : a.type === "discipline" && b.type === "discipline" ? 180 : 90;
        const force = (dist - idealDist) * attraction;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      });

      // Center gravity + update
      nodes.forEach(n => {
        if (n.type === "brain") {
          // Strong center pull for brain
          n.vx += (cx - n.x) * 0.01;
          n.vy += (cy - n.y) * 0.01;
        } else {
          n.vx += (cx - n.x) * centerPull;
          n.vy += (cy - n.y) * centerPull;
        }

        // Mouse repulsion
        const mdx = n.x - mouseRef.current.x;
        const mdy = n.y - mouseRef.current.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
        if (mDist < 80 && n.type === "topic") {
          n.vx += (mdx / mDist) * 0.5;
          n.vy += (mdy / mDist) * 0.5;
        }

        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;

        // Bounds
        const margin = n.radius + 5;
        n.x = Math.max(margin, Math.min(w - margin, n.x));
        n.y = Math.max(margin, Math.min(h - margin, n.y));

        n.pulsePhase += 0.02;
      });

      // === Hover detection ===
      let foundHover: string | null = null;
      for (const n of nodes) {
        const dx = mouseRef.current.x - n.x;
        const dy = mouseRef.current.y - n.y;
        const hitR = Math.max(n.radius + 8, 15);
        if (dx * dx + dy * dy < hitR * hitR) {
          foundHover = n.id;
          break;
        }
      }
      if (foundHover !== hoveredRef.current) {
        hoveredRef.current = foundHover;
        if (foundHover) {
          const node = nodes.find(n => n.id === foundHover)!;
          const discData = node.type === "discipline"
            ? DISCIPLINES_DATA.find(d => d.name === node.label)
            : undefined;
          setTooltip({
            label: node.label,
            color: node.color,
            x: node.x,
            y: node.y,
            topics: discData?.topics,
          });
        } else {
          setTooltip(null);
        }
      }
      if (canvasRef.current) {
        canvasRef.current.style.cursor = foundHover ? "pointer" : "default";
      }

      // Highlight connected set
      const highlightSet = new Set<string>();
      if (hoveredRef.current) {
        highlightSet.add(hoveredRef.current);
        edges.forEach(e => {
          if (e.from === hoveredRef.current) highlightSet.add(e.to);
          if (e.to === hoveredRef.current) highlightSet.add(e.from);
        });
      }
      const hasHighlight = highlightSet.size > 0;

      // === Draw edges ===
      edges.forEach(edge => {
        const a = nodes.find(n => n.id === edge.from);
        const b = nodes.find(n => n.id === edge.to);
        if (!a || !b) return;

        const edgeHighlighted = highlightSet.has(edge.from) && highlightSet.has(edge.to);
        const pulse = Math.sin(t * 0.015 + a.pulsePhase) * 0.3 + 0.5;

        let alpha: number;
        let lineW: number;
        if (hasHighlight) {
          alpha = edgeHighlighted ? 0.5 : 0.04;
          lineW = edgeHighlighted ? 1.5 : 0.3;
        } else {
          alpha = a.type === "brain" || b.type === "brain" ? 0.12 + pulse * 0.08 : 0.06 + pulse * 0.04;
          lineW = a.type === "brain" || b.type === "brain" ? 0.8 : 0.4;
        }

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${a.color}, ${alpha})`;
        ctx.lineWidth = lineW;
        ctx.stroke();
      });

      // === Draw particles ===
      if (Math.random() < 0.15 && particles.length < 50) {
        const edge = edges[Math.floor(Math.random() * edges.length)];
        const reverse = Math.random() > 0.5;
        particles.push({
          x: 0, y: 0,
          fromId: reverse ? edge.to : edge.from,
          toId: reverse ? edge.from : edge.to,
          t: 0,
          speed: 0.005 + Math.random() * 0.01,
          size: 1 + Math.random() * 2,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.t += p.speed;
        if (p.t > 1) { particles.splice(i, 1); continue; }
        const a = nodes.find(n => n.id === p.fromId);
        const b = nodes.find(n => n.id === p.toId);
        if (!a || !b) { particles.splice(i, 1); continue; }
        p.x = a.x + (b.x - a.x) * p.t;
        p.y = a.y + (b.y - a.y) * p.t;
        const alpha = Math.sin(p.t * Math.PI) * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${a.color}, ${alpha})`;
        ctx.fill();
      }

      // === Draw nodes ===
      nodes.forEach(n => {
        const isHovered = hoveredRef.current === n.id;
        const isConnected = highlightSet.has(n.id);
        const dimmed = hasHighlight && !isConnected;
        const pulse = Math.sin(n.pulsePhase) * 0.25 + 1;
        const r = n.radius * (isHovered ? 1.3 : pulse * 0.1 + 0.95);

        // Glow
        if (!dimmed) {
          const gR = r * (isHovered ? 4 : n.type === "brain" ? 3 : 2);
          const grad = ctx.createRadialGradient(n.x, n.y, r * 0.3, n.x, n.y, gR);
          grad.addColorStop(0, `rgba(${n.color}, ${isHovered ? 0.35 : 0.1})`);
          grad.addColorStop(1, `rgba(${n.color}, 0)`);
          ctx.beginPath();
          ctx.arc(n.x, n.y, gR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        const fillAlpha = dimmed ? 0.03 : isHovered ? 0.35 : n.type === "brain" ? 0.2 : n.type === "discipline" ? 0.15 : 0.12;
        ctx.fillStyle = `rgba(${n.color}, ${fillAlpha})`;
        ctx.fill();
        const strokeAlpha = dimmed ? 0.08 : isHovered ? 1 : n.type === "brain" ? 0.7 : n.type === "discipline" ? 0.5 : 0.3;
        ctx.strokeStyle = `rgba(${n.color}, ${strokeAlpha})`;
        ctx.lineWidth = isHovered ? 2 : n.type === "brain" ? 1.5 : 0.8;
        ctx.stroke();

        // Draw brain emoji on canvas (emojis render fine)
        if (n.type === "brain") {
          ctx.font = "20px sans-serif";
          ctx.fillStyle = `rgba(${n.color}, 1)`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🧠", Math.round(n.x), Math.round(n.y) - 1);
        }
      });

      // Collect label positions for HTML overlay (throttled to every 3 frames)
      labelFrameRef.current++;
      if (labelFrameRef.current % 3 === 0) {
        const labels: NodeLabel[] = nodes.map(nd => {
          const isHov = hoveredRef.current === nd.id;
          const isCon = highlightSet.has(nd.id);
          const dim = hasHighlight && !isCon;
          const pls = Math.sin(nd.pulsePhase) * 0.25 + 1;
          const rr = nd.radius * (isHov ? 1.3 : pls * 0.1 + 0.95);
          const la = dim ? 0.1 : isHov ? 1 : nd.type === "brain" ? 0.9 : nd.type === "discipline" ? 0.75 : 0.5;

          return {
            id: nd.id,
            label: nd.type === "brain" ? "NEURIX" : nd.label,
            x: Math.round(nd.x),
            y: Math.round(nd.type === "brain" ? nd.y + 18 : nd.y + rr + 8),
            color: nd.color,
            type: nd.type,
            alpha: la,
            isHovered: isHov,
          };
        });
        setNodeLabels(labels);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [init]);

  return (
    <section className="py-24 relative overflow-hidden section-glow" id="grafo">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="container px-4 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="neuro-badge mb-6 mx-auto w-fit">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Grafo Neural Interativo
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Seu grafo cognitivo{" "}
            <span className="gradient-aurora-text">em tempo real</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cada disciplina e tópico é um nó. As conexões representam conhecimento consolidado.
            Passe o mouse para explorar as interconexões do seu cérebro de aprovado.
          </p>
        </motion.div>

        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="relative w-full max-w-6xl mx-auto neuro-card overflow-hidden glow-purple p-0"
          style={{ aspectRatio: "16 / 10" }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* HTML Labels overlay for proper Portuguese text rendering */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {nodeLabels.filter(lbl => lbl.type !== "brain").map(lbl => (
              <span
                key={lbl.id}
                className="absolute whitespace-nowrap select-none"
                style={{
                  left: `${lbl.x}px`,
                  top: `${lbl.y}px`,
                  transform: "translateX(-50%)",
                  color: `rgba(${lbl.color}, ${lbl.alpha})`,
                  fontSize: lbl.type === "discipline" ? (lbl.isHovered ? "14px" : "12px") : (lbl.isHovered ? "10px" : "8px"),
                  fontWeight: lbl.type === "discipline" ? (lbl.isHovered ? 600 : 500) : (lbl.isHovered ? 500 : 400),
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {lbl.label}
              </span>
            ))}
          </div>

          {tooltip && (
            <div
              className="absolute pointer-events-none z-30 px-4 py-3 rounded-xl border border-border/50 bg-card/95 backdrop-blur-md shadow-xl max-w-[220px] animate-fade-in"
              style={{
                left: `${Math.min(Math.max(tooltip.x + 20, 10), (containerRef.current?.getBoundingClientRect().width || 600) - 240)}px`,
                top: `${Math.max(tooltip.y - 30, 10)}px`,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `rgb(${tooltip.color})` }} />
                <p className="text-xs font-semibold text-foreground">{tooltip.label}</p>
              </div>
              {tooltip.topics && (
                <div className="space-y-1 mt-1">
                  {tooltip.topics.map((topic) => (
                    <div key={topic} className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground">{topic}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HUD */}
          <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-muted-foreground z-20">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Grafo ativo
          </div>
          <div className="absolute top-4 right-4 text-[10px] text-muted-foreground font-mono z-20">
            {stateRef.current.nodes.length || "~60"} nós · {stateRef.current.edges.length || "~80"} arestas
          </div>
          <div className="absolute bottom-4 left-4 text-[10px] text-muted-foreground/50 z-20">
            Simulação force-directed · BKT + Ebbinghaus
          </div>
        </motion.div>
      </div>
    </section>
  );
}
