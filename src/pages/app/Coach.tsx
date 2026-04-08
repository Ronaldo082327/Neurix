import { useState, useRef, useEffect } from "react";
import { Brain, Send, User, Loader2, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCoachContext } from "@/hooks/use-cognitive-engine";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-chat`;

const WELCOME_MSG: Message = {
  role: "assistant",
  content: "Olá! 👋 Sou o Coach NEURIX, sua inteligência artificial de estudos. Como posso te ajudar hoje?",
};

export default function CoachPage() {
  const { user } = useAuth();
  const { data: coachCtx } = useCoachContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  const { data: conversations } = useQuery({
    queryKey: ["ai-conversations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_conversations")
        .select("id, created_at, messages, updated_at")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadConversation = (conv: any) => {
    setActiveConversationId(conv.id);
    const msgs = conv.messages as Message[];
    setMessages(msgs.length ? msgs : [WELCOME_MSG]);
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([WELCOME_MSG]);
  };

  const saveConversation = async (msgs: Message[]) => {
    if (!user) return;
    if (activeConversationId) {
      await supabase
        .from("ai_conversations")
        .update({ messages: msgs as any, updated_at: new Date().toISOString() })
        .eq("id", activeConversationId);
    } else {
      const { data } = await supabase
        .from("ai_conversations")
        .insert({ user_id: user.id, messages: msgs as any })
        .select("id")
        .single();
      if (data) setActiveConversationId(data.id);
    }
    queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("ai_conversations").delete().eq("id", id);
    if (activeConversationId === id) startNewConversation();
    queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const contextStr = coachCtx
        ? `Streak: ${coachCtx.consistency?.streakDays ?? 0} dias, Horas semanais: ${coachCtx.consistency?.weeklyStudyHours ?? 0}h, Revisões pendentes: ${coachCtx.pendingReviewsCount}, Tópicos fracos: ${coachCtx.weakTopics?.map((t: any) => t.name).join(", ") || "nenhum"}`
        : "";

      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          context: contextStr,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > allMessages.length) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save after assistant finishes
      const finalMessages = assistantSoFar
        ? [...allMessages, { role: "assistant" as const, content: assistantSoFar }]
        : allMessages;
      await saveConversation(finalMessages);
    } catch (e: any) {
      console.error("Coach error:", e);
      toast({ title: "Erro no Coach", description: e.message, variant: "destructive" });
      if (!assistantSoFar) {
        const errMsgs = [...allMessages, { role: "assistant" as const, content: "Desculpe, houve um erro ao processar sua mensagem. Tente novamente." }];
        setMessages(errMsgs);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getConversationPreview = (conv: any): string => {
    const msgs = conv.messages as Message[];
    const userMsg = msgs.find(m => m.role === "user");
    return userMsg?.content.slice(0, 50) || "Nova conversa";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return "Hoje";
    if (diff < 172800000) return "Ontem";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Sidebar de conversas */}
      <div className="hidden md:flex flex-col w-64 border border-border/50 rounded-xl bg-card/30 overflow-hidden flex-shrink-0">
        <div className="p-3 border-b border-border/50">
          <Button variant="hero" size="sm" className="w-full" onClick={startNewConversation}>
            <Plus className="h-4 w-4 mr-2" />
            Nova conversa
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations?.map((conv) => (
            <div
              key={conv.id}
              onClick={() => loadConversation(conv)}
              className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer group transition-all text-sm ${
                activeConversationId === conv.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs font-medium">{getConversationPreview(conv)}</div>
                <div className="text-[10px] text-muted-foreground">{formatDate(conv.updated_at)}</div>
              </div>
              <button
                onClick={(e) => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {(!conversations || conversations.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma conversa salva</p>
          )}
        </div>
      </div>

      {/* Chat principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Coach NEURIX</h1>
            <p className="text-muted-foreground text-sm">Converse com sua IA de estudos personalizada.</p>
          </div>
          <Button variant="ghost" size="sm" className="md:hidden" onClick={startNewConversation}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-lg gradient-primary-bg flex items-center justify-center flex-shrink-0 mt-1">
                  <Brain className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border/50 rounded-bl-md prose prose-sm prose-invert max-w-none"
              }`}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && !messages[messages.length - 1]?.content && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg gradient-primary-bg flex items-center justify-center flex-shrink-0">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50 rounded-bl-md">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Pergunte ao Coach NEURIX..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1"
            disabled={isLoading}
          />
          <Button variant="hero" size="icon" onClick={handleSend} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
