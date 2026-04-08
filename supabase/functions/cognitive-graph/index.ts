import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// === BKT Mathematics ===
function bktUpdate(pMastery: number, pLearn: number, pGuess: number, pSlip: number, isCorrect: boolean): number {
  let pLnGivenObs: number;
  if (isCorrect) {
    const pCorrectMastered = pMastery * (1 - pSlip);
    const pCorrectNotMastered = (1 - pMastery) * pGuess;
    pLnGivenObs = pCorrectMastered / (pCorrectMastered + pCorrectNotMastered);
  } else {
    const pIncorrectMastered = pMastery * pSlip;
    const pIncorrectNotMastered = (1 - pMastery) * (1 - pGuess);
    pLnGivenObs = pIncorrectMastered / (pIncorrectMastered + pIncorrectNotMastered);
  }
  const newMastery = pLnGivenObs + (1 - pLnGivenObs) * pLearn;
  return Math.min(0.99, Math.max(0.01, newMastery));
}

// === Ebbinghaus Forgetting Curve ===
function calculateRetention(lastInteraction: string | null, stability: number): number {
  if (!lastInteraction) return 1.0;
  const hoursSince = (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60);
  // R(t) = e^(-t / (24 * S)) — Ebbinghaus-inspired with stability factor
  return Math.max(0.01, Math.exp(-hoursSince / (24 * stability)));
}

// === Adaptive Review Scheduling ===
function calculateNextReview(mastery: number, stability: number): Date {
  // Solve: targetRetention = e^(-t/(24*S)) for t
  const targetRetention = 0.85;
  const hoursUntilTarget = -24 * stability * Math.log(targetRetention);
  // Scale by mastery: higher mastery = longer interval
  const masteryBonus = 1 + mastery * 2;
  const intervalHours = Math.max(4, Math.min(hoursUntilTarget * masteryBonus, 30 * 24));
  return new Date(Date.now() + intervalHours * 60 * 60 * 1000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      // ===================== GET FULL GRAPH =====================
      case "get_graph": {
        const [nodesResult, edgesResult] = await Promise.all([
          supabase.from("concept_nodes").select("*, cognitive_states(*)").eq("user_id", user.id),
          supabase.from("concept_edges").select("*").eq("user_id", user.id),
        ]);

        const nodes = (nodesResult.data || []).map((node: any) => {
          const state = node.cognitive_states?.[0];
          if (state) {
            state.retention_score = calculateRetention(state.last_interaction_at, state.stability);
          }
          return node;
        });

        const edges = edgesResult.data || [];
        const states = nodes.map((n: any) => n.cognitive_states?.[0]).filter(Boolean);
        const avgMastery = states.length > 0 ? states.reduce((s: number, st: any) => s + st.p_mastery, 0) / states.length : 0;
        const avgRetention = states.length > 0 ? states.reduce((s: number, st: any) => s + st.retention_score, 0) / states.length : 0;
        const totalInteractions = states.reduce((s: number, st: any) => s + st.correct_count + st.incorrect_count, 0);
        const pendingReviews = states.filter((st: any) => st.retention_score < 0.85 || st.p_mastery < 0.5).length;
        const masteredConcepts = states.filter((st: any) => st.p_mastery >= 0.8).length;

        return new Response(JSON.stringify({
          nodes,
          edges,
          stats: {
            total_concepts: nodes.length,
            avg_mastery: avgMastery,
            avg_retention: avgRetention,
            total_interactions: totalInteractions,
            pending_reviews: pendingReviews,
            mastered_concepts: masteredConcepts,
          },
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ===================== RECORD INTERACTION + BKT UPDATE =====================
      case "record_interaction": {
        const { concept_node_id, interaction_type, is_correct, metadata } = params;

        // Log interaction
        await supabase.from("concept_interactions").insert({
          user_id: user.id,
          concept_node_id,
          interaction_type,
          is_correct,
          metadata: metadata || {},
        });

        // Get current cognitive state
        const { data: state } = await supabase
          .from("cognitive_states")
          .select("*")
          .eq("user_id", user.id)
          .eq("concept_node_id", concept_node_id)
          .single();

        if (!state) throw new Error("No cognitive state found for this concept");

        let newMastery = state.p_mastery;
        let newStability = state.stability;
        let newCorrect = state.correct_count;
        let newIncorrect = state.incorrect_count;
        let newReviewCount = state.review_count;

        if (interaction_type === "question_correct" || interaction_type === "question_incorrect") {
          const correct = interaction_type === "question_correct" || is_correct === true;
          newMastery = bktUpdate(state.p_mastery, state.p_learn, state.p_guess, state.p_slip, correct);
          if (correct) {
            newCorrect++;
            newStability = Math.min(30, state.stability * 1.2 + 0.1);
          } else {
            newIncorrect++;
            newStability = Math.max(0.5, state.stability * 0.8);
          }
        } else if (interaction_type === "review" || interaction_type === "read" || interaction_type === "highlight") {
          newMastery = Math.min(0.99, state.p_mastery + state.p_learn * 0.3);
          newStability = Math.min(30, state.stability * 1.05);
          newReviewCount++;
        } else if (interaction_type === "flashcard_correct") {
          newMastery = bktUpdate(state.p_mastery, state.p_learn, state.p_guess, state.p_slip, true);
          newStability = Math.min(30, state.stability * 1.15);
          newCorrect++;
          newReviewCount++;
        } else if (interaction_type === "flashcard_incorrect") {
          newMastery = bktUpdate(state.p_mastery, state.p_learn, state.p_guess, state.p_slip, false);
          newStability = Math.max(0.5, state.stability * 0.85);
          newIncorrect++;
          newReviewCount++;
        }

        const nextReview = calculateNextReview(newMastery, newStability);

        await supabase
          .from("cognitive_states")
          .update({
            p_mastery: newMastery,
            stability: newStability,
            retention_score: 1.0,
            last_interaction_at: new Date().toISOString(),
            next_review_at: nextReview.toISOString(),
            review_count: newReviewCount,
            correct_count: newCorrect,
            incorrect_count: newIncorrect,
          })
          .eq("id", state.id);

        // === Knowledge Propagation ===
        const masteryDelta = newMastery - state.p_mastery;
        if (Math.abs(masteryDelta) > 0.05) {
          const [outEdges, inEdges] = await Promise.all([
            supabase.from("concept_edges").select("target_node_id, weight").eq("source_node_id", concept_node_id).eq("user_id", user.id),
            supabase.from("concept_edges").select("source_node_id, weight").eq("target_node_id", concept_node_id).eq("user_id", user.id),
          ]);

          const connections = [
            ...(outEdges.data || []).map(e => ({ id: e.target_node_id, w: e.weight })),
            ...(inEdges.data || []).map(e => ({ id: e.source_node_id, w: e.weight * 0.5 })),
          ];

          for (const conn of connections) {
            const propagated = masteryDelta * conn.w * 0.15;
            if (Math.abs(propagated) > 0.005) {
              const { data: connState } = await supabase
                .from("cognitive_states")
                .select("id, p_mastery")
                .eq("user_id", user.id)
                .eq("concept_node_id", conn.id)
                .single();

              if (connState) {
                const newConnMastery = Math.min(0.99, Math.max(0.01, connState.p_mastery + propagated));
                await supabase
                  .from("cognitive_states")
                  .update({ p_mastery: newConnMastery })
                  .eq("id", connState.id);
              }
            }
          }
        }

        return new Response(JSON.stringify({
          success: true,
          new_mastery: newMastery,
          new_stability: newStability,
          next_review_at: nextReview.toISOString(),
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ===================== ADAPTIVE REVIEW QUEUE =====================
      case "get_review_queue": {
        const { limit = 20 } = params;

        const { data: states } = await supabase
          .from("cognitive_states")
          .select("*, concept_nodes(id, name, description, discipline_id, importance)")
          .eq("user_id", user.id);

        if (!states || states.length === 0) {
          return new Response(JSON.stringify({ queue: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const withPriority = states.map((state: any) => {
          const retention = calculateRetention(state.last_interaction_at, state.stability);
          const importance = state.concept_nodes?.importance || 0.5;
          // Priority formula: low mastery + low retention + high importance = high priority
          const priority = (1 - state.p_mastery) * 0.4 + (1 - retention) * 0.4 + importance * 0.2;

          return {
            ...state,
            current_retention: retention,
            priority,
            concept_name: state.concept_nodes?.name,
            concept_description: state.concept_nodes?.description,
            discipline_id: state.concept_nodes?.discipline_id,
          };
        });

        withPriority.sort((a: any, b: any) => b.priority - a.priority);

        return new Response(JSON.stringify({ queue: withPriority.slice(0, limit) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (e) {
    console.error("cognitive-graph error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
