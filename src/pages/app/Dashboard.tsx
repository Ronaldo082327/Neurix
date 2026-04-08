import { BarChart3, BookOpen, Clock, Target, TrendingUp, AlertCircle, Zap, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useConsistencyMetrics, useDailyRecommendations, usePendingReviews, useCognitiveMetrics, useDisciplines, useStudySessions } from "@/hooks/use-cognitive-engine";
import { CognitiveGraphWidget } from "@/components/app/CognitiveGraphWidget";
import { PomodoroWidget } from "@/components/app/PomodoroWidget";
import { GamificationWidget } from "@/components/app/GamificationWidget";
import { Link } from "react-router-dom";

function EmptyState({ icon: Icon, title, description, actionLabel, actionPath }: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4">
      <Icon className="h-8 w-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground/70 mb-3">{description}</p>
      {actionLabel && actionPath && (
        <Button variant="hero-outline" size="sm" asChild>
          <Link to={actionPath}>{actionLabel} <ArrowRight className="h-3 w-3 ml-1" /></Link>
        </Button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: consistency } = useConsistencyMetrics();
  const { data: recommendations } = useDailyRecommendations();
  const { data: pendingReviews } = usePendingReviews();
  const { data: metrics } = useCognitiveMetrics(7);
  const { data: disciplines } = useDisciplines();
  const { data: sessions } = useStudySessions(7);

  const hasSessions = sessions && sessions.length > 0;
  const hasDisciplines = disciplines && disciplines.length > 0;

  // Real stats only
  const weeklyHours = consistency?.weeklyStudyHours ?? 0;
  const activeDisciplines = disciplines?.length ?? 0;
  const streak = consistency?.streakDays ?? 0;
  const latestMetric = metrics?.length ? metrics[metrics.length - 1] : null;
  const accuracyRate = latestMetric?.accuracy_rate ?? 0;

  const stats = [
    { label: "Horas esta semana", value: `${Math.round(weeklyHours * 10) / 10}h`, icon: Clock },
    { label: "Disciplinas ativas", value: String(activeDisciplines), icon: BookOpen },
    { label: "Taxa de acerto", value: `${Math.round(accuracyRate)}%`, icon: TrendingUp },
    { label: "Sequência", value: streak > 0 ? `${streak} dias 🔥` : "0 dias", icon: Zap },
  ];

  // Build weekly chart from real sessions only
  const weeklyData = hasSessions
    ? (() => {
        const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const byDay: Record<string, number> = {};
        sessions.forEach(s => {
          const d = days[new Date(s.started_at).getDay()];
          byDay[d] = (byDay[d] || 0) + s.duration_minutes / 60;
        });
        return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(dia => ({
          dia,
          horas: Math.round((byDay[dia] || 0) * 10) / 10,
        }));
      })()
    : null;

  // Build discipline performance from real data only
  const disciplineData = hasDisciplines
    ? disciplines.map((d: any) => {
        const topics = d.topics ?? [];
        const avgMastery = topics.length
          ? topics.reduce((s: number, t: any) => s + (t.mastery_score ?? 0), 0) / topics.length
          : 0;
        return { name: d.name.length > 18 ? d.name.slice(0, 18) + "…" : d.name, acerto: Math.round(avgMastery) };
      }).slice(0, 5)
    : null;

  const todaySuggestions = recommendations?.length
    ? recommendations.map(r => `${r.topicName} — ${r.reason}`)
    : null;

  const displayName = user?.user_metadata?.display_name || "estudante";

  const reviewsList = pendingReviews?.length
    ? pendingReviews.map(r => ({
        topic: (r.topics as any)?.name ?? "Tópico",
        discipline: (r.topics as any)?.disciplines?.name ?? "Disciplina",
        urgency: r.interval_days <= 1 ? "alta" as const : r.interval_days <= 3 ? "média" as const : "baixa" as const,
      }))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Bom dia, {displayName}! 👋</h1>
        <p className="text-muted-foreground text-sm">
          {hasSessions
            ? "Aqui está o resumo da sua jornada de estudos."
            : "Comece sua jornada — crie disciplinas e inicie sua primeira sessão de estudo!"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border border-border/50 bg-card/50">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Horas de Estudo — Semana
          </h3>
          {weeklyData ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorHoras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Area type="monotone" dataKey="horas" stroke="hsl(var(--primary))" fill="url(#colorHoras)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={Clock}
              title="Sem sessões de estudo"
              description="Use o Pomodoro ou registre sessões para ver seu progresso aqui."
              actionLabel="Iniciar Pomodoro"
              actionPath="/app/pomodoro"
            />
          )}
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Sugestões para Hoje
          </h3>
          {todaySuggestions ? (
            <div className="space-y-3">
              {todaySuggestions.map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full gradient-primary-bg flex items-center justify-center text-xs text-primary-foreground font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{s}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Motor cognitivo aguardando dados"
              description="Adicione disciplinas e estude para receber recomendações personalizadas."
              actionLabel="Criar disciplinas"
              actionPath="/app/disciplinas"
            />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Desempenho por Disciplina
          </h3>
          {disciplineData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={disciplineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="acerto" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Sem disciplinas"
              description="Crie disciplinas para acompanhar seu desempenho."
              actionLabel="Adicionar"
              actionPath="/app/disciplinas"
            />
          )}
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            Revisões Pendentes
          </h3>
          {reviewsList ? (
            <div className="space-y-3">
              {reviewsList.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div>
                    <div className="text-sm font-medium">{r.topic}</div>
                    <div className="text-xs text-muted-foreground">{r.discipline}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    r.urgency === "alta" ? "bg-destructive/10 text-destructive"
                      : r.urgency === "média" ? "bg-warning/10 text-warning"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {r.urgency}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Zap}
              title="Sem revisões pendentes"
              description="Estude tópicos para gerar revisões automáticas."
            />
          )}
        </div>

        <GamificationWidget />
        <CognitiveGraphWidget />
        <PomodoroWidget />
      </div>
    </div>
  );
}
