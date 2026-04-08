/**
 * NEURIX Orchestrator Hooks
 * React Query hooks for the multi-AI orchestration system.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import {
  orchestrate,
  createAutonomousTask,
  executeAutonomousTask,
  getTaskQueue,
  getTaskHistory,
  createWikiPage,
  updateWikiPage,
  searchWiki,
  storeMemory,
  createProtocol,
  quickStudyPlan,
  quickDailyReview,
  quickResearchTopic,
  quickGenerateContent,
} from '@/lib/ai-orchestrator';
import type {
  OrchestratorResponse,
  AutonomousTaskCategory,
  AIProviderKey,
  WikiPageType,
} from '@/lib/ai-orchestrator/types';

// ─── Orchestration ───

export function useOrchestrate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      message,
      context,
    }: {
      message: string;
      context?: Record<string, unknown>;
    }): Promise<OrchestratorResponse> => {
      if (!user) throw new Error('Não autenticado');
      return orchestrate(user.id, message, context);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['task-queue'] });
    },
  });
}

export function useQuickActions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    queryClient.invalidateQueries({ queryKey: ['task-queue'] });
  };

  const studyPlan = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      return quickStudyPlan(user.id);
    },
    onSuccess: invalidateAll,
  });

  const dailyReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      return quickDailyReview(user.id);
    },
    onSuccess: invalidateAll,
  });

  const researchTopic = useMutation({
    mutationFn: async (topic: string) => {
      if (!user) throw new Error('Não autenticado');
      return quickResearchTopic(user.id, topic);
    },
    onSuccess: invalidateAll,
  });

  const generateContent = useMutation({
    mutationFn: async ({ topic, type }: { topic: string; type: 'questions' | 'flashcards' | 'summary' }) => {
      if (!user) throw new Error('Não autenticado');
      return quickGenerateContent(user.id, topic, type);
    },
    onSuccess: invalidateAll,
  });

  return { studyPlan, dailyReview, researchTopic, generateContent };
}

// ─── Pipelines ───

export function usePipelines(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pipelines', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('orchestration_pipelines')
        .select('*, orchestration_tasks(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 5000,
  });
}

// ─── Autonomous Tasks ───

export function useTaskQueue() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['task-queue', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return getTaskQueue(user.id);
    },
    enabled: !!user,
    refetchInterval: 3000,
  });
}

export function useTaskHistory(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['task-history', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      return getTaskHistory(user.id, limit);
    },
    enabled: !!user,
  });
}

export function useCreateTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      category,
      description,
      priority,
      scheduledFor,
      recurringCron,
      assignedProvider,
      inputData,
    }: {
      title: string;
      category: AutonomousTaskCategory;
      description?: string;
      priority?: number;
      scheduledFor?: Date;
      recurringCron?: string;
      assignedProvider?: AIProviderKey;
      inputData?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Não autenticado');
      return createAutonomousTask(user.id, title, category, {
        description,
        priority,
        scheduledFor,
        recurringCron,
        assignedProvider,
        inputData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-queue'] });
    },
  });
}

export function useExecuteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      return executeAutonomousTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-queue'] });
      queryClient.invalidateQueries({ queryKey: ['task-history'] });
    },
  });
}

// ─── Wiki ───

export function useWikiPages(pageType?: WikiPageType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wiki-pages', user?.id, pageType],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('wiki_pages')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (pageType) {
        query = query.eq('page_type', pageType);
      }

      const { data } = await query;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useWikiPage(pageId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wiki-page', pageId],
    queryFn: async () => {
      const { data } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('id', pageId)
        .single();
      return data;
    },
    enabled: !!user && !!pageId,
  });
}

export function useCreateWikiPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      pageType,
      tags,
      aiGenerated,
    }: {
      title: string;
      content: string;
      pageType: WikiPageType;
      tags?: string[];
      aiGenerated?: boolean;
    }) => {
      if (!user) throw new Error('Não autenticado');
      return createWikiPage(user.id, title, content, pageType, { tags, aiGenerated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-pages'] });
    },
  });
}

export function useUpdateWikiPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      content,
      changeSummary,
      changedBy,
    }: {
      pageId: string;
      content: string;
      changeSummary: string;
      changedBy?: string;
    }) => {
      if (!user) throw new Error('Não autenticado');
      return updateWikiPage(pageId, user.id, content, changeSummary, changedBy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-pages'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-page'] });
    },
  });
}

export function useSearchWiki() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (query: string) => {
      if (!user) return [];
      return searchWiki(user.id, query);
    },
  });
}

// ─── Agent Memory ───

export function useAgentMemories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-memories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('agent_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('importance', { ascending: false })
        .order('last_accessed_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useStoreMemory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memoryType,
      content,
      importance,
    }: {
      memoryType: string;
      content: string;
      importance?: number;
    }) => {
      if (!user) throw new Error('Não autenticado');
      return storeMemory(user.id, memoryType, content, importance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-memories'] });
    },
  });
}

// ─── Protocols ───

export function useProtocols() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['protocols', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('study_protocols')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useCreateProtocol() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      objective,
      hypothesis,
      steps,
      frequency,
      durationDays,
      indicators,
    }: {
      title: string;
      objective?: string;
      hypothesis?: string;
      steps?: Array<{ order: number; description: string; duration_minutes: number }>;
      frequency?: string;
      durationDays?: number;
      indicators?: Array<{ name: string; target: number; unit: string }>;
    }) => {
      if (!user) throw new Error('Não autenticado');
      return createProtocol(user.id, title, {
        objective,
        hypothesis,
        steps,
        frequency,
        durationDays,
        indicators,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocols'] });
    },
  });
}

// ─── AI Providers ───

export function useAIProviders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-providers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('user_id', user.id);
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useUpdateAIProvider() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerKey,
      displayName,
      apiKey,
      modelId,
      isActive,
      config,
    }: {
      providerKey: string;
      displayName: string;
      apiKey?: string;
      modelId?: string;
      isActive?: boolean;
      config?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Não autenticado');
      return supabase.from('ai_providers').upsert({
        user_id: user.id,
        provider_key: providerKey,
        display_name: displayName,
        api_key_encrypted: apiKey,
        model_id: modelId,
        is_active: isActive ?? true,
        config: config ?? {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
    },
  });
}
