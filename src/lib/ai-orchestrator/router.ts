/**
 * NEURIX AI Router
 * Claude analyzes user intent and decomposes into optimal sub-tasks
 * routed to the best AI provider for each piece.
 */

import type { AIProviderKey, IntentType, RoutingDecision, TaskType } from './types';

// ─── Intent Classification ───

const INTENT_PATTERNS: Array<{ pattern: RegExp; type: IntentType }> = [
  { pattern: /\b(plano|planej|agenda|cronograma|organiz)/i, type: 'study_plan' },
  { pattern: /\b(revis[aã]o|revisar|espa[cç]ad|repetir)/i, type: 'review' },
  { pattern: /\b(pesquis|investig|aprofund|analis|fonte)/i, type: 'research' },
  { pattern: /\b(execut|automat|rodar|processar|script)/i, type: 'task' },
  { pattern: /\b(s[ií]ntese|sintetiz|consolid|resum|compar)/i, type: 'synthesis' },
  { pattern: /\b(coach|motiv|estrat[eé]g|orient|conselho)/i, type: 'coach' },
  { pattern: /\b(wiki|p[aá]gina|conceito|entidade)/i, type: 'wiki' },
  { pattern: /\b(quest[aã]o|quest[oõ]es|prova|exerc[ií]cio|simul)/i, type: 'question' },
  { pattern: /\b(flash|cart[aã]o|memoriz)/i, type: 'flashcard' },
  { pattern: /\b(protocolo|experiment|h[aá]bito|rotina)/i, type: 'protocol' },
  { pattern: /\b(obsidian|vault|nota|markdown|sync)/i, type: 'obsidian' },
];

export function classifyIntent(userMessage: string): IntentType {
  for (const { pattern, type } of INTENT_PATTERNS) {
    if (pattern.test(userMessage)) return type;
  }
  return 'general';
}

// ─── Capability-based Routing ───

/** Maps intent types to the optimal provider routing strategy */
const ROUTING_STRATEGIES: Record<IntentType, RoutingDecision[]> = {
  study_plan: [
    { providerKey: 'claude', taskType: 'reason', prompt: '', priority: 1, reasoning: 'Claude analisa estado cognitivo e decide prioridades' },
    { providerKey: 'gemini', taskType: 'research', prompt: '', priority: 2, reasoning: 'Gemini pesquisa padrões de desempenho nas fontes' },
    { providerKey: 'claude', taskType: 'synthesize', prompt: '', priority: 3, dependsOn: [], reasoning: 'Claude sintetiza plano final personalizado' },
  ],
  review: [
    { providerKey: 'claude', taskType: 'analyze', prompt: '', priority: 1, reasoning: 'Claude calcula prioridades de revisão via BKT' },
    { providerKey: 'chatgpt', taskType: 'generate', prompt: '', priority: 2, reasoning: 'ChatGPT gera questões de revisão adaptativas' },
    { providerKey: 'notebooklm', taskType: 'research', prompt: '', priority: 2, reasoning: 'NotebookLM gera flashcards fundamentados' },
  ],
  research: [
    { providerKey: 'notebooklm', taskType: 'research', prompt: '', priority: 1, reasoning: 'NotebookLM pesquisa nas fontes com citações' },
    { providerKey: 'gemini', taskType: 'research', prompt: '', priority: 1, reasoning: 'Gemini faz análise multimodal dos documentos' },
    { providerKey: 'claude', taskType: 'synthesize', prompt: '', priority: 2, dependsOn: [], reasoning: 'Claude sintetiza achados em wiki page' },
  ],
  task: [
    { providerKey: 'claude', taskType: 'reason', prompt: '', priority: 1, reasoning: 'Claude decompõe a tarefa em sub-tarefas' },
    { providerKey: 'codex', taskType: 'execute', prompt: '', priority: 2, reasoning: 'Codex executa automações e scripts' },
  ],
  synthesis: [
    { providerKey: 'gemini', taskType: 'research', prompt: '', priority: 1, reasoning: 'Gemini coleta dados de múltiplas fontes' },
    { providerKey: 'notebooklm', taskType: 'research', prompt: '', priority: 1, reasoning: 'NotebookLM extrai insights citados' },
    { providerKey: 'antigravity', taskType: 'reason', prompt: '', priority: 2, reasoning: 'Antigravity busca conexões não-óbvias' },
    { providerKey: 'claude', taskType: 'synthesize', prompt: '', priority: 3, dependsOn: [], reasoning: 'Claude produz síntese final estruturada' },
  ],
  coach: [
    { providerKey: 'claude', taskType: 'analyze', prompt: '', priority: 1, reasoning: 'Claude analisa contexto e métricas do aluno' },
    { providerKey: 'claude', taskType: 'synthesize', prompt: '', priority: 2, reasoning: 'Claude entrega coaching personalizado' },
  ],
  wiki: [
    { providerKey: 'gemini', taskType: 'research', prompt: '', priority: 1, reasoning: 'Gemini extrai conceitos dos documentos' },
    { providerKey: 'claude', taskType: 'generate', prompt: '', priority: 2, reasoning: 'Claude gera/atualiza página wiki estruturada' },
  ],
  question: [
    { providerKey: 'chatgpt', taskType: 'generate', prompt: '', priority: 1, reasoning: 'ChatGPT gera questões no estilo da banca' },
    { providerKey: 'claude', taskType: 'analyze', prompt: '', priority: 2, reasoning: 'Claude valida e ajusta dificuldade' },
  ],
  flashcard: [
    { providerKey: 'notebooklm', taskType: 'generate', prompt: '', priority: 1, reasoning: 'NotebookLM gera flashcards citando fontes' },
    { providerKey: 'chatgpt', taskType: 'generate', prompt: '', priority: 1, reasoning: 'ChatGPT gera flashcards criativos' },
  ],
  protocol: [
    { providerKey: 'claude', taskType: 'reason', prompt: '', priority: 1, reasoning: 'Claude desenha o protocolo com base em evidências' },
    { providerKey: 'notebooklm', taskType: 'research', prompt: '', priority: 1, reasoning: 'NotebookLM fundamenta com fontes' },
    { providerKey: 'claude', taskType: 'synthesize', prompt: '', priority: 2, dependsOn: [], reasoning: 'Claude finaliza protocolo com indicadores' },
  ],
  obsidian: [
    { providerKey: 'claude', taskType: 'reason', prompt: '', priority: 1, reasoning: 'Claude planeja operações no vault' },
    { providerKey: 'codex', taskType: 'execute', prompt: '', priority: 2, reasoning: 'Codex executa operações de arquivo' },
  ],
  general: [
    { providerKey: 'claude', taskType: 'reason', prompt: '', priority: 1, reasoning: 'Claude analisa e responde diretamente' },
  ],
};

// ─── Dynamic Prompt Builder ───

interface RoutingContext {
  userMessage: string;
  intentType: IntentType;
  coachContext?: Record<string, unknown>;
  recentMemories?: string[];
  activeProtocols?: string[];
}

export function buildRoutingPlan(context: RoutingContext): RoutingDecision[] {
  const baseStrategy = ROUTING_STRATEGIES[context.intentType] ?? ROUTING_STRATEGIES.general;

  return baseStrategy.map((decision, index) => ({
    ...decision,
    prompt: buildProviderPrompt(decision, context, index),
    dependsOn: decision.dependsOn?.length === 0
      ? baseStrategy.filter((_, i) => i < index && decision.priority > baseStrategy[i].priority).map((_, i) => `task_${i}`)
      : decision.dependsOn,
  }));
}

function buildProviderPrompt(
  decision: RoutingDecision,
  context: RoutingContext,
  _index: number
): string {
  const memoryBlock = context.recentMemories?.length
    ? `\n\nMemória do agente:\n${context.recentMemories.join('\n')}`
    : '';

  const protocolBlock = context.activeProtocols?.length
    ? `\n\nProtocolos ativos:\n${context.activeProtocols.join('\n')}`
    : '';

  const coachBlock = context.coachContext
    ? `\n\nContexto do estudante:\n${JSON.stringify(context.coachContext, null, 2)}`
    : '';

  const basePrompts: Record<AIProviderKey, string> = {
    claude: `[NEURIX Orchestrator - Claude Core]
Você é o cérebro central do NEURIX. Seu papel é ${decision.taskType === 'synthesize' ? 'sintetizar resultados dos outros agentes em uma resposta coesa e acionável' : 'analisar profundamente e raciocinar sobre'} a seguinte solicitação do estudante.

Solicitação: ${context.userMessage}
${coachBlock}${memoryBlock}${protocolBlock}

Responda em português do Brasil. Seja estratégico, direto e acionável.`,

    gemini: `[NEURIX Research Agent - Gemini]
Analise a seguinte solicitação buscando informações relevantes nos documentos e fontes disponíveis. Extraia dados concretos, cite fontes quando possível.

Solicitação: ${context.userMessage}
${coachBlock}

Retorne dados estruturados que possam ser sintetizados pelo orquestrador.`,

    chatgpt: `[NEURIX Content Agent - ChatGPT]
Gere conteúdo educacional de alta qualidade para a seguinte solicitação. Foque em didática, clareza e engajamento.

Solicitação: ${context.userMessage}
${coachBlock}

Formato: ${decision.taskType === 'generate' ? 'Conteúdo pronto para uso direto pelo estudante' : 'Análise estruturada'}`,

    codex: `[NEURIX Automation Agent - Codex]
Execute a seguinte tarefa de automação. Gere código limpo, testável e com tratamento de erros.

Tarefa: ${context.userMessage}

Retorne o resultado da execução ou o código gerado.`,

    antigravity: `[NEURIX Innovation Agent - Antigravity]
Pense lateralmente sobre a seguinte solicitação. Busque conexões não-óbvias, analogias de outros campos, e insights que quebrem paradigmas convencionais de estudo.

Solicitação: ${context.userMessage}
${memoryBlock}

Surpreenda com perspectivas que o estudante não teria sozinho.`,

    notebooklm: `[NEURIX Research Agent - NotebookLM]
Pesquise nas fontes do notebook a seguinte solicitação. Cada afirmação deve ter citação da fonte original.

Solicitação: ${context.userMessage}

Retorne um relatório fundamentado com citações.`,
  };

  return basePrompts[decision.providerKey];
}

// ─── Intelligent Provider Selection ───

export function selectBestProvider(
  taskType: TaskType,
  availableProviders: AIProviderKey[]
): AIProviderKey {
  const preferences: Record<TaskType, AIProviderKey[]> = {
    reason: ['claude', 'antigravity', 'gemini'],
    research: ['notebooklm', 'gemini', 'claude'],
    generate: ['chatgpt', 'claude', 'gemini'],
    code: ['codex', 'claude', 'chatgpt'],
    analyze: ['claude', 'gemini', 'chatgpt'],
    synthesize: ['claude', 'gemini', 'chatgpt'],
    execute: ['codex', 'claude', 'chatgpt'],
  };

  const ranked = preferences[taskType] ?? ['claude'];
  return ranked.find(p => availableProviders.includes(p)) ?? 'claude';
}
