import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Provider Endpoints ───
const PROVIDERS: Record<string, { url: string; envKey: string; model: string }> = {
  claude: {
    url: "https://api.anthropic.com/v1/messages",
    envKey: "ANTHROPIC_API_KEY",
    model: "claude-sonnet-4-20250514",
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    envKey: "GOOGLE_AI_KEY",
    model: "gemini-2.5-flash",
  },
  chatgpt: {
    url: "https://api.openai.com/v1/chat/completions",
    envKey: "OPENAI_API_KEY",
    model: "gpt-4o",
  },
  codex: {
    url: "https://api.openai.com/v1/chat/completions",
    envKey: "OPENAI_API_KEY",
    model: "gpt-4o",
  },
  antigravity: {
    url: "https://api.anthropic.com/v1/messages",
    envKey: "ANTHROPIC_API_KEY",
    model: "claude-sonnet-4-20250514",
  },
  notebooklm: {
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    envKey: "GOOGLE_AI_KEY",
    model: "gemini-2.5-flash",
  },
};

// ─── Lovable Gateway Fallback ───
const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callProvider(providerKey: string, prompt: string): Promise<string> {
  const provider = PROVIDERS[providerKey];
  if (!provider) return `[${providerKey}] Provider não configurado`;

  const apiKey = Deno.env.get(provider.envKey);
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  // Try dedicated API first, fallback to Lovable gateway
  if (apiKey && (providerKey === "claude" || providerKey === "antigravity")) {
    return await callClaude(apiKey, provider.model, prompt);
  }

  if (apiKey && (providerKey === "gemini" || providerKey === "notebooklm")) {
    return await callGemini(apiKey, provider.model, prompt);
  }

  if (apiKey && (providerKey === "chatgpt" || providerKey === "codex")) {
    return await callOpenAI(apiKey, provider.model, prompt);
  }

  // Fallback: use Lovable gateway
  if (lovableKey) {
    return await callLovableGateway(lovableKey, prompt, providerKey);
  }

  return `[${providerKey}] Nenhuma API key configurada. Configure nas Configurações > Agentes IA.`;
}

async function callClaude(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Claude error:", err);
    return `[Claude] Erro: ${res.status}`;
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini error:", err);
    return `[Gemini] Erro: ${res.status}`;
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OpenAI error:", err);
    return `[OpenAI] Erro: ${res.status}`;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callLovableGateway(apiKey: string, prompt: string, providerHint: string): Promise<string> {
  const model = providerHint === "chatgpt" || providerHint === "codex"
    ? "openai/gpt-4o"
    : "google/gemini-3-flash-preview";

  const res = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    return `[Gateway] Erro: ${res.status}`;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Pipeline Executor ───

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pipelineId, tasks, context } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, supabaseKey);

    const results: Record<string, string> = {};
    const tasksByPriority = [...tasks].sort((a: any, b: any) => a.priority - b.priority);

    // Group by priority for parallel execution
    const priorityGroups = new Map<number, any[]>();
    for (const task of tasksByPriority) {
      const group = priorityGroups.get(task.priority) ?? [];
      group.push(task);
      priorityGroups.set(task.priority, group);
    }

    // Execute each priority level
    for (const [_priority, group] of [...priorityGroups].sort(([a], [b]) => a - b)) {
      // Check dependencies
      const readyTasks = group.filter((t: any) => {
        if (!t.depends_on?.length) return true;
        return t.depends_on.every((depId: string) => results[depId]);
      });

      // Execute in parallel within same priority
      const execPromises = readyTasks.map(async (task: any) => {
        const startTime = Date.now();

        await db.from("orchestration_tasks").update({ status: "running" }).eq("id", task.id);

        // Enrich prompt with previous results if this is a synthesis task
        let enrichedPrompt = task.prompt;
        if (task.task_type === "synthesize" && Object.keys(results).length > 0) {
          enrichedPrompt += `\n\n─── Resultados dos agentes anteriores ───\n${
            Object.entries(results).map(([id, r]) => `[Agente ${id}]:\n${r}`).join("\n\n")
          }`;
        }

        const result = await callProvider(task.provider_key, enrichedPrompt);
        const executionTime = Date.now() - startTime;

        results[task.id] = result;

        await db.from("orchestration_tasks").update({
          status: "completed",
          result,
          execution_time_ms: executionTime,
          completed_at: new Date().toISOString(),
        }).eq("id", task.id);
      });

      await Promise.all(execPromises);
    }

    // Find the synthesis/final task result
    const synthesisTasks = tasksByPriority.filter((t: any) => t.task_type === "synthesize");
    const finalResult = synthesisTasks.length > 0
      ? results[synthesisTasks[synthesisTasks.length - 1].id]
      : Object.values(results).join("\n\n---\n\n");

    // Generate follow-up suggestions
    const suggestedFollowUps = generateFollowUps(context, tasksByPriority);

    return new Response(
      JSON.stringify({
        finalResult,
        results,
        suggestedFollowUps,
        insights: extractInsights(results),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Orchestrator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFollowUps(_context: any, tasks: any[]): string[] {
  const followUps: string[] = [];
  const types = tasks.map((t: any) => t.task_type);

  if (types.includes("research")) {
    followUps.push("Criar página wiki com os achados");
    followUps.push("Gerar flashcards sobre este tema");
  }
  if (types.includes("generate")) {
    followUps.push("Iniciar sessão de revisão");
    followUps.push("Adicionar ao plano de estudos");
  }
  if (!types.includes("analyze")) {
    followUps.push("Analisar meu desempenho neste tema");
  }

  return followUps.slice(0, 3);
}

function extractInsights(results: Record<string, string>): string {
  const allText = Object.values(results).join(" ");
  if (allText.length > 500) {
    return allText.substring(0, 500) + "...";
  }
  return allText;
}
