import { useState, useRef, useEffect } from "react";
import {
  Brain, Send, Sparkles, Zap, Terminal, Rocket, BookOpen,
  MessageCircle, Loader2, ChevronRight, Clock, CheckCircle2,
  AlertCircle, ArrowRight, Calendar, Target, FileText, Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useOrchestrate, useQuickActions, usePipelines } from "@/hooks/use-orchestrator";
import { AI_PROVIDERS } from "@/lib/ai-orchestrator/types";
import type { AIProviderKey } from "@/lib/ai-orchestrator/types";
import { useToast } from "@/hooks/use-toast";

const providerIcons: Record<AIProviderKey, React.ReactNode> = {
  claude: <Brain className="h-4 w-4" />,
  gemini: <Sparkles className="h-4 w-4" />,
  chatgpt: <MessageCircle className="h-4 w-4" />,
  codex: <Terminal className="h-4 w-4" />,
  antigravity: <Rocket className="h-4 w-4" />,
  notebooklm: <BookOpen className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  planning: "bg-blue-500/20 text-blue-400",
  routing: "bg-purple-500/20 text-purple-400",
  executing: "bg-amber-500/20 text-amber-400",
  synthesizing: "bg-cyan-500/20 text-cyan-400",
  completed: "bg-emerald-500/20 text-emerald-400",
  failed: "bg-red-500/20 text-red-400",
  pending: "bg-muted text-muted-foreground",
  running: "bg-amber-500/20 text-amber-400",
};

export default function OrquestradorPage() {
  const [input, setInput] = useState("");
  const [activeResult, setActiveResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const orchestrate = useOrchestrate();
  const quickActions = useQuickActions();
  const { data: pipelines = [] } = usePipelines(15);

  const handleSubmit = async () => {
    if (!input.trim() || orchestrate.isPending) return;
    const message = input;
    setInput("");

    try {
      const result = await orchestrate.mutateAsync({ message });
      setActiveResult(result.finalResult ?? null);
    } catch (err) {
      toast({ title: "Erro", description: "Falha na orquestração", variant: "destructive" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickActionButtons = [
    { label: "Plano do Dia", icon: Calendar, action: () => quickActions.studyPlan.mutateAsync(), color: "text-blue-400" },
    { label: "Revisão Prioritária", icon: Zap, action: () => quickActions.dailyReview.mutateAsync(), color: "text-amber-400" },
    { label: "Gerar Questões", icon: Target, action: () => quickActions.generateContent.mutateAsync({ topic: "tópicos prioritários", type: "questions" }), color: "text-emerald-400" },
    { label: "Gerar Flashcards", icon: Layers, action: () => quickActions.generateContent.mutateAsync({ topic: "tópicos prioritários", type: "flashcards" }), color: "text-purple-400" },
  ];

  const isAnyLoading = orchestrate.isPending
    || quickActions.studyPlan.isPending
    || quickActions.dailyReview.isPending
    || quickActions.generateContent.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Orquestrador NEURIX</h1>
          <p className="text-sm text-muted-foreground">
            Claude como cérebro central • 6 IAs integradas • Execução autônoma
          </p>
        </div>
      </div>

      {/* Provider Status Bar */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(AI_PROVIDERS) as AIProviderKey[]).map((key) => {
          const provider = AI_PROVIDERS[key];
          return (
            <div
              key={key}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-card text-xs"
              style={{ borderColor: `${provider.color}40` }}
            >
              <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: provider.color }} />
              <span style={{ color: provider.color }}>{providerIcons[key]}</span>
              <span className="font-medium">{provider.displayName}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input & Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Command Input */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="O que você precisa? Ex: 'Monte meu plano de hoje', 'Pesquise direito constitucional', 'Gere 10 questões de penal'..."
                  className="min-h-[80px] resize-none border-0 focus-visible:ring-0 text-base"
                  disabled={isAnyLoading}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isAnyLoading}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 self-end"
                >
                  {isAnyLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {quickActionButtons.map((qa) => (
                  <Button
                    key={qa.label}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={qa.action}
                    disabled={isAnyLoading}
                  >
                    <qa.icon className={`h-3.5 w-3.5 ${qa.color}`} />
                    {qa.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Result */}
          {activeResult && (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Resultado da Orquestração
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap text-sm">
                  {activeResult}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pipeline History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Histórico de Pipelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {pipelines.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma orquestração ainda. Use o campo acima ou as ações rápidas.
                    </p>
                  ) : (
                    pipelines.map((pipeline: any) => (
                      <div
                        key={pipeline.id}
                        className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                        onClick={() => setActiveResult(pipeline.final_result)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-1 flex-1">{pipeline.intent}</p>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColors[pipeline.status]}`}>
                            {pipeline.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px]">{pipeline.intent_type}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(pipeline.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {pipeline.orchestration_tasks?.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              • {pipeline.orchestration_tasks.length} sub-tarefas
                            </span>
                          )}
                        </div>
                        {/* Task provider chips */}
                        {pipeline.orchestration_tasks?.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {pipeline.orchestration_tasks.map((task: any) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border border-border/30"
                                style={{ borderColor: `${AI_PROVIDERS[task.provider_key as AIProviderKey]?.color ?? '#666'}30` }}
                              >
                                {providerIcons[task.provider_key as AIProviderKey]}
                                <span>{task.provider_key}</span>
                                {task.status === "completed" && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />}
                                {task.status === "running" && <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-400" />}
                                {task.status === "failed" && <AlertCircle className="h-2.5 w-2.5 text-red-400" />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Agent Cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Agentes Integrados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.keys(AI_PROVIDERS) as AIProviderKey[]).map((key) => {
                const provider = AI_PROVIDERS[key];
                return (
                  <div
                    key={key}
                    className="p-3 rounded-lg border border-border/30 hover:border-border/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${provider.color}20` }}
                      >
                        <span style={{ color: provider.color }}>{providerIcons[key]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{provider.displayName}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {provider.capabilities.slice(0, 4).map((cap) => (
                        <Badge key={cap} variant="outline" className="text-[9px] px-1.5 py-0">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="bg-gradient-to-br from-amber-500/5 to-orange-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Como funciona
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">1.</span>
                  <span>Você descreve o que precisa</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">2.</span>
                  <span>Claude analisa e decompõe em sub-tarefas</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">3.</span>
                  <span>Cada sub-tarefa vai para a IA ideal</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">4.</span>
                  <span>Claude sintetiza tudo em uma resposta unificada</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">5.</span>
                  <span>Ações são executadas automaticamente</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
