import { useState } from "react";
import {
  Brain, Sparkles, MessageCircle, Terminal, Rocket, BookOpen,
  Settings, Key, Check, X, Loader2, Shield, Zap, Eye, EyeOff,
  BarChart3, Activity, Cpu, Globe, Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAIProviders, useUpdateAIProvider } from "@/hooks/use-orchestrator";
import { AI_PROVIDERS } from "@/lib/ai-orchestrator/types";
import type { AIProviderKey } from "@/lib/ai-orchestrator/types";
import { useToast } from "@/hooks/use-toast";

const providerIcons: Record<AIProviderKey, React.ReactNode> = {
  claude: <Brain className="h-5 w-5" />,
  gemini: <Sparkles className="h-5 w-5" />,
  chatgpt: <MessageCircle className="h-5 w-5" />,
  codex: <Terminal className="h-5 w-5" />,
  antigravity: <Rocket className="h-5 w-5" />,
  notebooklm: <BookOpen className="h-5 w-5" />,
};

const providerLogos: Record<AIProviderKey, string> = {
  claude: "Anthropic",
  gemini: "Google",
  chatgpt: "OpenAI",
  codex: "OpenAI Codex",
  antigravity: "NEURIX Labs",
  notebooklm: "Google NotebookLM",
};

export default function AgentesPage() {
  const [editingProvider, setEditingProvider] = useState<AIProviderKey | null>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const { data: savedProviders = [] } = useAIProviders();
  const updateProvider = useUpdateAIProvider();

  const getProviderConfig = (key: AIProviderKey) => {
    return savedProviders.find((p: any) => p.provider_key === key);
  };

  const handleToggle = async (key: AIProviderKey, enabled: boolean) => {
    const provider = AI_PROVIDERS[key];
    await updateProvider.mutateAsync({
      providerKey: key,
      displayName: provider.displayName,
      isActive: enabled,
    });
    toast({ title: enabled ? "Ativado" : "Desativado", description: `${provider.displayName} ${enabled ? "ativado" : "desativado"}.` });
  };

  const handleSaveKey = async (key: AIProviderKey) => {
    const provider = AI_PROVIDERS[key];
    const apiKey = apiKeyInputs[key];
    if (!apiKey?.trim()) return;

    await updateProvider.mutateAsync({
      providerKey: key,
      displayName: provider.displayName,
      apiKey,
      modelId: provider.model,
      isActive: true,
    });
    toast({ title: "API Key salva", description: `${provider.displayName} configurado.` });
    setEditingProvider(null);
    setApiKeyInputs(prev => ({ ...prev, [key]: "" }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
          <Cpu className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Agentes IA</h1>
          <p className="text-sm text-muted-foreground">
            Configure e gerencie os 6 agentes do ecossistema NEURIX
          </p>
        </div>
      </div>

      {/* Architecture Overview */}
      <Card className="bg-gradient-to-br from-amber-500/5 to-orange-600/5 border-amber-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-6 w-6 text-amber-400" />
            <div>
              <h3 className="font-semibold">Arquitetura de Orquestração</h3>
              <p className="text-xs text-muted-foreground">Claude é o cérebro central que coordena todos os agentes</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.keys(AI_PROVIDERS) as AIProviderKey[]).map((key) => {
              const provider = AI_PROVIDERS[key];
              const isOrchestrator = key === "claude";
              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border text-center ${
                    isOrchestrator
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-border/30 bg-card/50"
                  }`}
                >
                  <div
                    className="h-10 w-10 rounded-lg mx-auto flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${provider.color}20` }}
                  >
                    <span style={{ color: provider.color }}>{providerIcons[key]}</span>
                  </div>
                  <p className="text-sm font-medium">{provider.displayName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {isOrchestrator ? "Orquestrador" : "Agente"}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>API keys são armazenadas de forma segura e nunca expostas no frontend</span>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <div className="space-y-4">
        {(Object.keys(AI_PROVIDERS) as AIProviderKey[]).map((key) => {
          const provider = AI_PROVIDERS[key];
          const config = getProviderConfig(key);
          const isActive = config?.is_active ?? false;
          const hasKey = !!config?.api_key_encrypted;
          const isEditing = editingProvider === key;

          return (
            <Card key={key} className={`transition-colors ${isActive ? "border-border/50" : "border-border/20 opacity-60"}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${provider.color}15` }}
                  >
                    <span style={{ color: provider.color }}>{providerIcons[key]}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {provider.displayName}
                          {key === "claude" && (
                            <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                              Orquestrador
                            </Badge>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">{providerLogos[key]}</p>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(v) => handleToggle(key, v)}
                      />
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>

                    {/* Capabilities */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {provider.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline" className="text-[10px] px-1.5">
                          {cap}
                        </Badge>
                      ))}
                    </div>

                    {/* Model info */}
                    {provider.model && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Database className="h-3 w-3" />
                        <span>Modelo: {provider.model}</span>
                      </div>
                    )}

                    <Separator className="my-3" />

                    {/* API Key Section */}
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      {hasKey ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            API Key configurada
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setEditingProvider(isEditing ? null : key)}
                          >
                            Alterar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {key === "antigravity" ? "Usa API do Claude" : "Sem API key (usa gateway padrão)"}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setEditingProvider(isEditing ? null : key)}
                          >
                            Configurar
                          </Button>
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex gap-2 mt-2">
                        <div className="relative flex-1">
                          <Input
                            type={showKeys[key] ? "text" : "password"}
                            placeholder={`Cole sua API key do ${provider.displayName}...`}
                            value={apiKeyInputs[key] ?? ""}
                            onChange={(e) => setApiKeyInputs(prev => ({ ...prev, [key]: e.target.value }))}
                            className="pr-10 text-xs"
                          />
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))}
                          >
                            {showKeys[key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSaveKey(key)}
                          disabled={!apiKeyInputs[key]?.trim() || updateProvider.isPending}
                        >
                          {updateProvider.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingProvider(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Dicas de Integração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p><strong className="text-foreground">Claude:</strong> Obtenha sua API key em console.anthropic.com. Claude atua como orquestrador central.</p>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p><strong className="text-foreground">Gemini:</strong> API key gratuita em aistudio.google.com. Usado para pesquisa multimodal.</p>
          </div>
          <div className="flex items-start gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p><strong className="text-foreground">ChatGPT:</strong> API key em platform.openai.com. Gera conteúdo criativo e questões.</p>
          </div>
          <div className="flex items-start gap-2">
            <Terminal className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <p><strong className="text-foreground">Codex:</strong> Usa mesma API key do OpenAI. Especializado em automação e código.</p>
          </div>
          <div className="flex items-start gap-2">
            <Rocket className="h-4 w-4 text-pink-400 shrink-0 mt-0.5" />
            <p><strong className="text-foreground">Antigravity:</strong> Motor de inovação interno. Usa Claude com prompts especializados para pensamento lateral.</p>
          </div>
          <div className="flex items-start gap-2">
            <BookOpen className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p><strong className="text-foreground">NotebookLM:</strong> Integração via biblioteca Python. Pesquisa fundamentada com citações de fontes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
