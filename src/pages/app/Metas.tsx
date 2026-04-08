import { Target, Flame, TrendingUp, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useConsistencyMetrics, useStudySessions } from "@/hooks/use-cognitive-engine";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function MetasPage() {
  const { user } = useAuth();
  const { data: consistency } = useConsistencyMetrics();
  const { data: sessions } = useStudySessions(7);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", targetHours: "20", targetAccuracy: "80" });

  const { data: goals } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("goals").select("*").eq("user_id", user!.id).eq("active", true);
      return data ?? [];
    },
    enabled: !!user,
  });

  const streak = consistency?.streakDays ?? 0;
  const weeklyHours = consistency?.weeklyStudyHours ?? 0;
  const weeklyQuestions = sessions?.reduce((s: number, sess: any) => s + (sess.questions_attempted ?? 0), 0) ?? 0;
  const weeklyCorrect = sessions?.reduce((s: number, sess: any) => s + (sess.questions_correct ?? 0), 0) ?? 0;
  const weeklyAccuracy = weeklyQuestions > 0 ? Math.round((weeklyCorrect / weeklyQuestions) * 100) : 0;

  const goalMetrics = goals?.map((g: any) => {
    if (g.title.toLowerCase().includes("hora")) {
      return { ...g, current: Math.round(weeklyHours * 10) / 10, target: g.target_hours_weekly ?? 20, unit: "h" };
    }
    if (g.title.toLowerCase().includes("acerto") || g.title.toLowerCase().includes("accuracy")) {
      return { ...g, current: weeklyAccuracy, target: g.target_accuracy ?? 80, unit: "%" };
    }
    return { ...g, current: weeklyQuestions, target: g.target_hours_weekly ?? 100, unit: "" };
  }) ?? [];

  // Build 28-day consistency calendar
  const calendarDays = Array.from({ length: 28 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    const dateStr = date.toISOString().split("T")[0];
    const studied = sessions?.some((s: any) => s.started_at?.startsWith(dateStr)) ?? false;
    return { day: date.getDate(), studied };
  });

  const handleCreate = async () => {
    if (!user || !newGoal.title.trim()) return;
    await supabase.from("goals").insert({
      user_id: user.id,
      title: newGoal.title.trim(),
      target_hours_weekly: parseFloat(newGoal.targetHours) || 20,
      target_accuracy: parseFloat(newGoal.targetAccuracy) || 80,
    });
    setNewGoal({ title: "", targetHours: "20", targetAccuracy: "80" });
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["goals"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Metas e Consistência</h1>
          <p className="text-muted-foreground text-sm">Acompanhe suas metas semanais e sequência de estudos.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><Plus className="h-4 w-4 mr-2" />Nova Meta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Meta</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input placeholder="Ex: Horas semanais" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Horas/semana</Label><Input type="number" value={newGoal.targetHours} onChange={(e) => setNewGoal({ ...newGoal, targetHours: e.target.value })} /></div>
                <div className="space-y-2"><Label>Meta acerto %</Label><Input type="number" value={newGoal.targetAccuracy} onChange={(e) => setNewGoal({ ...newGoal, targetAccuracy: e.target.value })} /></div>
              </div>
              <Button variant="hero" onClick={handleCreate} className="w-full">Criar meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl gradient-primary-bg flex items-center justify-center">
          <Flame className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <div className="text-3xl font-bold">{streak} dias</div>
          <div className="text-sm text-muted-foreground">Sequência atual de estudos 🔥</div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Metas Semanais</h2>
        {goalMetrics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma meta cadastrada. Crie sua primeira meta!</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {goalMetrics.map((g: any) => {
              const pct = Math.min(100, Math.round((g.current / g.target) * 100));
              return (
                <div key={g.id} className="p-4 rounded-xl border border-border/50 bg-card/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{g.title}</span>
                    <span className="text-xs text-muted-foreground">{g.current}{g.unit} / {g.target}{g.unit}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">{pct}% concluído</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Calendário de Consistência — Últimos 28 dias</h2>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((d, i) => (
            <div
              key={i}
              className={`h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                d.studied ? "gradient-primary-bg text-primary-foreground" : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {d.day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
