import { useState, useMemo } from "react";
import { Sparkles, RotateCcw, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Meh, Brain, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useDisciplines } from "@/hooks/use-cognitive-engine";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAwardXp } from "@/hooks/use-gamification";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function FlashcardsPage() {
  const { user } = useAuth();
  const { data: disciplines } = useDisciplines();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [disciplineFilter, setDisciplineFilter] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const awardXp = useAwardXp();

  const { data: flashcards, isLoading } = useQuery({
    queryKey: ["flashcards", user?.id, disciplineFilter],
    queryFn: async () => {
      let query = supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user!.id)
        .lte("next_review_at", new Date().toISOString())
        .order("next_review_at", { ascending: true })
        .limit(50);
      if (disciplineFilter !== "all") query = query.eq("discipline_id", disciplineFilter);
      const { data } = await query;
      return data ?? [];
    },
    enabled: !!user,
  });

  const reviewFlashcard = useMutation({
    mutationFn: async ({ flashcardId, quality }: { flashcardId: string; quality: number }) => {
      // SM-2 algorithm
      const card = flashcards?.find(f => f.id === flashcardId);
      if (!card) return;

      let ef = Number(card.ease_factor);
      let interval = card.interval_days;
      let reps = card.repetitions;

      if (quality >= 3) {
        if (reps === 0) interval = 1;
        else if (reps === 1) interval = 6;
        else interval = Math.round(interval * ef);
        reps += 1;
      } else {
        reps = 0;
        interval = 1;
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
      }).eq("id", flashcardId);

      await supabase.from("flashcard_reviews").insert({
        user_id: user!.id,
        flashcard_id: flashcardId,
        quality_rating: quality,
      });

      // Update cognitive graph if linked
      if (card.concept_node_id) {
        await supabase.functions.invoke("cognitive-graph", {
          body: {
            action: "record_interaction",
            concept_node_id: card.concept_node_id,
            interaction_type: "flashcard_review",
            is_correct: quality >= 3,
          },
        });
      }
    },
    onSuccess: (_, { flashcardId, quality }) => {
      setReviewedIds(prev => new Set(prev).add(flashcardId));
      queryClient.invalidateQueries({ queryKey: ["cognitive-graph"] });
      awardXp.mutate({ amount: quality >= 3 ? 10 : 5, eventType: "flashcard_review", description: "Flashcard revisado" });
    },
  });

  const generateFlashcards = useMutation({
    mutationFn: async () => {
      setGenerating(true);
      const { data, error } = await supabase.functions.invoke("generate-study-content", {
        body: {
          type: "flashcards",
          discipline_id: disciplineFilter !== "all" ? disciplineFilter : undefined,
          count: 10,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      toast({ title: "Flashcards gerados!", description: "Novos flashcards criados com base no seu grafo cognitivo." });
      setGenerating(false);
    },
    onError: (e) => {
      toast({ title: "Erro ao gerar flashcards", description: String(e), variant: "destructive" });
      setGenerating(false);
    },
  });

  const handleRate = (quality: number) => {
    const card = flashcards?.[currentIndex];
    if (!card) return;
    reviewFlashcard.mutate({ flashcardId: card.id, quality });
    setFlipped(false);
    setTimeout(() => {
      if (flashcards && currentIndex < flashcards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  };

  const pendingCards = flashcards?.filter(f => !reviewedIds.has(f.id)) ?? [];
  const currentCard = flashcards?.[currentIndex];
  const isReviewed = currentCard ? reviewedIds.has(currentCard.id) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Flashcards</h1>
          <p className="text-muted-foreground text-sm">Revisão espaçada com algoritmo SM-2 integrado ao motor cognitivo.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={disciplineFilter} onValueChange={(v) => { setDisciplineFilter(v); setCurrentIndex(0); setFlipped(false); }}>
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
          <Button variant="hero" size="sm" onClick={() => generateFlashcards.mutate()} disabled={generating}>
            <Sparkles className="h-4 w-4 mr-2" />
            {generating ? "Gerando..." : "Gerar Flashcards"}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <Brain className="h-5 w-5 text-primary" />
        <div className="text-sm">
          <span className="font-medium">{flashcards?.length ?? 0}</span> cards para revisar ·{" "}
          <span className="font-medium text-emerald-400">{reviewedIds.size}</span> revisados nesta sessão
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando flashcards...</div>
      ) : !flashcards?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Brain className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-2">Nenhum flashcard para revisar</p>
          <p className="text-sm mb-4">Gere flashcards com IA ou aguarde até a próxima revisão agendada.</p>
          <Button variant="hero" onClick={() => generateFlashcards.mutate()} disabled={generating}>
            <Sparkles className="h-4 w-4 mr-2" />
            {generating ? "Gerando..." : "Gerar Flashcards com IA"}
          </Button>
        </div>
      ) : currentCard ? (
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground text-center">
            Card {currentIndex + 1} de {flashcards.length}
          </div>

          {/* Flashcard */}
          <div className="perspective-1000 mx-auto max-w-lg" style={{ perspective: "1000px" }}>
            <motion.div
              className="relative w-full cursor-pointer"
              style={{ minHeight: 280, transformStyle: "preserve-3d" }}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => setFlipped(!flipped)}
            >
              {/* Front */}
              <Card
                className={cn(
                  "absolute inset-0 p-8 flex flex-col items-center justify-center border-border/50 bg-card/80 backface-hidden",
                  flipped && "pointer-events-none"
                )}
                style={{ backfaceVisibility: "hidden" }}
              >
                <Badge variant="outline" className="mb-4 text-xs">FRENTE</Badge>
                <p className="text-center text-lg font-medium leading-relaxed">{currentCard.front_text}</p>
                <p className="text-xs text-muted-foreground mt-6">Toque para virar</p>
              </Card>

              {/* Back */}
              <Card
                className={cn(
                  "absolute inset-0 p-8 flex flex-col items-center justify-center border-primary/20 bg-primary/5 backface-hidden",
                  !flipped && "pointer-events-none"
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <Badge variant="outline" className="mb-4 text-xs border-primary/30 text-primary">VERSO</Badge>
                <p className="text-center text-base leading-relaxed">{currentCard.back_text}</p>
              </Card>
            </motion.div>
          </div>

          {/* Rating buttons */}
          {flipped && !isReviewed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center gap-3"
            >
              <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleRate(1)}>
                <ThumbsDown className="h-4 w-4 mr-2" />
                Não lembrei
              </Button>
              <Button variant="outline" className="border-warning/30 text-warning hover:bg-warning/10" onClick={() => handleRate(3)}>
                <Meh className="h-4 w-4 mr-2" />
                Difícil
              </Button>
              <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleRate(5)}>
                <ThumbsUp className="h-4 w-4 mr-2" />
                Fácil
              </Button>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setFlipped(false); }} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setCurrentIndex(Math.min((flashcards?.length ?? 1) - 1, currentIndex + 1)); setFlipped(false); }} disabled={currentIndex >= (flashcards?.length ?? 1) - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
