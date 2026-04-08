import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { title: "Sobre você", subtitle: "Conte-nos sobre sua preparação" },
  { title: "Seu concurso", subtitle: "Qual é o seu objetivo?" },
  { title: "Rotina de estudos", subtitle: "Como você se organiza?" },
  { title: "Pronto!", subtitle: "NEURIX está preparando tudo para você" },
];

const defaultDisciplines: Record<string, string[]> = {
  fiscal: ["Direito Constitucional", "Direito Administrativo", "Direito Tributário", "Contabilidade", "Português", "Raciocínio Lógico"],
  juridica: ["Direito Constitucional", "Direito Administrativo", "Direito Civil", "Direito Penal", "Processo Civil", "Português"],
  tribunais: ["Direito Constitucional", "Direito Administrativo", "Português", "Raciocínio Lógico", "Informática", "Legislação Específica"],
  policial: ["Direito Constitucional", "Direito Penal", "Direito Processual Penal", "Legislação Especial", "Português", "Raciocínio Lógico"],
  administrativa: ["Direito Constitucional", "Direito Administrativo", "Português", "Raciocínio Lógico", "Informática", "Administração Pública"],
  ti: ["Redes", "Segurança", "Banco de Dados", "Desenvolvimento", "Governança de TI", "Português"],
};

const disciplineColors = [
  "hsl(217, 91%, 60%)", "hsl(270, 60%, 55%)", "hsl(190, 95%, 55%)",
  "hsl(152, 69%, 46%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)",
  "hsl(280, 70%, 60%)", "hsl(200, 80%, 55%)",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    concurso: "", area: "", dataProva: "", horasDia: "", nivel: "", disciplinas: "", dificuldades: "",
  });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFinish = async () => {
    if (!user) { navigate("/login"); return; }
    setSaving(true);

    try {
      // Update profile
      const hoursMap: Record<string, number> = { "1-2": 1.5, "3-4": 3.5, "5-6": 5.5, "7-8": 7.5, "8+": 9 };
      await supabase.from("profiles").update({
        target_exam: data.concurso,
        exam_date: data.dataProva || null,
        daily_hours: hoursMap[data.horasDia] ?? 2,
        preparation_level: data.nivel || "iniciante",
        onboarding_completed: true,
      }).eq("user_id", user.id);

      // Create disciplines and topics
      const disciplineNames = data.disciplinas
        ? data.disciplinas.split(",").map(d => d.trim()).filter(Boolean)
        : defaultDisciplines[data.area] ?? defaultDisciplines.tribunais;

      for (let i = 0; i < disciplineNames.length; i++) {
        const { data: disc } = await supabase.from("disciplines").insert({
          user_id: user.id,
          name: disciplineNames[i],
          color: disciplineColors[i % disciplineColors.length],
          relevance: 1.0,
        }).select("id").single();

        if (disc) {
          // Create default topics for each discipline
          const topicNames = getDefaultTopics(disciplineNames[i]);
          if (topicNames.length) {
            await supabase.from("topics").insert(
              topicNames.map(name => ({
                user_id: user.id,
                discipline_id: disc.id,
                name,
                relevance: 1.0,
              }))
            );
          }
        }
      }

      // Create default goals
      await supabase.from("goals").insert([
        { user_id: user.id, title: "Horas de estudo semanal", target_hours_weekly: (hoursMap[data.horasDia] ?? 2) * 7, target_accuracy: 80 },
      ]);

      navigate("/app");
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Erro ao salvar dados. Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background neural-grid p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl gradient-primary-bg flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">NEURIX</span>
          </div>
          <div className="flex gap-2 justify-center mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 w-12 rounded-full transition-all ${i <= step ? "gradient-primary-bg" : "bg-muted"}`} />
            ))}
          </div>
          <h1 className="text-2xl font-bold mb-1">{steps[step].title}</h1>
          <p className="text-muted-foreground text-sm">{steps[step].subtitle}</p>
        </div>

        <div className="p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {step === 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Qual concurso deseja prestar?</Label>
                    <Input placeholder="Ex: Analista TRF, Auditor Fiscal..." value={data.concurso} onChange={(e) => setData({ ...data, concurso: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Área de interesse</Label>
                    <Select value={data.area} onValueChange={(v) => setData({ ...data, area: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiscal">Área Fiscal</SelectItem>
                        <SelectItem value="juridica">Área Jurídica</SelectItem>
                        <SelectItem value="tribunais">Tribunais</SelectItem>
                        <SelectItem value="policial">Área Policial</SelectItem>
                        <SelectItem value="administrativa">Área Administrativa</SelectItem>
                        <SelectItem value="ti">Tecnologia da Informação</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data prevista da prova (opcional)</Label>
                    <Input type="date" value={data.dataProva} onChange={(e) => setData({ ...data, dataProva: e.target.value })} />
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Horas disponíveis por dia para estudo</Label>
                    <Select value={data.horasDia} onValueChange={(v) => setData({ ...data, horasDia: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2">1 a 2 horas</SelectItem>
                        <SelectItem value="3-4">3 a 4 horas</SelectItem>
                        <SelectItem value="5-6">5 a 6 horas</SelectItem>
                        <SelectItem value="7-8">7 a 8 horas</SelectItem>
                        <SelectItem value="8+">Mais de 8 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de preparação atual</Label>
                    <Select value={data.nivel} onValueChange={(v) => setData({ ...data, nivel: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iniciante">Iniciante — começando agora</SelectItem>
                        <SelectItem value="intermediario">Intermediário — já estudo há algum tempo</SelectItem>
                        <SelectItem value="avancado">Avançado — preparação consistente</SelectItem>
                        <SelectItem value="revisao">Fase de revisão final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Principais disciplinas que está estudando</Label>
                    <Input placeholder="Ex: Direito Constitucional, Português, Raciocínio Lógico" value={data.disciplinas} onChange={(e) => setData({ ...data, disciplinas: e.target.value })} />
                    <p className="text-xs text-muted-foreground">Separe por vírgula. Deixe vazio para usar as disciplinas padrão da área selecionada.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Principais dificuldades</Label>
                    <Input placeholder="Ex: organização, falta de foco, disciplinas específicas..." value={data.dificuldades} onChange={(e) => setData({ ...data, dificuldades: e.target.value })} />
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-2xl gradient-neural-bg flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Tudo pronto!</h3>
                  <p className="text-muted-foreground text-sm mb-2">NEURIX analisou seu perfil e vai gerar um plano de estudos personalizado.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
            ) : <div />}
            {step < 3 ? (
              <Button variant="hero" onClick={() => setStep(step + 1)}>Próximo<ArrowRight className="h-4 w-4 ml-2" /></Button>
            ) : (
              <Button variant="hero" onClick={handleFinish} disabled={saving}>
                <Sparkles className="h-4 w-4 mr-2" />{saving ? "Salvando..." : "Acessar NEURIX"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getDefaultTopics(discipline: string): string[] {
  const map: Record<string, string[]> = {
    "Direito Constitucional": ["Princípios Fundamentais", "Direitos e Garantias Fundamentais", "Organização do Estado", "Poder Legislativo", "Poder Executivo", "Poder Judiciário", "Controle de Constitucionalidade", "Ordem Social"],
    "Direito Administrativo": ["Princípios da Administração", "Atos Administrativos", "Licitações e Contratos", "Servidores Públicos", "Responsabilidade Civil", "Serviços Públicos", "Controle da Administração"],
    "Português": ["Interpretação de Texto", "Concordância Verbal e Nominal", "Regência", "Crase", "Pontuação", "Redação Oficial", "Coesão e Coerência"],
    "Raciocínio Lógico": ["Proposições", "Lógica Proposicional", "Tabelas-Verdade", "Probabilidade", "Análise Combinatória", "Sequências", "Conjuntos"],
    "Direito Penal": ["Teoria do Crime", "Tipicidade", "Ilicitude", "Culpabilidade", "Crimes contra a Pessoa", "Crimes contra o Patrimônio", "Penas"],
    "Direito Civil": ["Parte Geral", "Obrigações", "Contratos", "Responsabilidade Civil", "Direitos Reais", "Família", "Sucessões"],
    "Informática": ["Sistemas Operacionais", "Redes", "Segurança da Informação", "Banco de Dados", "Office", "Internet"],
    "Legislação Específica": ["Lei 8.112", "Lei 8.666", "Lei 14.133", "Lei 9.784"],
    "Direito Tributário": ["Sistema Tributário Nacional", "Limitações ao Poder de Tributar", "Impostos", "Obrigação Tributária", "Crédito Tributário"],
    "Contabilidade": ["Patrimônio", "Balanço Patrimonial", "DRE", "Escrituração", "Análise de Balanços"],
  };
  return map[discipline] ?? [];
}
