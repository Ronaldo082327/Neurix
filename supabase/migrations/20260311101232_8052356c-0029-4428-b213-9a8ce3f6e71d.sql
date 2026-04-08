
-- Questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_node_id UUID REFERENCES public.concept_nodes(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  explanation TEXT,
  difficulty INTEGER NOT NULL DEFAULT 3,
  source TEXT DEFAULT 'ai_generated',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Question options
CREATE TABLE public.question_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  option_order INTEGER NOT NULL DEFAULT 0
);

-- Question attempts
CREATE TABLE public.question_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Flashcards table
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_node_id UUID REFERENCES public.concept_nodes(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  source TEXT DEFAULT 'ai_generated',
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Flashcard reviews
CREATE TABLE public.flashcard_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  quality_rating INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own questions" ON public.questions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read question options" ON public.question_options FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.user_id = auth.uid()));
CREATE POLICY "Users insert question options" ON public.question_options FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.user_id = auth.uid()));
CREATE POLICY "Users delete question options" ON public.question_options FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.user_id = auth.uid()));
CREATE POLICY "Users manage own attempts" ON public.question_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own flashcards" ON public.flashcards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own flashcard reviews" ON public.flashcard_reviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
