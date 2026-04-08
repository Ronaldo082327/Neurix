import { useState } from "react";
import { Calendar, CheckCircle2, Circle, Clock, Plus, Sparkles, Brain, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useDisciplines, useDailyRecommendations } from "@/hooks/use-cognitive-engine";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function PlanoPage() {
  const { user } = useAuth();
  const { data: disciplines } = useDisciplines();
  const { data: recommendations, isLoading: loadingRecs } = useDailyRecommendations();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", disciplineId: "", time: "", duration: "60" });

  const today = new Date().toISOString().split("T")[0];

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["study-tasks", user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_tasks")
        .select("*, disciplines(name)")
        .eq("user_id", user!.id)
        .eq("scheduled_date", today)
        .order("scheduled_time", { ascending: true });
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleCreate = async () => {
    if (!user || !newTask.title.trim()) return;
    await supabase.from("study_tasks").insert({
      user_id: user.id,
      title: newTask.title.trim(),
      discipline_id: newTask.disciplineId || null,
      scheduled_date: today,
      scheduled_time: newTask.time || null,
      duration_minutes: parseInt(newTask.duration) || 60,
    });
    setNewTask({ title: "", disciplineId: "", time: "", duration: "60" });
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["study-tasks"] });
  };

  const toggleComplete = async (taskId: string, completed: boolean) => {
    await supabase.from("study_tasks").update({
      completed: !completed,
      completed_at: !completed ? new Date().toISOString() : null,
    }).eq("id", taskId);
    queryClient.invalidateQueries({ queryKey: ["study-tasks"] });
  };

  const applyRecommendation = useMutation({
    mutationFn: async (rec: { topicName: string; type: string }) => {
      if (!user) return;
      await supabase.from("study_tasks").insert({
        user_id: user.id,
        title: `${rec.type === "review" ? "📖 Revisar" : rec.type === "practice" ? "🔬 Praticar" : "📚 Estudar"}: ${rec.topicName}`,
        scheduled_date: today,
        duration_minutes: 45,
        source: "ai_engine",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-tasks"] });
      toast({ title: "Recomendação adicionada ao plano!" });
    },
  });

  const doneCount = tasks?.filter(t => t.completed).length ?? 0;
  const totalCount = tasks?.length ?? 0;
  const todayFormatted = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Plano de Estudos Adaptativo</h1>
          <p className="text-muted-foreground text-sm">Cronograma otimizado pelo motor cognitivo NEURIX.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><Plus className="h-4 w-4 mr-2" />Nova Tarefa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Tarefa de Estudo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input placeholder="Ex: Estudar Direitos Fundamentais" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Disciplina</Label>
                <Select value={newTask.disciplineId} onValueChange={(v) => setNewTask({ ...newTask, disciplineId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {disciplines?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input type="time" value={newTask.time} onChange={(e) => setNewTask({ ...newTask, time: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input type="number" value={newTask.duration} onChange={(e) => setNewTask({ ...newTask, duration: e.target.value })} />
                </div>
              </div>
              <Button variant="hero" onClick={handleCreate} className="w-full">Criar tarefa</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <Calendar className="h-5 w-5 text-primary" />
        <div>
          <div className="font-semibold text-sm capitalize">{todayFormatted}</div>
          <div className="text-xs text-muted-foreground">{totalCount} tarefas planejadas · {doneCount} concluídas</div>
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Recomendações do Motor Cognitivo</h2>
          </div>
          <div className="grid gap-2">
            {recommendations.slice(0, 5).map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-secondary/20 bg-secondary/5"
              >
                <TrendingUp className="h-4 w-4 text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{rec.topicName}</div>
                  <div className="text-xs text-muted-foreground">
                    {rec.type === "review" ? "Revisão urgente" : rec.type === "practice" ? "Praticar" : "Novo estudo"} · 45min
                  </div>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  P: {Math.round(rec.priority * 100)}%
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => applyRecommendation.mutate(rec)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : !tasks?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma tarefa para hoje.</p>
          <p className="text-sm">Crie uma tarefa ou aplique as recomendações acima.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((item: any) => (
            <div
              key={item.id}
              onClick={() => toggleComplete(item.id, item.completed)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                item.completed ? "border-emerald-500/20 bg-emerald-500/5" : "border-border/50 bg-card/50 hover:border-primary/30"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className={`text-sm font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>{item.title}</div>
                <div className="flex items-center gap-2">
                  {item.disciplines?.name && <span className="text-xs text-muted-foreground">{item.disciplines.name}</span>}
                  {item.source === "ai_engine" && <Badge variant="outline" className="text-xs h-4 px-1 border-primary/30 text-primary">IA</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {item.scheduled_time && (
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.scheduled_time.slice(0, 5)}</span>
                )}
                {item.duration_minutes && <span>{item.duration_minutes}min</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
