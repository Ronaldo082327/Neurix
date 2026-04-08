import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, RefreshCw, Zap, Target, TrendingUp, AlertCircle, Network, Loader2 } from "lucide-react";
import { useCognitiveGraph, ConceptNode, ConceptEdge } from "@/hooks/use-cognitive-graph";
import { toast } from "sonner";

interface VisNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mastery: number;
  retention: number;
  importance: number;
  disciplineId: string | null;
  type: "concept";
}

function masteryColor(mastery: number): string {
  if (mastery >= 0.8) return "74, 222, 128"; // green
  if (mastery >= 0.6) return "250, 204, 21"; // yellow
  if (mastery >= 0.4) return "251, 146, 60"; // orange
  return "248, 113, 113"; // red
}

function buildVisGraph(nodes: ConceptNode[], edges: ConceptEdge[], w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const visNodes: VisNode[] = [];

  nodes.forEach((n, i) => {
    const state = n.cognitive_states?.[0];
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
    const dist = 100 + Math.random() * Math.min(w, h) * 0.3;

    visNodes.push({
      id: n.id,
      label: n.name,
      x: cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 60,
      y: cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 60,
      vx: 0,
      vy: 0,
      radius: 6 + (n.importance || 0.5) * 14,
      mastery: state?.p_mastery ?? 0.1,
      retention: state?.retention_score ?? 1,
      importance: n.importance,
      disciplineId: n.discipline_id,
      type: "concept",
    });
  });

  return visNodes;
}

export default function GrafoCognitivoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(0);
  const nodesRef = useRef<VisNode[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const hoveredRef = useRef<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [tooltip, setTooltip] = useState<{ label: string; mastery: number; retention: number; x: number; y: number } | null>(null);

  const { graph, isLoading, syncTopics, reviewQueue, refetch } = useCognitiveGraph();

  const handleSync = () => {
    syncTopics.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(`${data?.synced || 0} conceitos sincronizados com IA!`);
        refetch();
      },
      onError: () => toast.error("Erro ao sincronizar conceitos"),
    });
  };

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !graph) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;

    if (nodesRef.current.length !== graph.nodes.length) {
      nodesRef.current = buildVisGraph(graph.nodes, graph.edges, w, h);
    } else {
      // Update mastery/retention without rebuilding positions
      nodesRef.current.forEach(vn => {
        const cn = graph.nodes.find(n => n.id === vn.id);
        if (cn) {
          const state = cn.cognitive_states?.[0];
          vn.mastery = state?.p_mastery ?? 0.1;
          vn.retention = state?.retention_score ?? 1;
        }
      });
    }

    const onMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onClick = () => {
      if (hoveredRef.current) {
        const cn = graph.nodes.find(n => n.id === hoveredRef.current);
        if (cn) setSelectedNode(cn);
      } else {
        setSelectedNode(null);
      }
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
      hoveredRef.current = null;
      setTooltip(null);
    };

    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mouseleave", onLeave);

    const draw = () => {
      const nodes = nodesRef.current;
      const edges = graph.edges;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Force simulation
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 200) {
            const force = 600 / (dist * dist);
            nodes[i].vx += (dx / dist) * force;
            nodes[i].vy += (dy / dist) * force;
            nodes[j].vx -= (dx / dist) * force;
            nodes[j].vy -= (dy / dist) * force;
          }
        }
      }

      edges.forEach(edge => {
        const a = nodes.find(n => n.id === edge.source_node_id);
        const b = nodes.find(n => n.id === edge.target_node_id);
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ideal = 120;
        const force = (dist - ideal) * 0.003;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      });

      nodes.forEach(n => {
        n.vx += (cx - n.x) * 0.0003;
        n.vy += (cy - n.y) * 0.0003;
        n.vx *= 0.92;
        n.vy *= 0.92;
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(n.radius + 5, Math.min(w - n.radius - 5, n.x));
        n.y = Math.max(n.radius + 5, Math.min(h - n.radius - 5, n.y));
      });

      // Hover detection
      let foundHover: string | null = null;
      for (const n of nodes) {
        const dx = mouseRef.current.x - n.x;
        const dy = mouseRef.current.y - n.y;
        if (dx * dx + dy * dy < (n.radius + 8) * (n.radius + 8)) {
          foundHover = n.id;
          break;
        }
      }
      if (foundHover !== hoveredRef.current) {
        hoveredRef.current = foundHover;
        if (foundHover) {
          const node = nodes.find(n => n.id === foundHover)!;
          setTooltip({ label: node.label, mastery: node.mastery, retention: node.retention, x: node.x, y: node.y });
        } else {
          setTooltip(null);
        }
      }
      canvas.style.cursor = foundHover ? "pointer" : "default";

      const highlightSet = new Set<string>();
      if (hoveredRef.current) {
        highlightSet.add(hoveredRef.current);
        edges.forEach(e => {
          if (e.source_node_id === hoveredRef.current) highlightSet.add(e.target_node_id);
          if (e.target_node_id === hoveredRef.current) highlightSet.add(e.source_node_id);
        });
      }
      const hasHighlight = highlightSet.size > 0;

      // Draw edges
      edges.forEach(edge => {
        const a = nodes.find(n => n.id === edge.source_node_id);
        const b = nodes.find(n => n.id === edge.target_node_id);
        if (!a || !b) return;
        const highlighted = highlightSet.has(edge.source_node_id) && highlightSet.has(edge.target_node_id);
        const alpha = hasHighlight ? (highlighted ? 0.5 : 0.05) : 0.12;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${masteryColor(Math.max(a.mastery, b.mastery))}, ${alpha})`;
        ctx.lineWidth = highlighted ? 1.5 : 0.5;
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach(n => {
        const isHovered = hoveredRef.current === n.id;
        const isConnected = highlightSet.has(n.id);
        const dimmed = hasHighlight && !isConnected;
        const r = n.radius * (isHovered ? 1.3 : 1);
        const color = masteryColor(n.mastery);

        // Glow
        if (!dimmed) {
          const gR = r * (isHovered ? 3.5 : 2);
          const grad = ctx.createRadialGradient(n.x, n.y, r * 0.3, n.x, n.y, gR);
          grad.addColorStop(0, `rgba(${color}, ${isHovered ? 0.3 : 0.1})`);
          grad.addColorStop(1, `rgba(${color}, 0)`);
          ctx.beginPath();
          ctx.arc(n.x, n.y, gR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Retention ring (outer ring showing retention decay)
        if (!dimmed && n.retention < 0.95) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * n.retention);
          ctx.strokeStyle = `rgba(${color}, 0.6)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${dimmed ? 0.05 : isHovered ? 0.4 : 0.2})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${color}, ${dimmed ? 0.1 : isHovered ? 1 : 0.5})`;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [graph]);

  const stats = graph?.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            Grafo Cognitivo Adaptativo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Seu gêmeo cognitivo digital — modelo matemático real da sua aprendizagem
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncTopics.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary-bg text-primary-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {syncTopics.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {syncTopics.isPending ? "Sincronizando..." : "Sincronizar Tópicos com IA"}
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Conceitos", value: stats.total_concepts, icon: Brain, color: "text-primary" },
            { label: "Domínio Médio", value: `${Math.round(stats.avg_mastery * 100)}%`, icon: TrendingUp, color: stats.avg_mastery >= 0.6 ? "text-success" : "text-warning" },
            { label: "Retenção Média", value: `${Math.round(stats.avg_retention * 100)}%`, icon: Target, color: stats.avg_retention >= 0.7 ? "text-success" : "text-destructive" },
            { label: "Dominados", value: stats.mastered_concepts, icon: Zap, color: "text-success" },
            { label: "Revisão Urgente", value: stats.pending_reviews, icon: AlertCircle, color: stats.pending_reviews > 5 ? "text-destructive" : "text-warning" },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl border border-border/50 bg-card/50">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className="text-xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Graph Canvas */}
        <div className="lg:col-span-3">
          <div
            ref={containerRef}
            className="relative w-full rounded-2xl border border-border/50 bg-card/30 overflow-hidden"
            style={{ aspectRatio: "16 / 10" }}
          >
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando grafo cognitivo...</span>
              </div>
            ) : graph && graph.nodes.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <Brain className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Seu grafo cognitivo está vazio</h3>
                <p className="text-muted-foreground text-sm max-w-md mb-4">
                  Adicione disciplinas e tópicos, ou faça upload de documentos na Biblioteca. 
                  Depois clique em "Sincronizar Tópicos com IA" para construir seu grafo automaticamente.
                </p>
              </div>
            ) : (
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            )}

            {/* HTML Labels */}
            {graph && graph.nodes.length > 0 && (
              <div className="absolute inset-0 pointer-events-none z-10">
                {nodesRef.current.map(vn => (
                  <span
                    key={vn.id}
                    className="absolute whitespace-nowrap select-none"
                    style={{
                      left: `${Math.round(vn.x)}px`,
                      top: `${Math.round(vn.y + vn.radius + 8)}px`,
                      transform: "translateX(-50%)",
                      color: `rgba(${masteryColor(vn.mastery)}, 0.8)`,
                      fontSize: "10px",
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {vn.label}
                  </span>
                ))}
              </div>
            )}

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute pointer-events-none z-30 px-4 py-3 rounded-xl border border-border/50 bg-card/95 backdrop-blur-md shadow-xl animate-fade-in"
                style={{
                  left: `${Math.min(Math.max(tooltip.x + 20, 10), (containerRef.current?.getBoundingClientRect().width || 600) - 240)}px`,
                  top: `${Math.max(tooltip.y - 40, 10)}px`,
                }}
              >
                <p className="text-xs font-semibold text-foreground mb-1">{tooltip.label}</p>
                <div className="flex gap-3 text-[10px]">
                  <span>Domínio: <strong style={{ color: `rgb(${masteryColor(tooltip.mastery)})` }}>{Math.round(tooltip.mastery * 100)}%</strong></span>
                  <span>Retenção: <strong>{Math.round(tooltip.retention * 100)}%</strong></span>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[10px] text-muted-foreground z-20">
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: "rgb(248, 113, 113)" }} /> Baixo</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: "rgb(251, 146, 60)" }} /> Médio</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: "rgb(250, 204, 21)" }} /> Bom</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: "rgb(74, 222, 128)" }} /> Dominado</div>
            </div>

            <div className="absolute top-4 right-4 text-[10px] text-muted-foreground font-mono z-20">
              {graph?.nodes.length || 0} nós · {graph?.edges.length || 0} arestas · BKT + Ebbinghaus
            </div>
          </div>
        </div>

        {/* Sidebar: Selected node details or Review Queue */}
        <div className="space-y-4">
          {selectedNode ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-xl border border-border/50 bg-card/50"
            >
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                {selectedNode.name}
              </h3>
              {selectedNode.description && (
                <p className="text-xs text-muted-foreground mb-3">{selectedNode.description}</p>
              )}
              {(() => {
                const s = selectedNode.cognitive_states?.[0];
                if (!s) return null;
                return (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">P(Domínio)</span><span className="font-mono font-bold" style={{ color: `rgb(${masteryColor(s.p_mastery)})` }}>{(s.p_mastery * 100).toFixed(1)}%</span></div>
                    <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.p_mastery * 100}%`, background: `rgb(${masteryColor(s.p_mastery)})` }} />
                    </div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Retenção</span><span className="font-mono">{(s.retention_score * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Estabilidade</span><span className="font-mono">{s.stability.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">P(Aprender)</span><span className="font-mono">{(s.p_learn * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">P(Acaso)</span><span className="font-mono">{(s.p_guess * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">P(Deslize)</span><span className="font-mono">{(s.p_slip * 100).toFixed(1)}%</span></div>
                    <div className="border-t border-border/30 pt-2 mt-2">
                      <div className="flex justify-between"><span className="text-muted-foreground">Revisões</span><span>{s.review_count}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Acertos</span><span className="text-success">{s.correct_count}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Erros</span><span className="text-destructive">{s.incorrect_count}</span></div>
                    </div>
                  </div>
                );
              })()}
              <button
                onClick={() => setSelectedNode(null)}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground transition"
              >
                ← Voltar à fila de revisão
              </button>
            </motion.div>
          ) : (
            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Fila de Revisão Adaptativa
              </h3>
              {reviewQueue.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma revisão pendente. Sincronize seus tópicos para começar.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {reviewQueue.slice(0, 10).map((item: any) => (
                    <div key={item.concept_node_id} className="p-2 rounded-lg bg-muted/20 border border-border/30">
                      <div className="text-xs font-medium">{item.concept_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.p_mastery * 100}%`,
                              background: `rgb(${masteryColor(item.p_mastery)})`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {Math.round(item.p_mastery * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>Ret: {Math.round(item.current_retention * 100)}%</span>
                        <span className={`font-medium ${item.priority > 0.6 ? "text-destructive" : item.priority > 0.4 ? "text-warning" : "text-muted-foreground"}`}>
                          Prioridade: {Math.round(item.priority * 100)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
