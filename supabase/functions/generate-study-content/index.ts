import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { type, discipline_id, count = 5 } = await req.json();

    // Get user's topics/concepts for context
    let topicsQuery = supabase.from("topics").select("name, mastery_score, discipline_id, disciplines(name)").eq("user_id", user.id).order("mastery_score", { ascending: true }).limit(20);
    if (discipline_id) topicsQuery = topicsQuery.eq("discipline_id", discipline_id);
    const { data: topics } = await topicsQuery;

    const topicContext = topics?.map(t => `${t.name} (domínio: ${t.mastery_score ?? 0}%, disciplina: ${(t.disciplines as any)?.name})`).join("\n") || "Nenhum tópico cadastrado";

    if (type === "questions") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Você é um gerador de questões para concursos públicos brasileiros. Gere questões de múltipla escolha com 4 alternativas (A-D), sendo apenas uma correta. Foque em tópicos com menor domínio do aluno. Retorne JSON válido.`,
            },
            {
              role: "user",
              content: `Gere ${count} questões de múltipla escolha baseadas nos seguintes tópicos do aluno:\n\n${topicContext}\n\nRetorne APENAS um array JSON no formato:\n[{"question_text": "...", "explanation": "...", "difficulty": 1-5, "options": [{"text": "...", "is_correct": true/false}]}]`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_questions",
              description: "Create multiple choice questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_text: { type: "string" },
                        explanation: { type: "string" },
                        difficulty: { type: "number" },
                        options: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              text: { type: "string" },
                              is_correct: { type: "boolean" },
                            },
                            required: ["text", "is_correct"],
                          },
                        },
                      },
                      required: ["question_text", "explanation", "difficulty", "options"],
                    },
                  },
                },
                required: ["questions"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_questions" } },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI error:", response.status, errText);
        return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const parsed = JSON.parse(toolCall?.function?.arguments || "{}");
      const questions = parsed.questions || [];

      // Find best matching discipline/topic
      const firstTopic = topics?.[0];

      // Insert questions and options
      let insertedCount = 0;
      for (const q of questions) {
        const { data: inserted } = await supabase.from("questions").insert({
          user_id: user.id,
          question_text: q.question_text,
          explanation: q.explanation,
          difficulty: q.difficulty || 3,
          discipline_id: discipline_id || firstTopic?.discipline_id || null,
          topic_id: null,
        }).select("id").single();

        if (inserted) {
          const opts = (q.options || []).map((o: any, idx: number) => ({
            question_id: inserted.id,
            option_text: o.text,
            is_correct: o.is_correct,
            option_order: idx,
          }));
          await supabase.from("question_options").insert(opts);
          insertedCount++;
        }
      }

      return new Response(JSON.stringify({ generated: insertedCount }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (type === "flashcards") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Você é um gerador de flashcards para concursos públicos brasileiros. Crie flashcards com frente (pergunta/conceito) e verso (resposta/explicação). Foque em conceitos-chave e definições importantes.`,
            },
            {
              role: "user",
              content: `Gere ${count} flashcards baseados nos seguintes tópicos do aluno:\n\n${topicContext}`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_flashcards",
              description: "Create flashcards",
              parameters: {
                type: "object",
                properties: {
                  flashcards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        front_text: { type: "string" },
                        back_text: { type: "string" },
                      },
                      required: ["front_text", "back_text"],
                    },
                  },
                },
                required: ["flashcards"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_flashcards" } },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI error:", response.status, errText);
        return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const parsed = JSON.parse(toolCall?.function?.arguments || "{}");
      const flashcards = parsed.flashcards || [];

      const firstTopic = topics?.[0];
      const inserts = flashcards.map((f: any) => ({
        user_id: user.id,
        front_text: f.front_text,
        back_text: f.back_text,
        discipline_id: discipline_id || firstTopic?.discipline_id || null,
        source: "ai_generated",
      }));

      const { data: inserted } = await supabase.from("flashcards").insert(inserts).select("id");

      return new Response(JSON.stringify({ generated: inserted?.length ?? 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
