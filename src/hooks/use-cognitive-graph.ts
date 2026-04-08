import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface ConceptNode {
  id: string;
  name: string;
  description: string | null;
  discipline_id: string | null;
  topic_id: string | null;
  source_type: string;
  importance: number;
  cognitive_states: CognitiveState[];
}

export interface CognitiveState {
  id: string;
  p_mastery: number;
  p_learn: number;
  p_guess: number;
  p_slip: number;
  retention_score: number;
  stability: number;
  last_interaction_at: string | null;
  next_review_at: string | null;
  review_count: number;
  correct_count: number;
  incorrect_count: number;
}

export interface ConceptEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  weight: number;
}

export interface GraphStats {
  total_concepts: number;
  avg_mastery: number;
  avg_retention: number;
  total_interactions: number;
  pending_reviews: number;
  mastered_concepts: number;
}

export interface GraphData {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  stats: GraphStats;
}

export interface ReviewItem {
  concept_node_id: string;
  concept_name: string;
  concept_description: string | null;
  discipline_id: string | null;
  p_mastery: number;
  current_retention: number;
  priority: number;
  review_count: number;
  next_review_at: string | null;
}

export function useCognitiveGraph() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const graphQuery = useQuery<GraphData>({
    queryKey: ["cognitive-graph", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("cognitive-graph", {
        body: { action: "get_graph" },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const reviewQueueQuery = useQuery<ReviewItem[]>({
    queryKey: ["review-queue", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("cognitive-graph", {
        body: { action: "get_review_queue", limit: 20 },
      });
      if (error) throw error;
      return data.queue;
    },
    enabled: !!user,
  });

  const recordInteraction = useMutation({
    mutationFn: async (params: {
      concept_node_id: string;
      interaction_type: string;
      is_correct?: boolean;
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.functions.invoke("cognitive-graph", {
        body: { action: "record_interaction", ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cognitive-graph"] });
      queryClient.invalidateQueries({ queryKey: ["review-queue"] });
    },
  });

  const extractConcepts = useMutation({
    mutationFn: async (params: {
      document_id?: string;
      discipline_id?: string;
      discipline_name?: string;
      topics?: any[];
    }) => {
      const { data, error } = await supabase.functions.invoke("extract-concepts", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cognitive-graph"] });
    },
  });

  const syncTopics = useMutation({
    mutationFn: async () => {
      const { data: disciplines } = await supabase
        .from("disciplines")
        .select("id, name") as any;

      if (!disciplines || disciplines.length === 0) return { synced: 0 };

      let totalSynced = 0;
      for (const disc of disciplines as any[]) {
        const { data: topics } = await supabase
          .from("topics")
          .select("*")
          .eq("discipline_id", disc.id) as any;

        if (topics && topics.length > 0) {
          const { data } = await supabase.functions.invoke("extract-concepts", {
            body: {
              discipline_id: disc.id,
              discipline_name: disc.name,
              topics,
            },
          });
          totalSynced += data?.nodes_synced || 0;
        }
      }
      return { synced: totalSynced };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cognitive-graph"] });
    },
  });

  return {
    graph: graphQuery.data,
    isLoading: graphQuery.isLoading,
    error: graphQuery.error,
    reviewQueue: reviewQueueQuery.data || [],
    isLoadingQueue: reviewQueueQuery.isLoading,
    recordInteraction,
    extractConcepts,
    syncTopics,
    refetch: graphQuery.refetch,
  };
}
