/**
 * Study consistency analysis module
 */

export interface ConsistencyMetrics {
  weeklyStudyHours: number;
  streakDays: number;
  avgSessionMinutes: number;
  studyDaysThisWeek: number;
  totalSessionsThisWeek: number;
}

export interface DailyRecommendation {
  topicId: string;
  topicName: string;
  disciplineName: string;
  reason: string;
  priority: number;
  type: 'review' | 'study' | 'practice';
}

export function calculateStreak(sessionDates: Date[]): number {
  if (sessionDates.length === 0) return 0;
  
  const sorted = [...sessionDates]
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastStudy = new Date(sorted[0]);
  lastStudy.setHours(0, 0, 0, 0);
  
  // If last study wasn't today or yesterday, streak is 0
  const diffDays = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return 0;
  
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const current = new Date(sorted[i - 1]);
    const prev = new Date(sorted[i]);
    current.setHours(0, 0, 0, 0);
    prev.setHours(0, 0, 0, 0);
    
    const gap = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (gap === 1) streak++;
    else if (gap === 0) continue; // same day
    else break;
  }
  
  return streak;
}

export function calculateWeeklyHours(sessions: { duration_minutes: number; started_at: string }[]): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const weekSessions = sessions.filter(s => new Date(s.started_at) >= weekAgo);
  const totalMinutes = weekSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  return Math.round(totalMinutes / 60 * 10) / 10;
}

export function generateRecommendations(
  topics: Array<{
    id: string;
    name: string;
    discipline_name: string;
    priority_score: number;
    retention_score: number;
    mastery_score: number;
    last_studied_at: string | null;
    next_review_at: string | null;
  }>
): DailyRecommendation[] {
  const now = new Date();
  const recommendations: DailyRecommendation[] = [];
  
  // Overdue reviews first
  const overdueReviews = topics
    .filter(t => t.next_review_at && new Date(t.next_review_at) <= now)
    .sort((a, b) => b.priority_score - a.priority_score);
  
  for (const t of overdueReviews.slice(0, 3)) {
    recommendations.push({
      topicId: t.id,
      topicName: t.name,
      disciplineName: t.discipline_name,
      reason: `Revisão pendente — retenção em ${Math.round(t.retention_score)}%`,
      priority: t.priority_score,
      type: 'review',
    });
  }
  
  // Low mastery topics
  const lowMastery = topics
    .filter(t => t.mastery_score < 50)
    .sort((a, b) => a.mastery_score - b.mastery_score);
  
  for (const t of lowMastery.slice(0, 2)) {
    if (!recommendations.find(r => r.topicId === t.id)) {
      recommendations.push({
        topicId: t.id,
        topicName: t.name,
        disciplineName: t.discipline_name,
        reason: `Domínio baixo (${Math.round(t.mastery_score)}%) — precisa de reforço`,
        priority: t.priority_score,
        type: 'study',
      });
    }
  }
  
  // High priority general
  const highPriority = topics
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 5);
  
  for (const t of highPriority) {
    if (recommendations.length >= 5) break;
    if (!recommendations.find(r => r.topicId === t.id)) {
      recommendations.push({
        topicId: t.id,
        topicName: t.name,
        disciplineName: t.discipline_name,
        reason: `Prioridade alta — otimize seu tempo`,
        priority: t.priority_score,
        type: 'practice',
      });
    }
  }
  
  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
