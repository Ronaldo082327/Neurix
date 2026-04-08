import { Zap, CheckCircle2, Circle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePendingReviews, useCompleteReview } from "@/hooks/use-cognitive-engine";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

const mockReviews = [
  { id: "m1", topic: "Princípios da Administração Pública", discipline: "Dir. Administrativo", dueDate: "Hoje", status: "pending" as const },
  { id: "m2", topic: "Direitos Fundamentais — Art. 5°", discipline: "Dir. Constitucional", dueDate: "Hoje", status: "pending" as const },
  { id: "m3", topic: "Concordância Verbal e Nominal", discipline: "Português", dueDate: "Hoje", status: "done" as const },
  { id: "m4", topic: "Lógica Proposicional — Tabelas Verdade", discipline: "Raciocínio Lógico", dueDate: "Amanhã", status: "pending" as const },
];

export default function RevisoesPage() {
  const { user } = useAuth();
  const { data: pendingReviews } = usePendingReviews();
  const completeReview = useCompleteReview();

  const reviews = pendingReviews?.length
    ? pendingReviews.map(r => {
        const scheduledDate = new Date(r.scheduled_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        let dueDate = "Em breve";
        if (scheduledDate < tomorrow) dueDate = "Hoje";
        else if (scheduledDate < new Date(tomorrow.getTime() + 86400000)) dueDate = "Amanhã";
        
        return {
          id: r.id,
          topic: (r.topics as any)?.name ?? "Tópico",
          discipline: (r.topics as any)?.disciplines?.name ?? "Disciplina",
          dueDate,
          status: r.status as "pending" | "done",
        };
      })
    : mockReviews;

  const pendingCount = reviews.filter(r => r.status === "pending").length;
  const doneCount = reviews.filter(r => r.status === "done").length;

  const nav = useNavigate();

  const handleReview = (reviewId: string, topicId?: string) => {
    if (!user) return;
    // Navigate to interactive review session
    const params = new URLSearchParams({ reviewId });
    if (topicId) params.set("topicId", topicId);
    nav(`/app/revisoes/sessao?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Fila de Revisões</h1>
        <p className="text-muted-foreground text-sm">Conteúdos que precisam ser revisados com base na repetição espaçada.</p>
      </div>

      <div className="flex gap-4">
        <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 flex items-center gap-3">
          <Zap className="h-5 w-5 text-warning" />
          <div>
            <div className="font-semibold text-sm">{pendingCount} revisões pendentes</div>
            <div className="text-xs text-muted-foreground">{doneCount} concluída(s) · {pendingCount} pendente(s)</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
            r.status === "done" ? "border-success/20 bg-success/5" : "border-border/50 bg-card/50"
          }`}>
            {r.status === "done" ? (
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className={`text-sm font-medium ${r.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                {r.topic}
              </div>
              <div className="text-xs text-muted-foreground">{r.discipline}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {r.dueDate}
              </span>
              {r.status !== "done" && (
                <Button
                  variant="hero-outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleReview(r.id, (pendingReviews?.find(pr => pr.id === r.id) as any)?.topic_id)}
                  disabled={completeReview.isPending}
                >
                  Revisar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
