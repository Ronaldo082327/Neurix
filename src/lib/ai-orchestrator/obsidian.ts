/**
 * NEURIX Obsidian Integration Layer
 *
 * Manages bidirectional sync between the NEURIX platform and Obsidian vault.
 * Generates Markdown files compatible with Obsidian, manages wiki pages,
 * and syncs study protocols, flashcards, and reviews.
 */

import { supabase } from '@/integrations/supabase/client';
import type { WikiPage } from './types';

// ─── Markdown Generation ───

export function wikiPageToMarkdown(page: WikiPage): string {
  const frontmatter = [
    '---',
    `title: "${page.title}"`,
    `type: ${page.pageType}`,
    `tags: [${page.tags.map(t => `"${t}"`).join(', ')}]`,
    `created: ${new Date(page.createdAt).toISOString().split('T')[0]}`,
    `updated: ${new Date(page.updatedAt).toISOString().split('T')[0]}`,
    `ai_generated: ${page.aiGenerated}`,
    `last_updated_by: ${page.lastUpdatedBy}`,
    `version: ${page.version}`,
    `neurix_id: ${page.id}`,
    '---',
    '',
  ].join('\n');

  return frontmatter + page.content;
}

export function studyPlanToMarkdown(plan: {
  date: string;
  blocks: Array<{ time: string; duration: number; topic: string; activity: string; reason: string }>;
}): string {
  const lines = [
    '---',
    `title: "Plano de Estudo - ${plan.date}"`,
    'type: study_plan',
    `date: ${plan.date}`,
    '---',
    '',
    `# Plano de Estudo - ${plan.date}`,
    '',
  ];

  for (const block of plan.blocks) {
    lines.push(`## ${block.time} - ${block.topic} (${block.duration}min)`);
    lines.push(`- **Atividade:** ${block.activity}`);
    lines.push(`- **Razão:** ${block.reason}`);
    lines.push('- [ ] Concluído');
    lines.push('');
  }

  return lines.join('\n');
}

export function flashcardsToMarkdown(cards: Array<{ front: string; back: string }>, topic: string): string {
  const lines = [
    '---',
    `title: "Flashcards - ${topic}"`,
    'type: flashcards',
    `topic: "${topic}"`,
    `count: ${cards.length}`,
    '---',
    '',
    `# Flashcards: ${topic}`,
    '',
  ];

  cards.forEach((card, i) => {
    lines.push(`## Card ${i + 1}`);
    lines.push(`**Pergunta:** ${card.front}`);
    lines.push('');
    lines.push(`> **Resposta:** ${card.back}`);
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

export function reviewSessionToMarkdown(session: {
  date: string;
  reviews: Array<{ topic: string; reviewType: string; quality: number; notes: string }>;
}): string {
  const lines = [
    '---',
    `title: "Sessão de Revisão - ${session.date}"`,
    'type: review_session',
    `date: ${session.date}`,
    '---',
    '',
    `# Sessão de Revisão - ${session.date}`,
    '',
  ];

  for (const review of session.reviews) {
    const emoji = review.quality >= 4 ? '🟢' : review.quality >= 2 ? '🟡' : '🔴';
    lines.push(`## ${emoji} ${review.topic}`);
    lines.push(`- **Tipo:** ${review.reviewType}`);
    lines.push(`- **Qualidade:** ${review.quality}/5`);
    if (review.notes) lines.push(`- **Notas:** ${review.notes}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function protocolToMarkdown(protocol: {
  title: string;
  objective: string;
  hypothesis: string;
  steps: Array<{ order: number; description: string; duration_minutes: number }>;
  frequency: string;
  durationDays: number;
  indicators: Array<{ name: string; target: number; unit: string }>;
}): string {
  const lines = [
    '---',
    `title: "${protocol.title}"`,
    'type: protocol',
    `frequency: ${protocol.frequency}`,
    `duration_days: ${protocol.durationDays}`,
    '---',
    '',
    `# ${protocol.title}`,
    '',
    `## Objetivo`,
    protocol.objective,
    '',
    `## Hipótese`,
    protocol.hypothesis,
    '',
    `## Passos`,
  ];

  for (const step of protocol.steps) {
    lines.push(`${step.order}. ${step.description} *(${step.duration_minutes} min)*`);
  }

  lines.push('', '## Indicadores', '');
  for (const indicator of protocol.indicators) {
    lines.push(`- **${indicator.name}:** meta ${indicator.target}${indicator.unit}`);
  }

  lines.push('', '## Observações Diárias', '');
  lines.push('| Data | Adesão | Observação |');
  lines.push('|------|--------|------------|');
  lines.push('| | | |');

  return lines.join('\n');
}

export function cognitiveReportToMarkdown(report: {
  date: string;
  overallMastery: number;
  overallRetention: number;
  streak: number;
  weeklyHours: number;
  topStrengths: string[];
  topWeaknesses: string[];
  recommendations: string[];
}): string {
  const lines = [
    '---',
    `title: "Relatório Cognitivo - ${report.date}"`,
    'type: cognitive_report',
    `date: ${report.date}`,
    '---',
    '',
    `# Relatório Cognitivo - ${report.date}`,
    '',
    '## Métricas Gerais',
    `- **Domínio médio:** ${report.overallMastery.toFixed(1)}%`,
    `- **Retenção média:** ${report.overallRetention.toFixed(1)}%`,
    `- **Sequência:** ${report.streak} dias`,
    `- **Horas esta semana:** ${report.weeklyHours.toFixed(1)}h`,
    '',
    '## Pontos Fortes',
    ...report.topStrengths.map(s => `- ✅ ${s}`),
    '',
    '## Pontos a Melhorar',
    ...report.topWeaknesses.map(w => `- ⚠️ ${w}`),
    '',
    '## Recomendações do Coach',
    ...report.recommendations.map((r, i) => `${i + 1}. ${r}`),
  ];

  return lines.join('\n');
}

// ─── Vault Structure Generator ───

export function generateVaultStructure(): string[] {
  return [
    '00_Inbox/',
    '01_Dashboard/',
    '02_Areas_da_Vida/',
    '02_Areas_da_Vida/Concursos/',
    '02_Areas_da_Vida/Pesquisa/',
    '02_Areas_da_Vida/Biblioteca/',
    '02_Areas_da_Vida/Saude/',
    '03_Projetos/',
    '03_Projetos/Projeto_NEURIX/',
    '04_Fontes_Originais/',
    '05_Notas_de_Referencia/',
    '06_Notas_Permanentes/',
    '07_Wiki_Viva/',
    '07_Wiki_Viva/Conceitos/',
    '07_Wiki_Viva/Entidades/',
    '07_Wiki_Viva/Comparacoes/',
    '07_Wiki_Viva/Indices/',
    '08_Protocolos_e_Experimentos/',
    '09_Revisao_e_Memoria/',
    '09_Revisao_e_Memoria/Flashcards/',
    '09_Revisao_e_Memoria/Caderno_de_Erros/',
    '10_Journal/',
    '11_Acoes/',
    '12_Templates/',
    '90_Sistemas/',
    '90_Sistemas/NEURIX/',
    '90_Sistemas/NEURIX/00_Manifesto/',
    '90_Sistemas/NEURIX/01_Arquitetura/',
    '90_Sistemas/NEURIX/02_Modelo_Cognitivo/',
    '90_Sistemas/NEURIX/03_Engine_de_Estudo/',
  ];
}

// ─── Obsidian Sync Operations ───

export async function getObsidianSyncStatus(userId: string) {
  const { data } = await supabase
    .from('obsidian_sync')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

export async function initializeObsidianSync(userId: string, vaultPath: string) {
  const { data } = await supabase
    .from('obsidian_sync')
    .upsert({
      user_id: userId,
      vault_path: vaultPath,
      sync_status: 'connected',
      last_sync_at: new Date().toISOString(),
      config: {
        folders: generateVaultStructure(),
        autoSync: true,
        syncInterval: 300, // 5 minutes
        excludePatterns: ['.obsidian/', '.trash/'],
      },
    })
    .select()
    .single();

  return data;
}

export async function exportWikiToVault(userId: string): Promise<{ files: string[]; content: Record<string, string> }> {
  const { data: pages } = await supabase
    .from('wiki_pages')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (!pages?.length) return { files: [], content: {} };

  const files: string[] = [];
  const content: Record<string, string> = {};

  for (const page of pages) {
    const typeFolders: Record<string, string> = {
      concept: '07_Wiki_Viva/Conceitos',
      entity: '07_Wiki_Viva/Entidades',
      comparison: '07_Wiki_Viva/Comparacoes',
      synthesis: '07_Wiki_Viva/Indices',
      index: '07_Wiki_Viva/Indices',
      protocol: '08_Protocolos_e_Experimentos',
      experiment: '08_Protocolos_e_Experimentos',
    };

    const folder = typeFolders[page.page_type] ?? '07_Wiki_Viva';
    const filePath = `${folder}/${page.slug}.md`;
    const markdown = wikiPageToMarkdown(page as any);

    files.push(filePath);
    content[filePath] = markdown;
  }

  return { files, content };
}
