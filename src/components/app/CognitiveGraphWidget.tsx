import { Brain, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useCognitiveGraph } from "@/hooks/use-cognitive-graph";

function masteryColor(mastery: number): string {
  if (mastery >= 0.8) return "rgb(74, 222, 128)";
  if (mastery >= 0.6) return "rgb(250, 204, 21)";
  if (mastery >= 0.4) return "rgb(251, 146, 60)";
  return "rgb(248, 113, 113)";
}

export function CognitiveGraphWidget() {
  const { graph, isLoading } = useCognitiveGraph();

  if (isLoading || !graph) {
    return (
      <div className="p-6 rounded-xl border border-border/50 bg-card/50 animate-pulse">
        <div className="h-4 w-32 bg-muted/30 rounded mb-4" />
        <div className="h-20 bg-muted/20 rounded" />
      </div>
    );
  }

  const { stats } = graph;
  if (stats.total_concepts === 0) return null;

  const masteryPercent = Math.round(stats.avg_mastery * 100);
  const retentionPercent = Math.round(stats.avg_retention * 100);

  return (
    <Link to="/app/grafo" className="block">
      <div className="p-6 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 transition-colors">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Grafo Cognitivo
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center">
            <div className="relative h-16 w-16 mx-auto mb-1">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(228, 15%, 18%)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke={masteryColor(stats.avg_mastery)}
                  strokeWidth="3"
                  strokeDasharray={`${masteryPercent} ${100 - masteryPercent}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {masteryPercent}%
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">Domínio</span>
          </div>
          <div className="text-center">
            <div className="relative h-16 w-16 mx-auto mb-1">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(228, 15%, 18%)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke={retentionPercent >= 70 ? "rgb(96, 165, 250)" : "rgb(248, 113, 113)"}
                  strokeWidth="3"
                  strokeDasharray={`${retentionPercent} ${100 - retentionPercent}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {retentionPercent}%
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">Retenção</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-sm font-bold">{stats.total_concepts}</div>
            <div className="text-[10px] text-muted-foreground">Conceitos</div>
          </div>
          <div>
            <div className="text-sm font-bold text-success">{stats.mastered_concepts}</div>
            <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5"><Zap className="h-2.5 w-2.5" /> Dominados</div>
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: stats.pending_reviews > 5 ? "rgb(248, 113, 113)" : "rgb(250, 204, 21)" }}>{stats.pending_reviews}</div>
            <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5"><AlertCircle className="h-2.5 w-2.5" /> Revisar</div>
          </div>
        </div>

        <div className="mt-3 text-center text-[10px] text-primary font-medium">
          Clique para visualizar o grafo completo →
        </div>
      </div>
    </Link>
  );
}
