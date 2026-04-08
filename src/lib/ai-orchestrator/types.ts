/**
 * NEURIX Multi-AI Orchestrator Type System
 * Claude is the central brain that routes, decomposes, and synthesizes across all providers.
 */

// ─── AI Provider System ───

export type AIProviderKey = 'claude' | 'gemini' | 'chatgpt' | 'codex' | 'antigravity' | 'notebooklm';

export type AICapability =
  | 'reasoning'      // Complex analysis, metacognition
  | 'research'       // Source-grounded research, citations
  | 'code'           // Code generation, automation
  | 'creative'       // Creative content, explanations
  | 'synthesis'      // Cross-source synthesis
  | 'review'         // Spaced repetition, quiz generation
  | 'coaching'       // Motivational, strategic guidance
  | 'extraction'     // Document/PDF concept extraction
  | 'audio'          // Podcast/audio generation
  | 'visual'         // Diagrams, mind maps
  | 'automation'     // Task automation, workflows
  | 'wiki'           // Knowledge base maintenance
  | 'obsidian';      // Vault management

export interface AIProvider {
  key: AIProviderKey;
  displayName: string;
  description: string;
  capabilities: AICapability[];
  icon: string; // lucide icon name
  color: string; // brand color
  isActive: boolean;
  model?: string;
  maxTokens?: number;
}

export const AI_PROVIDERS: Record<AIProviderKey, Omit<AIProvider, 'isActive'>> = {
  claude: {
    key: 'claude',
    displayName: 'Claude',
    description: 'Orquestrador central. Raciocínio profundo, síntese e coordenação de todos os agentes.',
    capabilities: ['reasoning', 'synthesis', 'coaching', 'wiki', 'creative', 'code'],
    icon: 'Brain',
    color: '#D97706',
    model: 'claude-sonnet-4-20250514',
  },
  gemini: {
    key: 'gemini',
    displayName: 'Gemini',
    description: 'Pesquisa multimodal, análise de documentos e integração com NotebookLM.',
    capabilities: ['research', 'extraction', 'visual', 'synthesis'],
    icon: 'Sparkles',
    color: '#4285F4',
    model: 'gemini-2.5-flash',
  },
  chatgpt: {
    key: 'chatgpt',
    displayName: 'ChatGPT',
    description: 'Geração criativa de conteúdo, explicações didáticas e questões de prova.',
    capabilities: ['creative', 'review', 'coaching'],
    icon: 'MessageCircle',
    color: '#10A37F',
    model: 'gpt-4o',
  },
  codex: {
    key: 'codex',
    displayName: 'Codex',
    description: 'Agente autônomo de código. Automação, scripts, processamento de dados e integrações.',
    capabilities: ['code', 'automation'],
    icon: 'Terminal',
    color: '#6366F1',
    model: 'codex-mini',
  },
  antigravity: {
    key: 'antigravity',
    displayName: 'Antigravity',
    description: 'Motor de inovação. Pensamento lateral, quebra de paradigmas e conexões inesperadas.',
    capabilities: ['creative', 'reasoning', 'synthesis'],
    icon: 'Rocket',
    color: '#EC4899',
  },
  notebooklm: {
    key: 'notebooklm',
    displayName: 'NotebookLM',
    description: 'Pesquisa fundamentada em fontes. Podcasts, quizzes, flashcards e análise documental.',
    capabilities: ['research', 'extraction', 'audio', 'review'],
    icon: 'BookOpen',
    color: '#F59E0B',
  },
};

// ─── Orchestration Pipeline ───

export type IntentType =
  | 'study_plan'     // Generate/adjust study plan
  | 'review'         // Manage reviews and spaced repetition
  | 'research'       // Research a topic in depth
  | 'task'           // Execute an autonomous task
  | 'synthesis'      // Synthesize knowledge across sources
  | 'coach'          // Coaching interaction
  | 'wiki'           // Create/update wiki pages
  | 'question'       // Generate practice questions
  | 'flashcard'      // Generate flashcards
  | 'protocol'       // Create/manage study protocol
  | 'obsidian'       // Obsidian vault operations
  | 'general';       // General query

export type PipelineStatus = 'planning' | 'routing' | 'executing' | 'synthesizing' | 'completed' | 'failed';

export interface OrchestrationPipeline {
  id: string;
  userId: string;
  intent: string;
  intentType: IntentType;
  status: PipelineStatus;
  orchestratorReasoning?: string;
  finalResult?: string;
  tasks: OrchestrationTask[];
  createdAt: Date;
  completedAt?: Date;
}

export type TaskType = 'reason' | 'research' | 'generate' | 'code' | 'analyze' | 'synthesize' | 'execute';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface OrchestrationTask {
  id: string;
  pipelineId: string;
  providerKey: AIProviderKey;
  taskType: TaskType;
  prompt: string;
  result?: string;
  status: TaskStatus;
  priority: number;
  dependsOn?: string[];
  executionTimeMs?: number;
  tokensUsed?: number;
}

// ─── Autonomous Task System ───

export type AutonomousTaskCategory =
  | 'study'
  | 'review'
  | 'research'
  | 'organization'
  | 'wiki'
  | 'flashcard'
  | 'question'
  | 'protocol'
  | 'obsidian_sync';

export type AutonomousTaskStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface AutonomousTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  taskCategory: AutonomousTaskCategory;
  status: AutonomousTaskStatus;
  priority: number;
  scheduledFor?: Date;
  recurringCron?: string;
  assignedProvider: AIProviderKey;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  progress: number;
  parentTaskId?: string;
  children?: AutonomousTask[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// ─── Wiki System ───

export type WikiPageType = 'concept' | 'entity' | 'comparison' | 'synthesis' | 'index' | 'protocol' | 'experiment';

export interface WikiPage {
  id: string;
  userId: string;
  title: string;
  slug: string;
  content: string;
  pageType: WikiPageType;
  disciplineId?: string;
  topicId?: string;
  tags: string[];
  sources: WikiSource[];
  aiGenerated: boolean;
  lastUpdatedBy: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WikiSource {
  type: 'document' | 'note' | 'topic' | 'url' | 'notebooklm';
  id?: string;
  title: string;
  url?: string;
}

// ─── Routing Decision ───

export interface RoutingDecision {
  providerKey: AIProviderKey;
  taskType: TaskType;
  prompt: string;
  priority: number;
  dependsOn?: string[];
  reasoning: string;
}

// ─── Agent Memory ───

export interface AgentMemory {
  id: string;
  userId: string;
  memoryType: 'user_profile' | 'learning_pattern' | 'preference' | 'insight' | 'strategy';
  content: string;
  importance: number;
  lastAccessedAt: Date;
  accessCount: number;
}

// ─── Orchestrator Response ───

export interface OrchestratorResponse {
  pipelineId: string;
  status: PipelineStatus;
  reasoning: string;
  tasks: OrchestrationTask[];
  finalResult?: string;
  actionsExecuted?: string[];
  suggestedFollowUps?: string[];
}
