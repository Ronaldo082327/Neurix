-- ============================================================================
-- NEURIX Multi-AI Orchestrator Schema
-- Claude as central brain, routing to Gemini, ChatGPT, Codex, Antigravity, NotebookLM
-- ============================================================================

-- AI Provider registry
CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  provider_key TEXT NOT NULL, -- claude, gemini, chatgpt, codex, antigravity, notebooklm
  display_name TEXT NOT NULL,
  api_key_encrypted TEXT, -- encrypted API key (null = use system default)
  base_url TEXT,
  model_id TEXT,
  is_active BOOLEAN DEFAULT true,
  capabilities JSONB DEFAULT '[]'::jsonb, -- ["reasoning","research","code","creative","synthesis"]
  config JSONB DEFAULT '{}'::jsonb, -- provider-specific config
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider_key)
);

-- Orchestration pipeline - each user request becomes a pipeline
CREATE TABLE IF NOT EXISTS orchestration_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  intent TEXT NOT NULL, -- user's original request
  intent_type TEXT NOT NULL DEFAULT 'general', -- study_plan, review, research, task, synthesis, coach
  status TEXT NOT NULL DEFAULT 'planning', -- planning, routing, executing, synthesizing, completed, failed
  orchestrator_reasoning TEXT, -- Claude's analysis of how to decompose the task
  final_result TEXT, -- synthesized response
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Sub-tasks within a pipeline, each routed to an AI
CREATE TABLE IF NOT EXISTS orchestration_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES orchestration_pipelines ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  provider_key TEXT NOT NULL, -- which AI handles this
  task_type TEXT NOT NULL, -- reason, research, generate, code, analyze, synthesize
  prompt TEXT NOT NULL,
  result TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, skipped
  priority INTEGER DEFAULT 0,
  depends_on UUID[], -- task IDs this depends on
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Autonomous task execution queue
CREATE TABLE IF NOT EXISTS autonomous_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_category TEXT NOT NULL DEFAULT 'study', -- study, review, research, organization, wiki, flashcard, question
  status TEXT NOT NULL DEFAULT 'queued', -- queued, running, paused, completed, failed, cancelled
  priority INTEGER DEFAULT 5, -- 1-10
  scheduled_for TIMESTAMPTZ,
  recurring_cron TEXT, -- cron expression for recurring tasks
  assigned_provider TEXT DEFAULT 'claude', -- which AI executes
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  progress INTEGER DEFAULT 0, -- 0-100
  parent_task_id UUID REFERENCES autonomous_tasks,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Obsidian vault sync state
CREATE TABLE IF NOT EXISTS obsidian_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  vault_path TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'disconnected', -- connected, syncing, disconnected, error
  last_sync_at TIMESTAMPTZ,
  files_tracked INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb, -- folder mappings, exclusions, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Wiki pages (living wiki maintained by AI)
CREATE TABLE IF NOT EXISTS wiki_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  page_type TEXT NOT NULL DEFAULT 'concept', -- concept, entity, comparison, synthesis, index, protocol, experiment
  discipline_id UUID REFERENCES disciplines ON DELETE SET NULL,
  topic_id UUID REFERENCES topics ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  sources JSONB DEFAULT '[]'::jsonb, -- [{type, id, title}]
  ai_generated BOOLEAN DEFAULT false,
  last_updated_by TEXT DEFAULT 'user', -- user, claude, gemini, notebooklm
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Wiki page revision history
CREATE TABLE IF NOT EXISTS wiki_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wiki_page_id UUID REFERENCES wiki_pages ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  change_summary TEXT,
  changed_by TEXT NOT NULL DEFAULT 'user',
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Study protocols (from documentation's protocol concept)
CREATE TABLE IF NOT EXISTS study_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  objective TEXT,
  hypothesis TEXT,
  steps JSONB DEFAULT '[]'::jsonb, -- [{order, description, duration_minutes}]
  frequency TEXT, -- daily, weekly, etc.
  duration_days INTEGER,
  indicators JSONB DEFAULT '[]'::jsonb, -- [{name, target, unit}]
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, completed, abandoned
  observations JSONB DEFAULT '[]'::jsonb, -- [{date, note, metrics}]
  ai_recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent memory - persistent context for multi-session AI coherence
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  memory_type TEXT NOT NULL, -- user_profile, learning_pattern, preference, insight, strategy
  content TEXT NOT NULL,
  importance NUMERIC(3,2) DEFAULT 0.5,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  access_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ, -- null = permanent
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NotebookLM integration state
CREATE TABLE IF NOT EXISTS notebooklm_notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  notebook_id TEXT NOT NULL, -- external NotebookLM ID
  title TEXT NOT NULL,
  description TEXT,
  source_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  artifacts JSONB DEFAULT '[]'::jsonb, -- [{type, id, title, url}]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Enable RLS ───
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestration_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestration_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE obsidian_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebooklm_notebooks ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ───
CREATE POLICY "Users manage own ai_providers" ON ai_providers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own pipelines" ON orchestration_pipelines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own orch_tasks" ON orchestration_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own auto_tasks" ON autonomous_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own obsidian_sync" ON obsidian_sync FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own wiki_pages" ON wiki_pages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own wiki_revisions" ON wiki_revisions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own protocols" ON study_protocols FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own agent_memory" ON agent_memory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notebooklm" ON notebooklm_notebooks FOR ALL USING (auth.uid() = user_id);

-- ─── Indexes ───
CREATE INDEX idx_orch_pipelines_status ON orchestration_pipelines(user_id, status);
CREATE INDEX idx_orch_tasks_pipeline ON orchestration_tasks(pipeline_id, status);
CREATE INDEX idx_auto_tasks_queue ON autonomous_tasks(user_id, status, priority DESC, scheduled_for);
CREATE INDEX idx_wiki_pages_slug ON wiki_pages(user_id, slug);
CREATE INDEX idx_wiki_pages_type ON wiki_pages(user_id, page_type);
CREATE INDEX idx_agent_memory_type ON agent_memory(user_id, memory_type);
CREATE INDEX idx_protocols_status ON study_protocols(user_id, status);

-- ─── Triggers ───
CREATE TRIGGER update_ai_providers_ts BEFORE UPDATE ON ai_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_obsidian_sync_ts BEFORE UPDATE ON obsidian_sync FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wiki_pages_ts BEFORE UPDATE ON wiki_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_protocols_ts BEFORE UPDATE ON study_protocols FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notebooklm_ts BEFORE UPDATE ON notebooklm_notebooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Realtime ───
ALTER PUBLICATION supabase_realtime ADD TABLE autonomous_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE orchestration_pipelines;
ALTER PUBLICATION supabase_realtime ADD TABLE wiki_pages;
