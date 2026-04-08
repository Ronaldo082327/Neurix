import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, ThumbsUp, ThumbsDown, Meh, Brain, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useCompleteReview } from "@/hooks/use-cognitive-engine";
import { useAwardXp } from "@/hooks/use-gamification";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ReviewStep = { type: "flashcard"; data: any } | { type: "question"; data: any; options: any[] };

export default function SessaoRevisaoPage() {
  const [searchParams] = useSearchParams();
  const reviewId = searchParams.get("reviewId");
  const topicId = searchParams.get("topicId");
  const navigate = useNavigate();
  const { user } = useAuth();
  const completeReview = useCompleteReview();
  const awardXp = useAwardXp();

  const [currentStep, setCurrentStep] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);

  // Fetch flashcards & questions for this topic
  const { data: steps, isLoading } = useQuery({
    queryKey: ["review-session", topicId],
    queryFn: async () => {
      const items: ReviewStep[] = [];

      // Get flashcards for the topic
      const { data: flashcards } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user!.id)
        .eq("topic_id", topicId!)
        .limit(5);

      flashcards?.forEach(f => items.push({ type: "flashcard", data: f }));

      // Get questions for the topic
      const { data: questions } = await supabase
        .from("questions")
        .select("*, question_options(*)")
        .eq("user_id", user!.id)
        .eq("topic_id", topicId!)
        .limit(5);

      questions?.forEach(q => items.push({
        type: "question",
        data: q,
        options: (q.question_options ?? []).sort((a: any, b: any) => a.option_order - b.option_order),
      }));

      // If no content exists, create a simple review-only step
      if (items.length === 0) {
        return null;
      }

      return items;
    },
    enabled: !!user && !!topicId,
  });

  const currentItem = steps?.[currentStep];
  const totalSteps = steps?.length ?? 0;
  const progress = totalSteps > 0 ? ((currentStep + (answered || flipped ? 1 : 0)) / totalSteps) * 100 : 0;

  const handleFlashcardRate = async (quality: number) => {
    if (!currentItem || currentItem.type !== "flashcard") return;

    // Update SM-2 for this flashcard
    const card = currentItem.data;
    let ef = Number(card.ease_factor);
    let interval = card.interval_days;
    let reps = card.repetitions;

    if (quality >= 3) {
      if (reps === 0) interval = 1;
      else if (reps === 1) interval = 6;
      else interval = Math.round(interval * ef);
      reps += 1;
    } else {
      reps = 0; interval = 1;
    }
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ef < 1.3) ef = 1.3;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    await supabase.from("flashcards").update({
      ease_factor: Math.round(ef * 100) / 100,
      interval_days: interval,
      repetitions: reps,
      next_review_at: nextReview.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    }).eq("id", card.id);

    setResults(prev => ({
      correct: prev.correct + (quality >= 3 ? 1 : 0),
      total: prev.total + 1,
    }));

    awardXp.mutate({ amount: 10, eventType: "flashcard_review", description: "Flashcard revisado na sessão" });

    advanceStep();
  };

  const handleQuestionAnswer = async (optionId: string) => {
    if (answered || !currentItem || currentItem.type !== "question") return;
    setSelectedOption(optionId);
    setAnswered(true);

    const isCorrect = currentItem.options.find((o: any) => o.id === optionId)?.is_correct ?? false;

    await supabase.from("question_attempts").insert({
      user_id: user!.id,
      question_id: currentItem.data.id,
      selected_option_id: optionId,
      is_correct: isCorrect,
    });

    setResults(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    awardXp.mutate({ amount: isCorrect ? 15 : 5, eventType: "question_answer", description: isCorrect ? "Resposta correta" : "Questão respondida" });
  };

  const advanceStep = () => {
    setFlipped(false);
    setAnswered(false);
    setSelectedOption(null);

    if (currentStep + 1 >= totalSteps) {
      finishSession();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const finishSession = async () => {
    setFinished(true);

    if (reviewId) {
      const quality = results.total > 0 ? Math.round((results.correct / results.total) * 5) : 3;
      completeReview.mutate({ reviewId, quality: Math.max(1, quality) });
    }

    awardXp.mutate({ amount: 25, eventType: "review_complete", description: "Sessão de revisão concluída" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Brain className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  // No content — quick review
  if (!steps) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/revisoes")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <div className="text-center py-12 space-y-4">
          <Brain className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <h2 className="text-xl font-bold">Sem material para este tópico</h2>
          <p className="text-muted-foreground text-sm">Gere flashcards ou questões primeiro para ter uma sessão interativa.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="hero" onClick={() => {
              if (reviewId) completeReview.mutate({ reviewId, quality: 4 });
              awardXp.mutate({ amount: 10, eventType: "review_complete", description: "Revisão rápida" });
              navigate("/app/revisoes");
            }}>
              Marcar como revisado
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Finished screen
  if (finished) {
    const pct = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12 space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-400" />
          <h2 className="text-2xl font-bold">Sessão Concluída! 🎉</h2>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="p-3 rounded-xl border border-border/50 bg-card/50">
              <div className="text-2xl font-bold text-primary">{results.total}</div>
              <div className="text-xs text-muted-foreground">Itens</div>
            </div>
            <div className="p-3 rounded-xl border border-border/50 bg-card/50">
              <div className="text-2xl font-bold text-emerald-400">{results.correct}</div>
              <div className="text-xs text-muted-foreground">Acertos</div>
            </div>
            <div className="p-3 rounded-xl border border-border/50 bg-card/50">
              <div className="text-2xl font-bold">{pct}%</div>
              <div className="text-xs text-muted-foreground">Taxa</div>
            </div>
          </div>
          <Button variant="hero" onClick={() => navigate("/app/revisoes")}>
            Voltar às Revisões
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/revisoes")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Sair
        </Button>
        <span className="text-sm text-muted-foreground">{currentStep + 1}/{totalSteps}</span>
      </div>

      <Progress value={progress} className="h-1.5" />

      <AnimatePresence mode="wait">
        <motion.div key={currentStep} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          {currentItem?.type === "flashcard" && (
            <div className="space-y-4">
              <Badge variant="outline" className="text-xs">Flashcard</Badge>
              <div style={{ perspective: "1000px" }}>
                <motion.div
                  className="relative w-full cursor-pointer"
                  style={{ minHeight: 260, transformStyle: "preserve-3d" }}
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.5 }}
                  onClick={() => setFlipped(!flipped)}
                >
                  <Card
                    className="absolute inset-0 p-8 flex flex-col items-center justify-center border-border/50 bg-card/80"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <p className="text-center text-lg font-medium">{currentItem.data.front_text}</p>
                    <p className="text-xs text-muted-foreground mt-4">Toque para virar</p>
                  </Card>
                  <Card
                    className="absolute inset-0 p-8 flex flex-col items-center justify-center border-primary/20 bg-primary/5"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <p className="text-center text-base">{currentItem.data.back_text}</p>
                  </Card>
                </motion.div>
              </div>
              {flipped && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-3">
                  <Button variant="outline" className="border-destructive/30 text-destructive" onClick={() => handleFlashcardRate(1)}>
                    <ThumbsDown className="h-4 w-4 mr-1" /> Errei
                  </Button>
                  <Button variant="outline" className="border-warning/30 text-warning" onClick={() => handleFlashcardRate(3)}>
                    <Meh className="h-4 w-4 mr-1" /> Difícil
                  </Button>
                  <Button variant="outline" className="border-emerald-500/30 text-emerald-400" onClick={() => handleFlashcardRate(5)}>
                    <ThumbsUp className="h-4 w-4 mr-1" /> Fácil
                  </Button>
                </motion.div>
              )}
            </div>
          )}

          {currentItem?.type === "question" && (
            <div className="space-y-4">
              <Badge variant="outline" className="text-xs">Questão</Badge>
              <Card className="p-6 border-border/50 bg-card/80">
                <p className="text-sm font-medium leading-relaxed">{currentItem.data.question_text}</p>
              </Card>
              <div className="space-y-2">
                {currentItem.options.map((opt: any) => {
                  const isSelected = selectedOption === opt.id;
                  const showResult = answered;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleQuestionAnswer(opt.id)}
                      disabled={answered}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all text-sm",
                        showResult && opt.is_correct && "border-emerald-500/50 bg-emerald-500/10",
                        showResult && isSelected && !opt.is_correct && "border-destructive/50 bg-destructive/10",
                        !showResult && "border-border/50 bg-card/50 hover:border-primary/30 hover:bg-primary/5",
                        !showResult && isSelected && "border-primary/50 bg-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {showResult && opt.is_correct && <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                        {showResult && isSelected && !opt.is_correct && <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />}
                        <span>{opt.option_text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {answered && currentItem.data.explanation && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm text-muted-foreground">
                  <strong className="text-foreground">Explicação:</strong> {currentItem.data.explanation}
                </motion.div>
              )}
              {answered && (
                <div className="flex justify-center">
                  <Button variant="hero" onClick={advanceStep}>
                    {currentStep + 1 >= totalSteps ? "Finalizar" : "Próximo"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
