/**
 * NEURIX Cognitive Engine — Scientific Models
 * 
 * Based on:
 * - Bayesian Knowledge Tracing (BKT) — Corbett & Anderson, 1994
 * - Ebbinghaus Forgetting Curve — exponential decay R = e^(-Δt/S)
 * - Hazard Function — λ = exp(α + b₁·Δt + b₂·F + b₃·A)
 * - Confidence Score — conf(n) = 1 - e^(-n/k)
 * - Priority Function — 0.70 × (1 - pL) + 0.30 × (1 - conf)
 */

// ─── BKT Parameters ───
const BKT = {
  P_L0: 0.25,   // Prior: initial probability of knowing (25%)
  P_T: 0.12,    // Transition: chance of learning per exposure (12%)
  P_S: 0.10,    // Slip: chance of wrong answer despite knowing (10%)
  P_G: 0.20,    // Guess: chance of right answer without knowing (20%)
};

// ─── Ebbinghaus Parameters ───
const INITIAL_STABILITY = 24; // hours — first exposure
const STABILITY_GROWTH_FACTOR = 2.5; // multiplier per successful review

// ─── Hazard Function Parameters ───
const HAZARD = {
  alpha: -4.0,  // baseline
  b1: 0.015,    // time effect per hour
  b2: 0.20,     // fatigue effect (0-1)
  b3: 0.20,     // emotional affect (0-1)
};

// ─── Confidence Parameters ───
const CONFIDENCE_K = 10; // smoothing constant

/**
 * Bayesian Knowledge Tracing — update mastery after answer
 * Returns new pL (probability of knowing) after observing correct/incorrect
 */
export function bktUpdate(
  pL: number,
  isCorrect: boolean
): number {
  let posterior: number;

  if (isCorrect) {
    // P(L|correct) = P(L)×(1-P(S)) / [P(L)×(1-P(S)) + (1-P(L))×P(G)]
    const num = pL * (1 - BKT.P_S);
    const den = num + (1 - pL) * BKT.P_G;
    posterior = den > 0 ? num / den : pL;
  } else {
    // P(L|incorrect) = P(L)×P(S) / [P(L)×P(S) + (1-P(L))×(1-P(G))]
    const num = pL * BKT.P_S;
    const den = num + (1 - pL) * (1 - BKT.P_G);
    posterior = den > 0 ? num / den : pL;
  }

  // Apply learning transition: even wrong answers teach something
  const pLNew = posterior + (1 - posterior) * BKT.P_T;
  return Math.max(0, Math.min(1, pLNew));
}

/**
 * Process a batch of answers through BKT
 * Returns updated mastery as percentage (0-100)
 */
export function bktProcessAnswers(
  currentMasteryPercent: number,
  questionsCorrect: number,
  questionsAttempted: number
): number {
  let pL = currentMasteryPercent / 100;
  if (pL <= 0) pL = BKT.P_L0;

  // Process each answer through BKT
  for (let i = 0; i < questionsAttempted; i++) {
    const isCorrect = i < questionsCorrect;
    pL = bktUpdate(pL, isCorrect);
  }

  return Math.round(pL * 10000) / 100; // percentage with 2 decimals
}

/**
 * Ebbinghaus Retention — R(t) = e^(-Δt / S)
 * S = stability, grows with successful reviews
 */
export function calculateRetention(
  hoursSinceLastStudy: number,
  reviewCount: number,
  accuracyRate: number // 0-1, from questions
): number {
  // Stability grows exponentially with reviews
  // S starts at 24h, multiplied by growth factor for each review
  // Accuracy modulates growth (better accuracy = stronger memory)
  const accuracyBonus = 1 + accuracyRate * 0.5; // 1.0 to 1.5
  const stability = INITIAL_STABILITY * Math.pow(STABILITY_GROWTH_FACTOR, reviewCount) * accuracyBonus;

  const retention = Math.exp(-hoursSinceLastStudy / stability) * 100;
  return Math.max(0, Math.min(100, retention));
}

/**
 * Hazard Function — λ = exp(α + b₁·Δt + b₂·F + b₃·A)
 * Incorporates fatigue and emotional state into forgetting rate
 */
export function calculateHazardRate(
  hoursSinceLastStudy: number,
  fatigue: number = 0, // 0-1
  emotionalAffect: number = 0 // 0-1
): number {
  const lambda = Math.exp(
    HAZARD.alpha +
    HAZARD.b1 * hoursSinceLastStudy +
    HAZARD.b2 * fatigue +
    HAZARD.b3 * emotionalAffect
  );
  return lambda;
}

/**
 * Fatigue calculation — F = max(0, min(1, (minutes - 180) / 180))
 * 0-3h: no fatigue, 3-6h: linear growth, >6h: max fatigue
 */
export function calculateFatigue(studyMinutesToday: number): number {
  return Math.max(0, Math.min(1, (studyMinutesToday - 180) / 180));
}

/**
 * Emotional Affect — A = max(0, min(1, (3 - mood) / 3))
 * mood: 1-5 scale (1=very bad, 5=great)
 * mood >= 3: no negative impact
 */
export function calculateEmotionalAffect(moodAverage: number): number {
  return Math.max(0, Math.min(1, (3 - moodAverage) / 3));
}

/**
 * Retention with hazard — combines Ebbinghaus with contextual factors
 */
export function calculateRetentionWithHazard(
  hoursSinceLastStudy: number,
  reviewCount: number,
  accuracyRate: number,
  fatigue: number = 0,
  emotionalAffect: number = 0
): number {
  // Base Ebbinghaus retention
  const baseRetention = calculateRetention(hoursSinceLastStudy, reviewCount, accuracyRate);

  // If no contextual factors, return base retention
  if (fatigue === 0 && emotionalAffect === 0) return baseRetention;

  // Apply hazard modulation
  const hazard = calculateHazardRate(hoursSinceLastStudy, fatigue, emotionalAffect);
  const hazardRetention = Math.exp(-hazard) * 100;

  // Weighted combination: hazard affects the base retention
  return Math.max(0, Math.min(100, baseRetention * (hazardRetention / 100)));
}

/**
 * Mastery calculation combining BKT with study duration
 */
export function calculateMastery(
  currentMastery: number,
  sessionAccuracy: number, // 0-1
  studyDurationMinutes: number,
  reviewCount: number,
  questionsAttempted: number = 0,
  questionsCorrect: number = 0
): number {
  if (questionsAttempted > 0) {
    // Use BKT for question-based updates
    return bktProcessAnswers(currentMastery, questionsCorrect, questionsAttempted);
  }

  // For study sessions without questions, use simpler model
  const accuracyBoost = sessionAccuracy * 12;
  const timeBoost = Math.min(studyDurationMinutes / 60, 2) * 5;
  const reviewBonus = Math.min(reviewCount, 10) * 1.5;
  const pL = currentMastery / 100;
  const transitionBoost = (1 - pL) * BKT.P_T * 100;

  const newMastery = currentMastery + accuracyBoost + timeBoost + reviewBonus + transitionBoost;
  return Math.max(0, Math.min(100, newMastery));
}

/**
 * Confidence Score — conf(n) = 1 - e^(-n/k)
 * How confident we are in our mastery estimate
 */
export function calculateConfidence(questionsAnswered: number): number {
  return 1 - Math.exp(-questionsAnswered / CONFIDENCE_K);
}

/**
 * Credibility Interval — δ = (1 - conf) × 0.25
 * Returns margin of error for the mastery estimate
 */
export function calculateCredibilityInterval(confidence: number): number {
  return (1 - confidence) * 0.25;
}

/**
 * Priority Function — combines knowledge gap and uncertainty
 * Prioridade = 0.70 × (1 - pL) + 0.30 × (1 - conf)
 */
export function calculatePriority(
  mastery: number,      // 0-100
  retention: number,    // 0-100 (used to adjust effective mastery)
  relevance: number,    // 0-1 (topic weight for exam)
  hoursSinceLastStudy: number,
  questionsAnswered: number = 0
): number {
  // Effective mastery = mastery adjusted by retention
  const effectiveMastery = (mastery * retention) / 10000; // 0-1
  const confidence = calculateConfidence(questionsAnswered);

  // Core priority: 70% knowledge gap + 30% uncertainty
  const knowledgeGap = 1 - effectiveMastery;
  const uncertainty = 1 - confidence;
  const basePriority = 0.70 * knowledgeGap + 0.30 * uncertainty;

  // Modulate by relevance (exam weight)
  const relevanceBoost = relevance * 0.2;

  // Time urgency factor
  const timeFactor = Math.min(hoursSinceLastStudy / 168, 1) * 0.1;

  const priority = (basePriority + relevanceBoost + timeFactor) * 100;
  return Math.max(0, Math.min(100, priority));
}

/**
 * Optimal Review Time — t* = -S × ln(R_target)
 * Calculate when to schedule the next review to maintain retention at target
 */
export function calculateOptimalReviewTime(
  reviewCount: number,
  accuracyRate: number,
  targetRetention: number = 0.85 // 85% retention target
): number {
  const accuracyBonus = 1 + accuracyRate * 0.5;
  const stability = INITIAL_STABILITY * Math.pow(STABILITY_GROWTH_FACTOR, reviewCount) * accuracyBonus;
  const hoursUntilReview = -stability * Math.log(targetRetention);
  return Math.max(1, hoursUntilReview); // minimum 1 hour
}

/**
 * Get next review interval based on spaced repetition with quality adjustment
 * Quality modulates stability growth
 */
export function getNextReviewInterval(reviewCount: number, quality: number): number {
  // quality: 1-5
  // Stability multiplier based on quality
  let stabilityMultiplier: number;
  if (quality <= 2) {
    stabilityMultiplier = 0.5; // Failed — reduce interval
  } else if (quality === 3) {
    stabilityMultiplier = 1.5; // Correct with effort
  } else {
    stabilityMultiplier = 2.5; // Easy recall
  }

  const accuracy = quality / 5;
  const optimalHours = calculateOptimalReviewTime(reviewCount, accuracy);

  // Apply quality multiplier
  const adjustedHours = optimalHours * stabilityMultiplier;
  const days = adjustedHours / 24;

  return Math.max(1, Math.round(days));
}

export function getNextReviewDate(reviewCount: number, quality: number): Date {
  const days = getNextReviewInterval(reviewCount, quality);
  const next = new Date();
  next.setDate(next.getDate() + days);
  next.setHours(9, 0, 0, 0);
  return next;
}

/**
 * Expected exam score — E(nota) = Σ wᵢ × pLᵢ
 */
export function calculateExpectedScore(
  topics: Array<{ mastery: number; weight: number }>
): number {
  const totalWeight = topics.reduce((s, t) => s + t.weight, 0);
  if (totalWeight === 0) return 0;

  const score = topics.reduce((s, t) => s + (t.mastery / 100) * (t.weight / totalWeight), 0);
  return Math.round(score * 10000) / 100; // percentage
}

/**
 * Marginal impact — how much improving a topic by X% affects expected score
 */
export function calculateMarginalImpact(
  topicWeight: number,
  totalWeight: number,
  improvementPercent: number = 10
): number {
  return (topicWeight / totalWeight) * (improvementPercent / 100) * 100;
}
