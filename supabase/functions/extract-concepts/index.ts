import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { document_id, discipline_id, discipline_name, topics } = await req.json();

    let prompt = "";

    if (document_id) {
      const { data: doc } = await supabase
        .from("documents")
        .select("title, discipline_id")
        .eq("id", document_id)
        .single();

      if (doc) {
        let discName = discipline_name || "";
        if (doc.discipline_id && !discName) {
          const { data: disc } = await supabase
            .from("disciplines")
            .select("name")
            .eq("id", doc.discipline_id)
            .single();
          discName = disc?.name || "";
        }

        prompt = `Analise o seguinte material de estudo para concursos públicos e extraia os conceitos-chave.

Documento: "${doc.title}"
${discName ? `Disciplina: ${discName}` : ""}

Extraia entre 5 e 15 conceitos específicos que um concurseiro precisaria dominar. Para cada conceito, identifique:
1. Nome do conceito (curto e específico)
2. Descrição breve (1-2 frases)
3. Importância relativa (0.1 a 1.0)
4. Relações com outros conceitos extraídos (prerequisite, related, part_of)

Responda APENAS com JSON válido:
{
  "concepts": [
    {
      "name": "Nome do Conceito",
      "description": "Descrição breve",
      "importance": 0.8,
      "relations": [
        { "target": "Nome de Outro Conceito", "type": "prerequisite", "weight": 0.7 }
      ]
    }
  ]
}`;
      }
    } else if (topics && topics.length > 0) {
      prompt = `Dado os seguintes tópicos de estudo para concursos públicos na disciplina "${discipline_name || "Geral"}":

${topics.map((t: any) => `- ${t.name}`).join("\n")}

Para cada tópico, sugira relações entre eles (pré-requisitos, relações temáticas, dependências conceituais). Atribua pesos de 0.1 a 1.0.

Responda APENAS com JSON válido:
{
  "relations": [
    { "source": "Nome do Tópico 1", "target": "Nome do Tópico 2", "type": "prerequisite", "weight": 0.7 }
  ]
}`;
    }

    if (!prompt) throw new Error("No context provided for extraction");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um especialista em pedagogia e concursos públicos do Brasil. Extraia conceitos e relações de aprendizagem. Responda sempre em JSON válido, sem markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI extraction failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    const parsed = JSON.parse(jsonStr.trim());

    if (parsed.concepts) {
      const nodeMap: Record<string, string> = {};

      for (const concept of parsed.concepts) {
        // Check if node with same name already exists for this user
        const { data: existing } = await supabase
          .from("concept_nodes")
          .select("id")
          .eq("user_id", user.id)
          .eq("name", concept.name)
          .maybeSingle();

        if (existing) {
          nodeMap[concept.name] = existing.id;
          continue;
        }

        const { data: node } = await supabase
          .from("concept_nodes")
          .insert({
            user_id: user.id,
            name: concept.name,
            description: concept.description,
            discipline_id: discipline_id || null,
            source_type: "ai_extracted",
            importance: concept.importance || 0.5,
          })
          .select("id")
          .single();

        if (node) {
          nodeMap[concept.name] = node.id;
          await supabase.from("cognitive_states").insert({
            user_id: user.id,
            concept_node_id: node.id,
            p_mastery: 0.1,
            p_learn: 0.2,
            p_guess: 0.25,
            p_slip: 0.1,
          });
        }
      }

      for (const concept of parsed.concepts) {
        if (!concept.relations) continue;
        for (const rel of concept.relations) {
          const sourceId = nodeMap[concept.name];
          const targetId = nodeMap[rel.target];
          if (sourceId && targetId && sourceId !== targetId) {
            await supabase.from("concept_edges").upsert({
              user_id: user.id,
              source_node_id: sourceId,
              target_node_id: targetId,
              relationship_type: rel.type || "related",
              weight: rel.weight || 0.5,
            }, { onConflict: "user_id,source_node_id,target_node_id" });
          }
        }
      }

      return new Response(JSON.stringify({ success: true, concepts_created: Object.keys(nodeMap).length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsed.relations && topics) {
      const nodeMap: Record<string, string> = {};

      for (const topic of topics) {
        const { data: existing } = await supabase
          .from("concept_nodes")
          .select("id")
          .eq("user_id", user.id)
          .eq("topic_id", topic.id)
          .maybeSingle();

        if (existing) {
          nodeMap[topic.name] = existing.id;
        } else {
          const { data: node } = await supabase
            .from("concept_nodes")
            .insert({
              user_id: user.id,
              name: topic.name,
              discipline_id: topic.discipline_id || discipline_id || null,
              topic_id: topic.id,
              source_type: "topic_sync",
              importance: topic.relevance || 0.5,
            })
            .select("id")
            .single();

          if (node) {
            nodeMap[topic.name] = node.id;
            await supabase.from("cognitive_states").insert({
              user_id: user.id,
              concept_node_id: node.id,
              p_mastery: topic.mastery_score ? topic.mastery_score / 100 : 0.1,
              p_learn: 0.2,
              p_guess: 0.25,
              p_slip: 0.1,
              retention_score: topic.retention_score ? topic.retention_score / 100 : 1.0,
              stability: 1.0 + (topic.review_count || 0) * 0.3,
              review_count: topic.review_count || 0,
              last_interaction_at: topic.last_studied_at,
            });
          }
        }
      }

      for (const rel of parsed.relations) {
        const sourceId = nodeMap[rel.source];
        const targetId = nodeMap[rel.target];
        if (sourceId && targetId && sourceId !== targetId) {
          await supabase.from("concept_edges").upsert({
            user_id: user.id,
            source_node_id: sourceId,
            target_node_id: targetId,
            relationship_type: rel.type || "related",
            weight: rel.weight || 0.5,
          }, { onConflict: "user_id,source_node_id,target_node_id" });
        }
      }

      return new Response(JSON.stringify({ success: true, nodes_synced: Object.keys(nodeMap).length, edges_created: parsed.relations.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unexpected AI response format");
  } catch (e) {
    console.error("extract-concepts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
