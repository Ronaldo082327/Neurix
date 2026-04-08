/**
 * NEURIX Multi-AI Orchestrator
 *
 * Claude is the central brain that:
 * 1. Receives user intent
 * 2. Classifies and decomposes into sub-tasks
 * 3. Routes each sub-task to the optimal AI provider
 * 4. Collects results and synthesizes a unified response
 * 5. Executes side-effects (create flashcards, update wiki, schedule reviews, etc.)
 *
 * Integrated providers:
 * - Claude: Orchestration, reasoning, synthesis, coaching
 * - Gemini: Multimodal research, document analysis
 * - ChatGPT: Creative content, didactic explanations
 * - Codex: Code generation, automation, task execution
 * - Antigravity: Lateral thinking, innovation, paradigm-breaking
 * - NotebookLM: Source-grounded research, podcasts, flashcards
 */

import { supabase } from '@/integrations/supabase/client';
import { classifyIntent, buildRoutingPlan } from './router';
import type {
  AIProviderKey,
  IntentType,
  OrchestratorResponse,
  PipelineStatus,
  AutonomousTask,
  AutonomousTaskCategory,
  WikiPage,
  WikiPageType,
} from './types';

// ─── Main Orchestrator ───

export async function orchestrate(
  userId: string,
  userMessage: string,
  context?: Record<string, unknown>
): Promise<OrchestratorResponse> {
  // 1. Classify intent
  const intentType = classifyIntent(userMessage);

  // 2. Create pipeline record
  const { data: pipeline } = await supabase
    .from('orchestration_pipelines')
    .insert({
      user_id: userId,
      intent: userMessage,
      intent_type: intentType,
      status: 'planning' as PipelineStatus,
    })
    .select()
    .single();

  if (!pipeline) throw new Error('Failed to create pipeline');

  // 3. Load agent memories for context enrichment
  const memories = await loadRecentMemories(userId);

  // 4. Build routing plan
  const routingPlan = buildRoutingPlan({
    userMessage,
    intentType,
    coachContext: context,
    recentMemories: memories,
  });

  // 5. Update pipeline to routing
  await supabase
    .from('orchestration_pipelines')
    .update({ status: 'routing', orchestrator_reasoning: JSON.stringify(routingPlan.map(r => r.reasoning)) })
    .eq('id', pipeline.id);

  // 6. Create orchestration tasks
  const tasks = [];
  for (const decision of routingPlan) {
    const { data: task } = await supabase
      .from('orchestration_tasks')
      .insert({
        pipeline_id: pipeline.id,
        user_id: userId,
        provider_key: decision.providerKey,
        task_type: decision.taskType,
        prompt: decision.prompt,
        status: 'pending',
        priority: decision.priority,
        depends_on: decision.dependsOn ?? [],
      })
      .select()
      .single();

    if (task) tasks.push(task);
  }

  // 7. Execute pipeline via edge function
  await supabase
    .from('orchestration_pipelines')
    .update({ status: 'executing' })
    .eq('id', pipeline.id);

  const { data: result } = await supabase.functions.invoke('ai-orchestrator', {
    body: { pipelineId: pipeline.id, tasks, context },
  });

  // 8. Update pipeline with results
  const finalResult = result?.finalResult ?? 'Pipeline em execução...';
  await supabase
    .from('orchestration_pipelines')
    .update({
      status: 'completed',
      final_result: finalResult,
      completed_at: new Date().toISOString(),
    })
    .eq('id', pipeline.id);

  // 9. Store insights in agent memory
  if (result?.insights) {
    await storeMemory(userId, 'insight', result.insights);
  }

  return {
    pipelineId: pipeline.id,
    status: 'completed',
    reasoning: routingPlan.map(r => r.reasoning).join('\n'),
    tasks: tasks.map(t => ({
      id: t.id,
      pipelineId: t.pipeline_id,
      providerKey: t.provider_key as AIProviderKey,
      taskType: t.task_type as any,
      prompt: t.prompt,
      result: t.result,
      status: t.status as any,
      priority: t.priority,
    })),
    finalResult,
    suggestedFollowUps: result?.suggestedFollowUps ?? [],
  };
}

// ─── Autonomous Task Management ───

export async function createAutonomousTask(
  userId: string,
  title: string,
  category: AutonomousTaskCategory,
  options: {
    description?: string;
    priority?: number;
    scheduledFor?: Date;
    recurringCron?: string;
    assignedProvider?: AIProviderKey;
    inputData?: Record<string, unknown>;
    parentTaskId?: string;
  } = {}
): Promise<AutonomousTask | null> {
  const { data } = await supabase
    .from('autonomous_tasks')
    .insert({
      user_id: userId,
      title,
      description: options.description,
      task_category: category,
      priority: options.priority ?? 5,
      scheduled_for: options.scheduledFor?.toISOString(),
      recurring_cron: options.recurringCron,
      assigned_provider: options.assignedProvider ?? 'claude',
      input_data: options.inputData ?? {},
      parent_task_id: options.parentTaskId,
    })
    .select()
    .single();

  return data as any;
}

export async function executeAutonomousTask(taskId: string): Promise<void> {
  await supabase
    .from('autonomous_tasks')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', taskId);

  const { data: task } = await supabase
    .from('autonomous_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!task) return;

  try {
    const { data: result } = await supabase.functions.invoke('task-executor', {
      body: { task },
    });

    await supabase
      .from('autonomous_tasks')
      .update({
        status: 'completed',
        output_data: result ?? {},
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);
  } catch (error) {
    await supabase
      .from('autonomous_tasks')
      .update({
        status: 'failed',
        output_data: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
      .eq('id', taskId);
  }
}

export async function getTaskQueue(userId: string): Promise<AutonomousTask[]> {
  const { data } = await supabase
    .from('autonomous_tasks')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['queued', 'running', 'paused'])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  return (data ?? []) as any[];
}

export async function getTaskHistory(userId: string, limit = 20): Promise<AutonomousTask[]> {
  const { data } = await supabase
    .from('autonomous_tasks')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['completed', 'failed', 'cancelled'])
    .order('completed_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as any[];
}

// ─── Wiki Management ───

export async function createWikiPage(
  userId: string,
  title: string,
  content: string,
  pageType: WikiPageType,
  options: {
    disciplineId?: string;
    topicId?: string;
    tags?: string[];
    sources?: any[];
    aiGenerated?: boolean;
    generatedBy?: string;
  } = {}
): Promise<WikiPage | null> {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const { data } = await supabase
    .from('wiki_pages')
    .insert({
      user_id: userId,
      title,
      slug,
      content,
      page_type: pageType,
      discipline_id: options.disciplineId,
      topic_id: options.topicId,
      tags: options.tags ?? [],
      sources: options.sources ?? [],
      ai_generated: options.aiGenerated ?? false,
      last_updated_by: options.generatedBy ?? 'user',
    })
    .select()
    .single();

  return data as any;
}

export async function updateWikiPage(
  pageId: string,
  userId: string,
  content: string,
  changeSummary: string,
  changedBy = 'user'
): Promise<void> {
  const { data: current } = await supabase
    .from('wiki_pages')
    .select('version, content')
    .eq('id', pageId)
    .single();

  if (!current) return;

  // Save revision
  await supabase.from('wiki_revisions').insert({
    wiki_page_id: pageId,
    user_id: userId,
    content: current.content,
    change_summary: changeSummary,
    changed_by: changedBy,
    version: current.version,
  });

  // Update page
  await supabase
    .from('wiki_pages')
    .update({
      content,
      version: (current.version ?? 1) + 1,
      last_updated_by: changedBy,
    })
    .eq('id', pageId);
}

export async function searchWiki(userId: string, query: string): Promise<WikiPage[]> {
  const { data } = await supabase
    .from('wiki_pages')
    .select('*')
    .eq('user_id', userId)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
    .order('updated_at', { ascending: false })
    .limit(20);

  return (data ?? []) as any[];
}

// ─── Agent Memory ───

async function loadRecentMemories(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('agent_memory')
    .select('content, memory_type, importance')
    .eq('user_id', userId)
    .order('importance', { ascending: false })
    .order('last_accessed_at', { ascending: false })
    .limit(10);

  if (!data?.length) return [];

  // Mark as accessed
  const ids = data.map(m => (m as any).id).filter(Boolean);
  if (ids.length) {
    // Batch update would be better but Supabase doesn't support it well
    for (const memory of data) {
      await supabase
        .from('agent_memory')
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: ((memory as any).access_count ?? 0) + 1,
        })
        .eq('id', (memory as any).id);
    }
  }

  return data.map(m => `[${m.memory_type}] ${m.content}`);
}

export async function storeMemory(
  userId: string,
  memoryType: string,
  content: string,
  importance = 0.5
): Promise<void> {
  await supabase.from('agent_memory').insert({
    user_id: userId,
    memory_type: memoryType,
    content,
    importance,
  });
}

// ─── Study Protocol Management ───

export async function createProtocol(
  userId: string,
  title: string,
  options: {
    objective?: string;
    hypothesis?: string;
    steps?: Array<{ order: number; description: string; duration_minutes: number }>;
    frequency?: string;
    durationDays?: number;
    indicators?: Array<{ name: string; target: number; unit: string }>;
  } = {}
): Promise<string | null> {
  const { data } = await supabase
    .from('study_protocols')
    .insert({
      user_id: userId,
      title,
      objective: options.objective,
      hypothesis: options.hypothesis,
      steps: options.steps ?? [],
      frequency: options.frequency,
      duration_days: options.durationDays,
      indicators: options.indicators ?? [],
      status: 'draft',
    })
    .select('id')
    .single();

  return data?.id ?? null;
}

// ─── Quick Actions (orchestrated shortcuts) ───

export async function quickStudyPlan(userId: string): Promise<OrchestratorResponse> {
  return orchestrate(userId, 'Gere meu plano de estudo otimizado para hoje baseado nas minhas métricas cognitivas, revisões pendentes e prioridades.');
}

export async function quickDailyReview(userId: string): Promise<OrchestratorResponse> {
  return orchestrate(userId, 'Monte minha sessão de revisão prioritária para agora. Inclua os tópicos com maior risco de esquecimento e gere questões adaptativas.');
}

export async function quickResearchTopic(userId: string, topic: string): Promise<OrchestratorResponse> {
  return orchestrate(userId, `Pesquise em profundidade o tema "${topic}". Use todas as fontes disponíveis, gere uma página wiki e sugira flashcards para memorização.`);
}

export async function quickGenerateContent(userId: string, topic: string, type: 'questions' | 'flashcards' | 'summary'): Promise<OrchestratorResponse> {
  const typeLabels = {
    questions: 'questões de prova no estilo banca',
    flashcards: 'flashcards para revisão espaçada',
    summary: 'resumo esquematizado para revisão rápida',
  };
  return orchestrate(userId, `Gere ${typeLabels[type]} sobre "${topic}" usando os melhores agentes disponíveis.`);
}

// Re-export types
export type { AIProviderKey, IntentType, OrchestratorResponse, AutonomousTask, WikiPage } from './types';
export { AI_PROVIDERS } from './types';
