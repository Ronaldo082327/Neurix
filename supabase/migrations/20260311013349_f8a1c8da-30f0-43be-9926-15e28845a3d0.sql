
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  target_exam TEXT,
  exam_date DATE,
  daily_hours NUMERIC(3,1) DEFAULT 2,
  preparation_level TEXT DEFAULT 'iniciante',
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_ts BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Disciplines
CREATE TABLE public.disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'hsl(217, 91%, 60%)',
  relevance NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own disciplines" ON public.disciplines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_disciplines_ts BEFORE UPDATE ON public.disciplines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Topics (with cognitive fields)
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline_id UUID NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mastery_score NUMERIC(5,2) DEFAULT 0,
  retention_score NUMERIC(5,2) DEFAULT 100,
  last_studied_at TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  priority_score NUMERIC(5,2) DEFAULT 50,
  relevance NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own topics" ON public.topics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_topics_ts BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_topics_next_review ON public.topics(user_id, next_review_at);
CREATE INDEX idx_topics_priority ON public.topics(user_id, priority_score DESC);

-- Study sessions
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  notes TEXT,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_sessions_user_date ON public.study_sessions(user_id, started_at DESC);

-- Reviews (spaced repetition)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  quality_rating INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  interval_days INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_reviews_pending ON public.reviews(user_id, status, scheduled_at);

-- Cognitive metrics (daily snapshots)
CREATE TABLE public.cognitive_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_study_minutes INTEGER DEFAULT 0,
  topics_studied INTEGER DEFAULT 0,
  avg_retention NUMERIC(5,2) DEFAULT 0,
  avg_mastery NUMERIC(5,2) DEFAULT 0,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5,2) DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric_date)
);
ALTER TABLE public.cognitive_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own metrics" ON public.cognitive_metrics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_metrics_date ON public.cognitive_metrics(user_id, metric_date DESC);

-- Study plan tasks
CREATE TABLE public.study_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.study_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_tasks_schedule ON public.study_tasks(user_id, scheduled_date);

-- Documents (PDF library)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own documents" ON public.documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notes
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_notes_ts BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AI conversations
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_conversations_ts BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_hours_weekly NUMERIC(4,1) DEFAULT 20,
  target_accuracy NUMERIC(5,2) DEFAULT 80,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
