import { useState } from "react";
import { Brain, CheckCircle2, XCircle, Sparkles, RotateCcw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useDisciplines } from "@/hooks/use-cognitive-engine";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: string;
  question_text: string;
  explanation: string | null;
  difficulty: number;
  discipline_id: string | null;
  topic_id: string | null;
  concept_node_id: string | null;
  options: { id: string; option_text: string; is_correct: boolean; option_order: number }[];
}

export default function QuestoesPage() {
  const { user } = useAuth();
  const { data: disciplines } = useDisciplines();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [disciplineFilter, setDisciplineFilter] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [generating, setGenerating] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", user?.id, disciplineFilter],
    queryFn: async () => {
      let query = supabase
        .from("questions")
        .select("id, question_text, explanation, difficulty, discipline_id, topic_id, concept_node_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (disciplineFilter !== "all") query = query.eq("discipline_id", disciplineFilter);
      const { data } = await query;
      if (!data?.length) return [];

      // Fetch options for all questions
      const qIds = data.map(q => q.id);
      const { data: opts } = await supabase
        .from("question_options")
        .select("*")
        .in("question_id", qIds)
        .order("option_order");

      return data.map(q => ({
        ...q,
        options: (opts ?? []).filter(o => o.question_id === q.id),
      })) as Question[];
    },
    enabled: !!user,
  });

  const submitAnswer = useMutation({
    mutationFn: async ({ questionId, optionId, isCorrect }: { questionId: string; optionId: string; isCorrect: boolean }) => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      await supabase.from("question_attempts").insert({
        user_id: user!.id,
        question_id: questionId,
        selected_option_id: optionId,
        is_correct: isCorrect,
        time_spent_seconds: timeSpent,
      });

      // Update cognitive state if concept_node_id exists
      const q = questions?.[currentIndex];
      if (q?.concept_node_id) {
        await supabase.functions.invoke("cognitive-graph", {
          body: {
            action: "record_interaction",
            concept_node_id: q.concept_node_id,
            interaction_type: "question",
            is_correct: isCorrect,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cognitive-graph"] });
    },
  });

  const generateQuestions = useMutation({
    mutationFn: async () => {
      setGenerating(true);
      const { data, error } = await supabase.functions.invoke("generate-study-content", {
        body: {
          type: "questions",
          discipline_id: disciplineFilter !== "all" ? disciplineFilter : undefined,
          count: 5,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast({ title: "Questões geradas!", description: "Novas questões foram criadas com base no seu grafo cognitivo." });
      setGenerating(false);
    },
    onError: (e) => {
      toast({ title: "Erro ao gerar questões", description: String(e), variant: "destructive" });
      setGenerating(false);
    },
  });

  const handleSelect = (optionId: string) => {
    if (answered) return;
    setSelectedOption(optionId);
  };

  const handleConfirm = () => {
    if (!selectedOption || !questions?.length) return;
    const q = questions[currentIndex];
    const opt = q.options.find(o => o.id === selectedOption);
    if (!opt) return;

    setAnswered(true);
    setSessionStats(prev => ({
      correct: prev.correct + (opt.is_correct ? 1 : 0),
      total: prev.total + 1,
    }));
    submitAnswer.mutate({ questionId: q.id, optionId: selectedOption, isCorrect: opt.is_correct });
  };

  const handleNext = () => {
    if (!questions) return;
    setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
    setSelectedOption(null);
    setAnswered(false);
    setStartTime(Date.now());
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswered(false);
    setSessionStats({ correct: 0, total: 0 });
    setStartTime(Date.now());
  };

  const currentQ = questions?.[currentIndex];
  const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Banco de Questões</h1>
          <p className="text-muted-foreground text-sm">Resolva questões e atualize seu modelo cognitivo em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {disciplines?.map((d: any) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="hero"
            size="sm"
            onClick={() => generateQuestions.mutate()}
            disabled={generating}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {generating ? "Gerando..." : "Gerar Questões"}
          </Button>
        </div>
      </div>

      {/* Session stats */}
      {sessionStats.total > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <Brain className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-medium">{sessionStats.correct}/{sessionStats.total} corretas · {accuracy}% de acerto</div>
            <Progress value={accuracy} className="h-2 mt-1" />
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando questões...</div>
      ) : !questions?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">Nenhuma questão encontrada</p>
          <p className="text-sm mb-4">Gere questões com IA baseadas no seu grafo cognitivo.</p>
          <Button variant="hero" onClick={() => generateQuestions.mutate()} disabled={generating}>
            <Sparkles className="h-4 w-4 mr-2" />
            {generating ? "Gerando..." : "Gerar Questões com IA"}
          </Button>
        </div>
      ) : currentQ ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Questão {currentIndex + 1} de {questions.length}</span>
              <Badge variant="outline">Dificuldade: {currentQ.difficulty}/5</Badge>
            </div>

            <Card className="p-6 border-border/50 bg-card/80">
              <p className="text-base font-medium leading-relaxed">{currentQ.question_text}</p>
            </Card>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === opt.id;
                const showResult = answered;
                const isCorrect = opt.is_correct;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    disabled={answered}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3",
                      !showResult && isSelected && "border-primary bg-primary/10",
                      !showResult && !isSelected && "border-border/50 bg-card/50 hover:border-primary/30",
                      showResult && isCorrect && "border-emerald-500/50 bg-emerald-500/10",
                      showResult && !isCorrect && isSelected && "border-destructive/50 bg-destructive/10",
                      showResult && !isCorrect && !isSelected && "border-border/30 bg-card/30 opacity-60"
                    )}
                  >
                    <span className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border",
                      !showResult && isSelected && "border-primary bg-primary text-primary-foreground",
                      !showResult && !isSelected && "border-border text-muted-foreground",
                      showResult && isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                      showResult && !isCorrect && isSelected && "border-destructive bg-destructive text-white",
                    )}>
                      {showResult && isCorrect ? <CheckCircle2 className="h-4 w-4" /> :
                       showResult && !isCorrect && isSelected ? <XCircle className="h-4 w-4" /> : letter}
                    </span>
                    <span className="text-sm">{opt.option_text}</span>
                  </button>
                );
              })}
            </div>

            {answered && currentQ.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-xl border border-primary/20 bg-primary/5"
              >
                <p className="text-sm font-medium text-primary mb-1">Explicação:</p>
                <p className="text-sm text-muted-foreground">{currentQ.explanation}</p>
              </motion.div>
            )}

            <div className="flex justify-end gap-3">
              {!answered ? (
                <Button variant="hero" onClick={handleConfirm} disabled={!selectedOption}>
                  Confirmar Resposta
                </Button>
              ) : (
                <Button variant="hero" onClick={handleNext} disabled={currentIndex >= questions.length - 1}>
                  Próxima Questão
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  );
}
