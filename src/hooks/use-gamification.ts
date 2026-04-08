import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

const XP_PER_LEVEL = 500;

export const BADGE_DEFINITIONS = [
  { key: "first_session", name: "Primeira Sessão", description: "Completou sua primeira sessão de estudo", icon: "rocket" },
  { key: "streak_3", name: "3 Dias Seguidos", description: "Estudou 3 dias consecutivos", icon: "flame" },
  { key: "streak_7", name: "Semana Perfeita", description: "Estudou 7 dias consecutivos", icon: "fire" },
  { key: "streak_30", name: "Mês Inabalável", description: "Estudou 30 dias consecutivos", icon: "crown" },
  { key: "flashcards_50", name: "Mestre dos Cards", description: "Revisou 50 flashcards", icon: "layers" },
  { key: "flashcards_200", name: "Guru dos Flashcards", description: "Revisou 200 flashcards", icon: "sparkles" },
  { key: "questions_25", name: "Questionador", description: "Respondeu 25 questões", icon: "help-circle" },
  { key: "questions_100", name: "Expert em Questões", description: "Respondeu 100 questões", icon: "award" },
  { key: "level_5", name: "Ascensão", description: "Alcançou o nível 5", icon: "trending-up" },
  { key: "level_10", name: "Veterano", description: "Alcançou o nível 10", icon: "star" },
  { key: "xp_1000", name: "Milhar de XP", description: "Acumulou 1.000 XP", icon: "zap" },
  { key: "xp_5000", name: "Lenda", description: "Acumulou 5.000 XP", icon: "trophy" },
] as const;

export type XpEventType =
  | "study_session"
  | "flashcard_review"
  | "question_answer"
  | "review_complete"
  | "streak_bonus"
  | "badge_earned";

export function useGamificationProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gamification", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("gamification_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!data) {
        // Auto-create profile
        const { data: created } = await supabase
          .from("gamification_profiles")
          .insert({ user_id: user!.id })
          .select()
          .single();
        return created;
      }
      return data;
    },
    enabled: !!user,
  });
}

export function useBadges() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["badges", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("badges")
        .select("*")
        .eq("user_id", user!.id)
        .order("earned_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useXpHistory(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["xp-events", user?.id, limit],
    queryFn: async () => {
      const { data } = await supabase
        .from("xp_events")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useAwardXp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ amount, eventType, description }: { amount: number; eventType: XpEventType; description: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Record XP event
      await supabase.from("xp_events").insert({
        user_id: user.id,
        xp_amount: amount,
        event_type: eventType,
        description,
      });

      // Get current profile
      const { data: profile } = await supabase
        .from("gamification_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const newXp = profile.xp + amount;
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
      const leveledUp = newLevel > profile.level;

      // Update streak
      const today = new Date().toISOString().split("T")[0];
      const lastDate = profile.last_activity_date;
      let streakDays = profile.streak_days;

      if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (lastDate === yesterdayStr) {
          streakDays += 1;
        } else if (lastDate !== today) {
          streakDays = 1;
        }
      }

      const longestStreak = Math.max(profile.longest_streak, streakDays);

      await supabase.from("gamification_profiles").update({
        xp: newXp,
        level: newLevel,
        streak_days: streakDays,
        longest_streak: longestStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);

      // Check badges
      const newBadges: typeof BADGE_DEFINITIONS[number][] = [];
      const { data: existingBadges } = await supabase
        .from("badges")
        .select("badge_key")
        .eq("user_id", user.id);
      const earned = new Set(existingBadges?.map(b => b.badge_key) ?? []);

      if (streakDays >= 3 && !earned.has("streak_3")) newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "streak_3")!);
      if (streakDays >= 7 && !earned.has("streak_7")) newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "streak_7")!);
      if (streakDays >= 30 && !earned.has("streak_30")) newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "streak_30")!);
      if (newLevel >= 5 && !earned.has("level_5")) newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "level_5")!);
      if (newLevel >= 10 && !earned.has("level_10")) newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "level_10")!);
      if (newXp >= 1000 && !earned.has("xp_1000")) newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "xp_1000")!);
      if (newXp >= 5000 && !earned.has("xp_5000")) newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "xp_5000")!);

      // Check activity-based badges
      if (eventType === "study_session" && !earned.has("first_session")) {
        newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "first_session")!);
      }

      if (eventType === "flashcard_review") {
        const { count } = await supabase.from("flashcard_reviews").select("*", { count: "exact", head: true }).eq("user_id", user.id);
        if ((count ?? 0) >= 50 && !earned.has("flashcards_50")) newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "flashcards_50")!);
        if ((count ?? 0) >= 200 && !earned.has("flashcards_200")) newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "flashcards_200")!);
      }

      if (eventType === "question_answer") {
        const { count } = await supabase.from("question_attempts").select("*", { count: "exact", head: true }).eq("user_id", user.id);
        if ((count ?? 0) >= 25 && !earned.has("questions_25")) newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "questions_25")!);
        if ((count ?? 0) >= 100 && !earned.has("questions_100")) newBadges.push(BADGE_DEFINITIONS.find(b => b.key === "questions_100")!);
      }

      // Insert new badges
      if (newBadges.length > 0) {
        await supabase.from("badges").insert(
          newBadges.map(b => ({
            user_id: user.id,
            badge_key: b.key,
            badge_name: b.name,
            badge_description: b.description,
            badge_icon: b.icon,
          }))
        );
      }

      return { leveledUp, newLevel, newXp, newBadges };
    },
    onSuccess: (result) => {
      if (!result) return;
      queryClient.invalidateQueries({ queryKey: ["gamification"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["xp-events"] });

      if (result.leveledUp) {
        toast({
          title: `🎉 Nível ${result.newLevel}!`,
          description: "Parabéns! Você subiu de nível!",
        });
      }
      if (result.newBadges.length > 0) {
        result.newBadges.forEach(b => {
          toast({
            title: `🏆 Badge desbloqueado!`,
            description: b.name + " — " + b.description,
          });
        });
      }
    },
  });
}
