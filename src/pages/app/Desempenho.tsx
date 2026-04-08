import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useDisciplines, useCognitiveMetrics, useStudySessions } from "@/hooks/use-cognitive-engine";

export default function DesempenhoPage() {
  const { user } = useAuth();
  const { data: disciplines } = useDisciplines();
  const { data: metrics } = useCognitiveMetrics(42);
  const { data: sessions } = useStudySessions(30);

  // Build radar data from real disciplines
  const radarData = disciplines?.length
    ? disciplines.map((d: any) => {
        const topics = d.topics ?? [];
        const avg = topics.length
          ? topics.reduce((s: number, t: any) => s + (t.mastery_score ?? 0), 0) / topics.length
          : 0;
        return { subject: d.name.length > 15 ? d.name.slice(0, 15) + "…" : d.name, score: Math.round(avg) };
      })
    : [
        { subject: "Dir. Constitucional", score: 0 },
        { subject: "Português", score: 0 },
        { subject: "R. Lógico", score: 0 },
      ];

  // Build weekly evolution from metrics
  const evolutionData = metrics?.length
    ? metrics.slice(-6).map((m: any, i: number) => ({
        sem: `Sem ${i + 1}`,
        acerto: Math.round(m.accuracy_rate ?? 0),
      }))
    : Array.from({ length: 6 }, (_, i) => ({ sem: `Sem ${i + 1}`, acerto: 0 }));

  // Stats
  const totalQuestions = sessions?.reduce((s: number, sess: any) => s + (sess.questions_attempted ?? 0), 0) ?? 0;
  const totalCorrect = sessions?.reduce((s: number, sess: any) => s + (sess.questions_correct ?? 0), 0) ?? 0;
  const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const worstDiscipline = radarData.length
    ? radarData.reduce((prev: any, curr: any) => curr.score < prev.score ? curr : prev)
    : { subject: "—", score: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Desempenho</h1>
        <p className="text-muted-foreground text-sm">Análise detalhada da sua evolução.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          <div className="text-xs text-muted-foreground mb-1">Total de questões</div>
          <div className="text-2xl font-bold">{totalQuestions.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-xs text-primary mt-1"><TrendingUp className="h-3 w-3" /> últimos 30 dias</div>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          <div className="text-xs text-muted-foreground mb-1">Taxa de acerto geral</div>
          <div className="text-2xl font-bold">{accuracyRate}%</div>
          <div className="flex items-center gap-1 text-xs text-success mt-1"><TrendingUp className="h-3 w-3" /> {totalCorrect} corretas</div>
        </div>
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          <div className="text-xs text-muted-foreground mb-1">Disciplina mais fraca</div>
          <div className="text-2xl font-bold">{worstDiscipline.subject}</div>
          <div className="flex items-center gap-1 text-xs text-destructive mt-1"><TrendingDown className="h-3 w-3" /> {worstDiscipline.score}% domínio</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Perfil Cognitivo</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(200, 15%, 16%)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} />
              <Radar dataKey="score" stroke="hsl(168, 64%, 40%)" fill="hsl(168, 64%, 40%)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Evolução Semanal</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 15%, 16%)" />
              <XAxis dataKey="sem" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(200, 20%, 8%)", border: "1px solid hsl(200, 15%, 16%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }} />
              <Line type="monotone" dataKey="acerto" stroke="hsl(168, 64%, 40%)" strokeWidth={2} dot={{ fill: "hsl(168, 64%, 40%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
