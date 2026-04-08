
-- Concept nodes: each represents a knowledge unit in the cognitive graph
CREATE TABLE public.concept_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  discipline_id uuid REFERENCES public.disciplines(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  source_type text NOT NULL DEFAULT 'manual',
  importance numeric NOT NULL DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Directed weighted edges between concepts
CREATE TABLE public.concept_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_node_id uuid NOT NULL REFERENCES public.concept_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES public.concept_nodes(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'related',
  weight numeric NOT NULL DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_node_id, target_node_id)
);

-- BKT cognitive state per user per concept
CREATE TABLE public.cognitive_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  concept_node_id uuid NOT NULL REFERENCES public.concept_nodes(id) ON DELETE CASCADE,
  p_mastery numeric NOT NULL DEFAULT 0.1,
  p_learn numeric NOT NULL DEFAULT 0.2,
  p_guess numeric NOT NULL DEFAULT 0.25,
  p_slip numeric NOT NULL DEFAULT 0.1,
  retention_score numeric NOT NULL DEFAULT 1.0,
  stability numeric NOT NULL DEFAULT 1.0,
  last_interaction_at timestamptz,
  next_review_at timestamptz,
  review_count integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  incorrect_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, concept_node_id)
);

-- Interaction log for all study activities
CREATE TABLE public.concept_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  concept_node_id uuid NOT NULL REFERENCES public.concept_nodes(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  is_correct boolean,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.concept_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users manage own concept_nodes" ON public.concept_nodes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own concept_edges" ON public.concept_edges FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own cognitive_states" ON public.cognitive_states FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own concept_interactions" ON public.concept_interactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable realtime for live graph updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.cognitive_states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.concept_nodes;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_concept_nodes_updated_at BEFORE UPDATE ON public.concept_nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cognitive_states_updated_at BEFORE UPDATE ON public.cognitive_states FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
