import { useState, useEffect, useCallback, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, Coffee, Brain, CheckCircle2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useDisciplines } from "@/hooks/use-cognitive-engine";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Phase = "work" | "short_break" | "long_break";

const PHASE_CONFIG: Record<Phase, { label: string; icon: typeof Timer; minutes: number }> = {
  work: { label: "Foco", icon: Brain, minutes: 25 },
  short_break: { label: "Pausa Curta", icon: Coffee, minutes: 5 },
  long_break: { label: "Pausa Longa", icon: Coffee, minutes: 15 },
};

const POMODOROS_BEFORE_LONG = 4;

export default function PomodoroPage() {
  const { user } = useAuth();
  const { data: disciplines } = useDisciplines();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState(PHASE_CONFIG.work.minutes * 60);
  const [running, setRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [totalWorkSeconds, setTotalWorkSeconds] = useState(0);
  const [sessionsLog, setSessionsLog] = useState<{ topic: string; discipline: string; minutes: number; time: string }[]>([]);

  const sessionStartRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedDiscipline = disciplines?.find((d: any) => d.id === selectedDisciplineId);
  const topics = (selectedDiscipline as any)?.topics ?? [];
  const totalMinutes = PHASE_CONFIG[phase].minutes;
  const progress = ((totalMinutes * 60 - secondsLeft) / (totalMinutes * 60)) * 100;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const recordSession = useCallback(async (durationSeconds: number) => {
    if (!user || !selectedTopicId || !selectedDisciplineId || durationSeconds < 60) return;

    const durationMinutes = Math.round(durationSeconds / 60);
    const now = new Date();
    const started = new Date(now.getTime() - durationSeconds * 1000);

    // Record study session
    await supabase.from("study_sessions").insert({
      user_id: user.id,
      topic_id: selectedTopicId,
      discipline_id: selectedDisciplineId,
      started_at: started.toISOString(),
      ended_at: now.toISOString(),
      duration_minutes: durationMinutes,
      notes: `Pomodoro #${completedPomodoros + 1}`,
    });

    // Record concept interaction via cognitive graph
    const { data: conceptNode } = await supabase
      .from("concept_nodes")
      .select("id")
      .eq("user_id", user.id)
      .eq("topic_id", selectedTopicId)
      .maybeSingle();

    if (conceptNode) {
      await supabase.functions.invoke("cognitive-graph", {
        body: {
          action: "record_interaction",
          concept_node_id: conceptNode.id,
          interaction_type: "study_session",
          is_correct: true,
          metadata: { source: "pomodoro", duration_minutes: durationMinutes },
        },
      });
    }

    // Update topic last_studied_at
    await supabase
      .from("topics")
      .update({ last_studied_at: now.toISOString() })
      .eq("id", selectedTopicId);

    const topicName = topics.find((t: any) => t.id === selectedTopicId)?.name ?? "Tópico";
    const discName = selectedDiscipline?.name ?? "Disciplina";

    setSessionsLog((prev) => [
      { topic: topicName, discipline: discName, minutes: durationMinutes, time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
      ...prev,
    ]);

    queryClient.invalidateQueries({ queryKey: ["study-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["topics"] });
    queryClient.invalidateQueries({ queryKey: ["cognitive-graph"] });
    queryClient.invalidateQueries({ queryKey: ["cognitive-metrics"] });
  }, [user, selectedTopicId, selectedDisciplineId, completedPomodoros, topics, selectedDiscipline, queryClient]);

  const completePhase = useCallback(async () => {
    if (phase === "work") {
      const workDuration = totalMinutes * 60;
      setTotalWorkSeconds((prev) => prev + workDuration);
      await recordSession(workDuration);

      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);

      toast({
        title: "🍅 Pomodoro concluído!",
        description: `${newCount}° pomodoro finalizado. Hora da pausa!`,
      });

      const nextPhase = newCount % POMODOROS_BEFORE_LONG === 0 ? "long_break" : "short_break";
      setPhase(nextPhase);
      setSecondsLeft(PHASE_CONFIG[nextPhase].minutes * 60);
    } else {
      toast({ title: "⏰ Pausa encerrada!", description: "Pronto para mais um pomodoro?" });
      setPhase("work");
      setSecondsLeft(PHASE_CONFIG.work.minutes * 60);
    }
    setRunning(false);
  }, [phase, completedPomodoros, totalMinutes, recordSession, toast]);

  // Timer tick
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          completePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, completePhase]);

  // Track work seconds in real-time
  useEffect(() => {
    if (running && phase === "work") {
      sessionStartRef.current = new Date();
    } else {
      sessionStartRef.current = null;
    }
  }, [running, phase]);

  const handleStart = () => {
    if (!selectedDisciplineId || !selectedTopicId) {
      toast({ title: "Selecione disciplina e tópico", description: "Escolha o que vai estudar antes de iniciar.", variant: "destructive" });
      return;
    }
    setRunning(true);
  };

  const handlePause = () => setRunning(false);

  const handleReset = () => {
    setRunning(false);
    setSecondsLeft(PHASE_CONFIG[phase].minutes * 60);
  };

  const handleSkip = () => {
    setRunning(false);
    completePhase();
  };

  const phaseColor = phase === "work" ? "text-primary" : phase === "short_break" ? "text-[hsl(var(--success))]" : "text-[hsl(var(--warning))]";
  const phaseRingColor = phase === "work" ? "stroke-primary" : phase === "short_break" ? "stroke-[hsl(152,69%,46%)]" : "stroke-[hsl(38,92%,50%)]";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Timer className="h-6 w-6 text-primary" />
          Pomodoro
        </h1>
        <p className="text-muted-foreground text-sm">Estude com foco usando o método Pomodoro. Sessões são registradas automaticamente.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phase indicator */}
          <div className="flex items-center gap-2 justify-center">
            {(["work", "short_break", "long_break"] as Phase[]).map((p) => (
              <button
                key={p}
                disabled={running}
                onClick={() => { setPhase(p); setSecondsLeft(PHASE_CONFIG[p].minutes * 60); setRunning(false); }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  phase === p ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {PHASE_CONFIG[p].label}
              </button>
            ))}
          </div>

          {/* Circular timer */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64">
              <svg viewBox="0 0 256 256" className="w-full h-full -rotate-90">
                <circle cx="128" cy="128" r="110" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                <circle
                  cx="128" cy="128" r="110" fill="none"
                  className={phaseRingColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 110}
                  strokeDashoffset={2 * Math.PI * 110 * (1 - progress / 100)}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-5xl font-mono font-bold", phaseColor)}>
                  {formatTime(secondsLeft)}
                </span>
                <span className="text-sm text-muted-foreground mt-1">{PHASE_CONFIG[phase].label}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            <Button variant="outline" size="icon" onClick={handleReset} disabled={secondsLeft === PHASE_CONFIG[phase].minutes * 60 && !running}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            {running ? (
              <Button variant="hero" size="lg" onClick={handlePause} className="px-8">
                <Pause className="h-5 w-5 mr-2" /> Pausar
              </Button>
            ) : (
              <Button variant="hero" size="lg" onClick={handleStart} className="px-8">
                <Play className="h-5 w-5 mr-2" /> {secondsLeft < PHASE_CONFIG[phase].minutes * 60 ? "Continuar" : "Iniciar"}
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleSkip}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Topic selection */}
          <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/50 bg-card/50">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Disciplina</label>
              <Select value={selectedDisciplineId} onValueChange={(v) => { setSelectedDisciplineId(v); setSelectedTopicId(""); }} disabled={running}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {disciplines?.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Tópico</label>
              <Select value={selectedTopicId} onValueChange={setSelectedTopicId} disabled={running || !selectedDisciplineId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {topics.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          {/* Pomodoro counter */}
          <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
            <h3 className="font-semibold text-sm">Sessão Atual</h3>
            <div className="flex items-center gap-2">
              {Array.from({ length: POMODOROS_BEFORE_LONG }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    i < completedPomodoros % POMODOROS_BEFORE_LONG || (completedPomodoros > 0 && completedPomodoros % POMODOROS_BEFORE_LONG === 0 && i < POMODOROS_BEFORE_LONG)
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i < completedPomodoros % POMODOROS_BEFORE_LONG || (completedPomodoros > 0 && completedPomodoros % POMODOROS_BEFORE_LONG === 0)
                    ? <CheckCircle2 className="h-4 w-4" />
                    : i + 1}
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              {completedPomodoros} pomodoro{completedPomodoros !== 1 ? "s" : ""} · {Math.round(totalWorkSeconds / 60)} min de foco
            </div>
          </div>

          {/* Session log */}
          <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
            <h3 className="font-semibold text-sm">Histórico de Hoje</h3>
            {sessionsLog.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma sessão registrada ainda.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sessionsLog.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{s.time}</span>
                    <span className="text-primary">🍅</span>
                    <span className="truncate">{s.topic}</span>
                    <span className="text-muted-foreground ml-auto">{s.minutes}min</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">💡 Método Pomodoro</p>
            <p>25 min de foco → 5 min de pausa</p>
            <p>A cada 4 pomodoros → 15 min de pausa longa</p>
            <p>Sessões são registradas automaticamente no grafo cognitivo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
