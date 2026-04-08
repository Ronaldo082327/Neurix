/**
 * NEURIX Cognitive Engine
 * Central module that orchestrates retention, mastery, priority, and spaced repetition.
 * 
 * Scientific foundations:
 * - Bayesian Knowledge Tracing (Corbett & Anderson, 1994)
 * - Ebbinghaus Forgetting Curve
 * - Hazard Function with fatigue and emotional state
 * - Confidence scoring and credibility intervals
 * - Priority optimization (70% knowledge gap + 30% uncertainty)
 */

import { supabase } from "@/integrations/supabase/client";
import {
  calculateRetention,
  calculateRetentionWithHazard,
  calculateMastery,
  calculatePriority,
  calculateConfidence,
  calculateCredibilityInterval,
  getNextReviewDate,
  bktProcessAnswers,
  calculateExpectedScore,
  calculateFatigue,
} from "./retention";
import {
  calculateStreak,
  calculateWeeklyHours,
  generateRecommendations,
  type DailyRecommendation,
  type ConsistencyMetrics,
} from "./consistency";

export type { DailyRecommendation, ConsistencyMetrics };
export {
  calculateConfidence,
  calculateCredibilityInterval,
  calculateExpectedScore,
  calculateFatigue,
  bktProcessAnswers,
};

// ─── Core Engine Functions ───

/** Recalculate all cognitive scores for a user's topics */
export async function recalculateAllTopics(userId: string) {
  const { data: topics } = await supabase
    .from("topics")
    .select("*, disciplines(name, relevance)")
    .eq("user_id", userId);

  if (!topics?.length) return;

  const now = new Date();
  const updates = topics.map(topic => {
    const lastStudied = topic.last_studied_at ? new Date(topic.last_studied_at) : null;
    const hoursSince = lastStudied
      ? (now.getTime() - lastStudied.getTime()) / (1000 * 60 * 60)
      : 720; // 30 days default

    const retention = calculateRetention(hoursSince, topic.review_count ?? 0, (topic.mastery_score ?? 0) / 100);
    const disciplineRelevance = (topic.disciplines as any)?.relevance ?? 1;
    const priority = calculatePriority(
      topic.mastery_score ?? 0,
      retention,
      disciplineRelevance * (topic.relevance ?? 1),
      hoursSince,
      topic.review_count ?? 0
    );

    return {
      id: topic.id,
      retention_score: Math.round(retention * 100) / 100,
      priority_score: Math.round(priority * 100) / 100,
    };
  });

  // Batch update
  for (const u of updates) {
    await supabase
      .from("topics")
      .update({ retention_score: u.retention_score, priority_score: u.priority_score })
      .eq("id", u.id);
  }
}

/** Process a completed study session — update mastery via BKT, schedule reviews */
export async function processStudySession(
  userId: string,
  topicId: string,
  durationMinutes: number,
  questionsAttempted: number,
  questionsCorrect: number
) {
  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .single();

  if (!topic) return;

  const accuracy = questionsAttempted > 0 ? questionsCorrect / questionsAttempted : 0.7;
  const newMastery = calculateMastery(
    topic.mastery_score ?? 0,
    accuracy,
    durationMinutes,
    topic.review_count ?? 0,
    questionsAttempted,
    questionsCorrect
  );
  const newRetention = 100; // Just studied — full retention
  const quality = Math.round(accuracy * 5); // 0-5
  const nextReview = getNextReviewDate(topic.review_count ?? 0, Math.max(quality, 1));

  await supabase
    .from("topics")
    .update({
      mastery_score: Math.round(newMastery * 100) / 100,
      retention_score: newRetention,
      last_studied_at: new Date().toISOString(),
      review_count: (topic.review_count ?? 0) + 1,
      next_review_at: nextReview.toISOString(),
      priority_score: 0, // just studied, low priority
    })
    .eq("id", topicId);

  // Schedule next review
  await supabase.from("reviews").insert({
    user_id: userId,
    topic_id: topicId,
    scheduled_at: nextReview.toISOString(),
    interval_days: Math.round((nextReview.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    status: "pending",
  });

  // Update daily cognitive metrics
  await updateDailyMetrics(userId, durationMinutes, questionsAttempted, questionsCorrect);
}

/** Complete a review — update scores and schedule next */
export async function completeReview(userId: string, reviewId: string, qualityRating: number) {
  const { data: review } = await supabase
    .from("reviews")
    .select("*, topics(*)")
    .eq("id", reviewId)
    .single();

  if (!review) return;

  // Mark review complete
  await supabase
    .from("reviews")
    .update({ completed_at: new Date().toISOString(), quality_rating: qualityRating, status: "done" })
    .eq("id", reviewId);

  const topic = review.topics as any;
  if (!topic) return;

  const newRetention = 100;
  const newReviewCount = (topic.review_count ?? 0) + 1;
  const nextReview = getNextReviewDate(newReviewCount, qualityRating);

  await supabase
    .from("topics")
    .update({
      retention_score: newRetention,
      review_count: newReviewCount,
      last_studied_at: new Date().toISOString(),
      next_review_at: nextReview.toISOString(),
    })
    .eq("id", topic.id);

  // Schedule next review
  await supabase.from("reviews").insert({
    user_id: userId,
    topic_id: topic.id,
    scheduled_at: nextReview.toISOString(),
    interval_days: Math.round((nextReview.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    status: "pending",
  });
}

/** Get consistency metrics for a user */
export async function getConsistencyMetrics(userId: string): Promise<ConsistencyMetrics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("duration_minutes, started_at")
    .eq("user_id", userId)
    .gte("started_at", thirtyDaysAgo.toISOString())
    .order("started_at", { ascending: false });

  if (!sessions?.length) {
    return { weeklyStudyHours: 0, streakDays: 0, avgSessionMinutes: 0, studyDaysThisWeek: 0, totalSessionsThisWeek: 0 };
  }

  const weeklyHours = calculateWeeklyHours(sessions);
  const streak = calculateStreak(sessions.map(s => new Date(s.started_at)));
  const avgMinutes = Math.round(sessions.reduce((s, x) => s + x.duration_minutes, 0) / sessions.length);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekSessions = sessions.filter(s => new Date(s.started_at) >= weekAgo);
  const uniqueDays = new Set(weekSessions.map(s => new Date(s.started_at).toDateString())).size;

  return {
    weeklyStudyHours: weeklyHours,
    streakDays: streak,
    avgSessionMinutes: avgMinutes,
    studyDaysThisWeek: uniqueDays,
    totalSessionsThisWeek: weekSessions.length,
  };
}

/** Get daily study recommendations */
export async function getDailyRecommendations(userId: string): Promise<DailyRecommendation[]> {
  await recalculateAllTopics(userId);

  const { data: topics } = await supabase
    .from("topics")
    .select("id, name, priority_score, retention_score, mastery_score, last_studied_at, next_review_at, review_count, disciplines(name)")
    .eq("user_id", userId)
    .order("priority_score", { ascending: false });

  if (!topics?.length) return [];

  return generateRecommendations(
    topics.map(t => ({
      ...t,
      discipline_name: (t.disciplines as any)?.name ?? "",
      priority_score: t.priority_score ?? 0,
      retention_score: t.retention_score ?? 0,
      mastery_score: t.mastery_score ?? 0,
    }))
  );
}

/** Get pending reviews for today */
export async function getPendingReviews(userId: string) {
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from("reviews")
    .select("*, topics(name, discipline_id, disciplines(name))")
    .eq("user_id", userId)
    .eq("status", "pending")
    .lte("scheduled_at", endOfDay.toISOString())
    .order("scheduled_at", { ascending: true });

  return data ?? [];
}

/** Update or create daily cognitive metrics */
async function updateDailyMetrics(userId: string, studyMinutes: number, questions: number, correct: number) {
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("cognitive_metrics")
    .select("*")
    .eq("user_id", userId)
    .eq("metric_date", today)
    .single();

  const { data: allTopics } = await supabase
    .from("topics")
    .select("retention_score, mastery_score")
    .eq("user_id", userId);

  const avgRetention = allTopics?.length
    ? allTopics.reduce((s, t) => s + (t.retention_score ?? 0), 0) / allTopics.length
    : 0;
  const avgMastery = allTopics?.length
    ? allTopics.reduce((s, t) => s + (t.mastery_score ?? 0), 0) / allTopics.length
    : 0;

  const consistency = await getConsistencyMetrics(userId);

  if (existing) {
    const totalQ = (existing.questions_attempted ?? 0) + questions;
    const totalC = (existing.questions_correct ?? 0) + correct;
    await supabase
      .from("cognitive_metrics")
      .update({
        total_study_minutes: (existing.total_study_minutes ?? 0) + studyMinutes,
        topics_studied: (existing.topics_studied ?? 0) + 1,
        avg_retention: Math.round(avgRetention * 100) / 100,
        avg_mastery: Math.round(avgMastery * 100) / 100,
        questions_attempted: totalQ,
        questions_correct: totalC,
        accuracy_rate: totalQ > 0 ? Math.round((totalC / totalQ) * 100 * 100) / 100 : 0,
        streak_days: consistency.streakDays,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("cognitive_metrics").insert({
      user_id: userId,
      metric_date: today,
      total_study_minutes: studyMinutes,
      topics_studied: 1,
      avg_retention: Math.round(avgRetention * 100) / 100,
      avg_mastery: Math.round(avgMastery * 100) / 100,
      questions_attempted: questions,
      questions_correct: correct,
      accuracy_rate: questions > 0 ? Math.round((correct / questions) * 100 * 100) / 100 : 0,
      streak_days: consistency.streakDays,
    });
  }
}

/** Generate coach context summary for AI integration */
export async function getCoachContext(userId: string) {
  const consistency = await getConsistencyMetrics(userId);
  const recommendations = await getDailyRecommendations(userId);
  const pendingReviews = await getPendingReviews(userId);

  const { data: recentMetrics } = await supabase
    .from("cognitive_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("metric_date", { ascending: false })
    .limit(7);

  const { data: weakTopics } = await supabase
    .from("topics")
    .select("name, mastery_score, retention_score, disciplines(name)")
    .eq("user_id", userId)
    .lt("mastery_score", 40)
    .order("mastery_score", { ascending: true })
    .limit(5);

  return {
    consistency,
    recommendations,
    pendingReviewsCount: pendingReviews.length,
    weeklyMetrics: recentMetrics ?? [],
    weakTopics: weakTopics?.map(t => ({
      name: t.name,
      mastery: t.mastery_score,
      retention: t.retention_score,
      discipline: (t.disciplines as any)?.name,
    })) ?? [],
  };
}
