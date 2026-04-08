import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import {
  recalculateAllTopics,
  processStudySession,
  completeReview,
  getConsistencyMetrics,
  getDailyRecommendations,
  getPendingReviews,
  getCoachContext,
} from "@/lib/cognitive-engine";
import { supabase } from "@/integrations/supabase/client";

export function usePendingReviews() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reviews", "pending", user?.id],
    queryFn: () => getPendingReviews(user!.id),
    enabled: !!user,
  });
}

export function useDailyRecommendations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: () => getDailyRecommendations(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useConsistencyMetrics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["consistency", user?.id],
    queryFn: () => getConsistencyMetrics(user!.id),
    enabled: !!user,
  });
}

export function useCoachContext() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coach-context", user?.id],
    queryFn: () => getCoachContext(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["topics", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("topics")
        .select("*, disciplines(name, color)")
        .eq("user_id", user!.id)
        .order("priority_score", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useDisciplines() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["disciplines", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("disciplines")
        .select("*, topics(id, mastery_score, retention_score, last_studied_at)")
        .eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useCognitiveMetrics(days = 7) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cognitive-metrics", user?.id, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data } = await supabase
        .from("cognitive_metrics")
        .select("*")
        .eq("user_id", user!.id)
        .gte("metric_date", since.toISOString().split("T")[0])
        .order("metric_date", { ascending: true });
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useStudySessions(days = 7) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["study-sessions", user?.id, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data } = await supabase
        .from("study_sessions")
        .select("*, topics(name), disciplines(name)")
        .eq("user_id", user!.id)
        .gte("started_at", since.toISOString())
        .order("started_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useCompleteReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ reviewId, quality }: { reviewId: string; quality: number }) =>
      completeReview(user!.id, reviewId, quality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["cognitive-metrics"] });
    },
  });
}

export function useRecordStudySession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      topicId: string;
      disciplineId: string;
      durationMinutes: number;
      questionsAttempted: number;
      questionsCorrect: number;
      notes?: string;
    }) => {
      const now = new Date();
      const started = new Date(now.getTime() - params.durationMinutes * 60 * 1000);

      await supabase.from("study_sessions").insert({
        user_id: user!.id,
        topic_id: params.topicId,
        discipline_id: params.disciplineId,
        started_at: started.toISOString(),
        ended_at: now.toISOString(),
        duration_minutes: params.durationMinutes,
        questions_attempted: params.questionsAttempted,
        questions_correct: params.questionsCorrect,
        notes: params.notes,
      });

      await processStudySession(
        user!.id,
        params.topicId,
        params.durationMinutes,
        params.questionsAttempted,
        params.questionsCorrect
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["consistency"] });
      queryClient.invalidateQueries({ queryKey: ["cognitive-metrics"] });
    },
  });
}
