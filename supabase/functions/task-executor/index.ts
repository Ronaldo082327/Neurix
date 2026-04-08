import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * NEURIX Task Executor
 * Executes autonomous tasks: generates content, updates wiki, schedules reviews,
 * syncs Obsidian, and more — all orchestrated by Claude.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { task } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, supabaseKey);

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    let result: Record<string, unknown> = {};

    switch (task.task_category) {
      case "study": {
        result = await executeStudyTask(db, task, lovableKey);
        break;
      }
      case "review": {
        result = await executeReviewTask(db, task, lovableKey);
        break;
      }
      case "wiki": {
        result = await executeWikiTask(db, task, lovableKey);
        break;
      }
      case "flashcard": {
        result = await executeFlashcardTask(db, task, lovableKey);
        break;
      }
      case "question": {
        result = await executeQuestionTask(db, task, lovableKey);
        break;
      }
      case "research": {
        result = await executeResearchTask(db, task, lovableKey);
        break;
      }
      case "organization": {
        result = await executeOrganizationTask(db, task, lovableKey);
        break;
      }
      case "protocol": {
        result = await executeProtocolTask(db, task, lovableKey);
        break;
      }
      default: {
        result = { message: `Categoria "${task.task_category}" não implementada ainda.` };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Task executor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Task Executors ───

async function callAI(prompt: string, lovableKey: string | undefined): Promise<string> {
  if (!lovableKey) return "API key não configurada";

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) return `Erro da IA: ${res.status}`;
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function executeStudyTask(db: any, task: any, apiKey: string | undefined) {
  const { data: topics } = await db
    .from("topics")
    .select("id, name, mastery_score, retention_score, priority_score, disciplines(name)")
    .eq("user_id", task.user_id)
    .order("priority_score", { ascending: false })
    .limit(10);

  const topicList = topics?.map((t: any) =>
    `- ${t.name} (${t.disciplines?.name}): Domínio ${t.mastery_score}%, Retenção ${t.retention_score}%, Prioridade ${t.priority_score}`
  ).join("\n") ?? "Nenhum tópico encontrado";

  const plan = await callAI(
    `Você é o Coach NEURIX. Com base nos tópicos abaixo, gere um plano de estudo otimizado para hoje.
    Inclua: blocos de tempo, prioridade, tipo de atividade (estudo novo, revisão, questões).

    Tópicos do estudante:\n${topicList}

    ${task.input_data?.preferences ? `Preferências: ${JSON.stringify(task.input_data.preferences)}` : ""}

    Responda em JSON: { blocks: [{ time: "09:00", duration: 60, topic: "...", activity: "...", reason: "..." }] }`,
    apiKey
  );

  return { plan, topicsAnalyzed: topics?.length ?? 0 };
}

async function executeReviewTask(db: any, task: any, apiKey: string | undefined) {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  const { data: reviews } = await db
    .from("reviews")
    .select("*, topics(name, mastery_score, disciplines(name))")
    .eq("user_id", task.user_id)
    .eq("status", "pending")
    .lte("scheduled_at", now.toISOString())
    .order("scheduled_at")
    .limit(10);

  const reviewList = reviews?.map((r: any) =>
    `- ${r.topics?.name} (${r.topics?.disciplines?.name}): Domínio ${r.topics?.mastery_score}%`
  ).join("\n") ?? "Nenhuma revisão pendente";

  const session = await callAI(
    `Monte uma sessão de revisão otimizada com os seguintes tópicos pendentes:
    ${reviewList}

    Para cada tópico, sugira: tipo de revisão (flashcard, questão, resumo), duração estimada, dicas.
    Responda em JSON: { session: [{ topic: "...", reviewType: "...", duration: 15, tips: "..." }] }`,
    apiKey
  );

  return { session, reviewsFound: reviews?.length ?? 0 };
}

async function executeWikiTask(db: any, task: any, apiKey: string | undefined) {
  const topic = task.input_data?.topic ?? "tema não especificado";

  const wikiContent = await callAI(
    `Gere uma página wiki completa sobre "${topic}" no formato NEURIX.

    Estrutura obrigatória:
    # ${topic}

    ## Definição
    ## Conceitos-Chave
    ## Relações com Outros Temas
    ## Exemplos e Aplicações
    ## Pontos de Atenção para Provas
    ## Fontes e Referências

    Escreva em Markdown. Seja denso e preciso. Use linguagem acadêmica acessível.`,
    apiKey
  );

  const slug = topic
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: page } = await db.from("wiki_pages").insert({
    user_id: task.user_id,
    title: topic,
    slug,
    content: wikiContent,
    page_type: "concept",
    tags: task.input_data?.tags ?? [],
    ai_generated: true,
    last_updated_by: "claude",
  }).select("id").single();

  return { pageId: page?.id, slug, contentLength: wikiContent.length };
}

async function executeFlashcardTask(db: any, task: any, apiKey: string | undefined) {
  const topic = task.input_data?.topic ?? "tema geral";
  const count = task.input_data?.count ?? 10;

  const cardsJson = await callAI(
    `Gere ${count} flashcards de alta qualidade sobre "${topic}" para revisão espaçada.

    Cada flashcard deve ter:
    - front: pergunta clara e específica
    - back: resposta concisa com conceito-chave

    Foque em conceitos que caem em provas de concurso.
    Responda APENAS em JSON: { cards: [{ front: "...", back: "..." }] }`,
    apiKey
  );

  let cards: Array<{ front: string; back: string }> = [];
  try {
    const parsed = JSON.parse(cardsJson.replace(/```json?\n?/g, "").replace(/```/g, ""));
    cards = parsed.cards ?? [];
  } catch {
    return { error: "Falha ao parsear flashcards", raw: cardsJson };
  }

  let created = 0;
  for (const card of cards) {
    await db.from("flashcards").insert({
      user_id: task.user_id,
      front_text: card.front,
      back_text: card.back,
      source: "ai_generated",
      topic_id: task.input_data?.topicId,
      discipline_id: task.input_data?.disciplineId,
    });
    created++;
  }

  return { created, total: cards.length };
}

async function executeQuestionTask(db: any, task: any, apiKey: string | undefined) {
  const topic = task.input_data?.topic ?? "tema geral";
  const count = task.input_data?.count ?? 5;

  const questionsJson = await callAI(
    `Gere ${count} questões de múltipla escolha sobre "${topic}" no estilo de concursos públicos brasileiros.

    Cada questão deve ter:
    - question: enunciado completo
    - options: array de 4 alternativas
    - correctIndex: índice da correta (0-3)
    - explanation: explicação da resposta
    - difficulty: 1 a 5

    Responda APENAS em JSON: { questions: [...] }`,
    apiKey
  );

  let questions: any[] = [];
  try {
    const parsed = JSON.parse(questionsJson.replace(/```json?\n?/g, "").replace(/```/g, ""));
    questions = parsed.questions ?? [];
  } catch {
    return { error: "Falha ao parsear questões", raw: questionsJson };
  }

  let created = 0;
  for (const q of questions) {
    const { data: question } = await db.from("questions").insert({
      user_id: task.user_id,
      question_text: q.question,
      explanation: q.explanation,
      difficulty: q.difficulty ?? 3,
      source: "ai_generated",
      topic_id: task.input_data?.topicId,
      discipline_id: task.input_data?.disciplineId,
    }).select("id").single();

    if (question && q.options) {
      for (let i = 0; i < q.options.length; i++) {
        await db.from("question_options").insert({
          question_id: question.id,
          option_text: q.options[i],
          is_correct: i === q.correctIndex,
          option_order: i,
        });
      }
    }
    created++;
  }

  return { created, total: questions.length };
}

async function executeResearchTask(_db: any, task: any, apiKey: string | undefined) {
  const topic = task.input_data?.topic ?? "tema não especificado";

  const research = await callAI(
    `Faça uma pesquisa aprofundada sobre "${topic}" para um estudante de concursos públicos.

    Inclua:
    1. Visão geral do tema
    2. Principais correntes doutrinárias
    3. Jurisprudência relevante (se aplicável)
    4. Pontos mais cobrados em provas
    5. Pegadinhas comuns
    6. Conexões com outros temas
    7. Sugestão de materiais complementares

    Seja denso, preciso e cite fundamentos legais quando relevante.`,
    apiKey
  );

  return { research, topic };
}

async function executeOrganizationTask(db: any, task: any, _apiKey: string | undefined) {
  // Recalculate priorities, clean up old reviews, organize the study plan
  const { data: topics } = await db
    .from("topics")
    .select("id, mastery_score, retention_score, last_studied_at, review_count")
    .eq("user_id", task.user_id);

  let updated = 0;
  const now = new Date();

  for (const topic of topics ?? []) {
    const lastStudied = topic.last_studied_at ? new Date(topic.last_studied_at) : null;
    const hoursSince = lastStudied
      ? (now.getTime() - lastStudied.getTime()) / (1000 * 60 * 60)
      : 720;

    const decayRate = 0.1 / Math.max(1, topic.review_count ?? 1);
    const retention = Math.max(0, 100 * Math.exp(-decayRate * hoursSince));

    const knowledgeGap = 100 - (topic.mastery_score ?? 0);
    const priority = 0.7 * knowledgeGap + 0.3 * (100 - retention);

    await db.from("topics").update({
      retention_score: Math.round(retention * 100) / 100,
      priority_score: Math.round(priority * 100) / 100,
    }).eq("id", topic.id);

    updated++;
  }

  return { topicsUpdated: updated };
}

async function executeProtocolTask(db: any, task: any, apiKey: string | undefined) {
  const goal = task.input_data?.goal ?? "melhorar desempenho";

  const protocol = await callAI(
    `Crie um protocolo de estudo personalizado para o objetivo: "${goal}".

    Formato JSON:
    {
      "title": "...",
      "objective": "...",
      "hypothesis": "...",
      "steps": [{ "order": 1, "description": "...", "duration_minutes": 30 }],
      "frequency": "daily|weekly",
      "duration_days": 30,
      "indicators": [{ "name": "...", "target": 80, "unit": "%" }]
    }`,
    apiKey
  );

  try {
    const parsed = JSON.parse(protocol.replace(/```json?\n?/g, "").replace(/```/g, ""));
    await db.from("study_protocols").insert({
      user_id: task.user_id,
      title: parsed.title,
      objective: parsed.objective,
      hypothesis: parsed.hypothesis,
      steps: parsed.steps,
      frequency: parsed.frequency,
      duration_days: parsed.duration_days,
      indicators: parsed.indicators,
      status: "draft",
    });
    return { protocol: parsed };
  } catch {
    return { error: "Falha ao parsear protocolo", raw: protocol };
  }
}
