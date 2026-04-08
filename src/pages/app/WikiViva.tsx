import { useState } from "react";
import {
  FileText, Plus, Search, BookOpen, Layers, GitCompare, List,
  FlaskConical, Brain, Edit, Trash2, Clock, Sparkles, Tags,
  Download, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWikiPages, useCreateWikiPage, useSearchWiki } from "@/hooks/use-orchestrator";
import { useCreateTask, useExecuteTask } from "@/hooks/use-orchestrator";
import type { WikiPageType } from "@/lib/ai-orchestrator/types";
import { useToast } from "@/hooks/use-toast";

const typeIcons: Record<string, React.ReactNode> = {
  concept: <Brain className="h-4 w-4 text-blue-400" />,
  entity: <Sparkles className="h-4 w-4 text-purple-400" />,
  comparison: <GitCompare className="h-4 w-4 text-amber-400" />,
  synthesis: <Layers className="h-4 w-4 text-cyan-400" />,
  index: <List className="h-4 w-4 text-slate-400" />,
  protocol: <FlaskConical className="h-4 w-4 text-emerald-400" />,
  experiment: <FlaskConical className="h-4 w-4 text-pink-400" />,
};

const typeLabels: Record<string, string> = {
  concept: "Conceito",
  entity: "Entidade",
  comparison: "Comparação",
  synthesis: "Síntese",
  index: "Índice",
  protocol: "Protocolo",
  experiment: "Experimento",
};

export default function WikiVivaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<WikiPageType>("concept");
  const [newTags, setNewTags] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: allPages = [] } = useWikiPages();
  const createPage = useCreateWikiPage();
  const searchWiki = useSearchWiki();
  const createTask = useCreateTask();
  const executeTask = useExecuteTask();

  const filteredPages = activeFilter === "all"
    ? allPages
    : allPages.filter((p: any) => p.page_type === activeFilter);

  const displayedPages = searchQuery
    ? filteredPages.filter((p: any) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredPages;

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createPage.mutateAsync({
        title: newTitle,
        content: newContent,
        pageType: newType,
        tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
      });
      toast({ title: "Página criada", description: `"${newTitle}" adicionada à wiki.` });
      setNewPageOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleAIGenerate = async () => {
    if (!newTitle.trim()) return;
    try {
      const task = await createTask.mutateAsync({
        title: `Gerar wiki: ${newTitle}`,
        category: "wiki",
        assignedProvider: "claude",
        inputData: { topic: newTitle, tags: newTags.split(",").map(t => t.trim()).filter(Boolean) },
      });
      if (task) {
        await executeTask.mutateAsync(task.id);
        toast({ title: "Gerando...", description: `IA criando página sobre "${newTitle}"` });
        setNewPageOpen(false);
        setNewTitle("");
        setNewTags("");
      }
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const stats = {
    total: allPages.length,
    concepts: allPages.filter((p: any) => p.page_type === "concept").length,
    aiGenerated: allPages.filter((p: any) => p.ai_generated).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Wiki Viva</h1>
            <p className="text-sm text-muted-foreground">
              Base de conhecimento persistente mantida por IA
            </p>
          </div>
        </div>

        <Dialog open={newPageOpen} onOpenChange={setNewPageOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="h-4 w-4" />
              Nova Página
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Página Wiki</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Título da página" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={newType} onValueChange={(v) => setNewType(v as WikiPageType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Tags (vírgula)" value={newTags} onChange={(e) => setNewTags(e.target.value)} />
              </div>
              <Textarea
                placeholder="Conteúdo em Markdown (ou deixe vazio para geração por IA)"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[150px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="flex-1" disabled={!newTitle.trim()}>
                  <Edit className="h-4 w-4 mr-2" />
                  Criar Manual
                </Button>
                <Button onClick={handleAIGenerate} variant="outline" className="flex-1 border-cyan-500/30 text-cyan-400" disabled={!newTitle.trim()}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar com IA
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-cyan-500/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Páginas totais</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-indigo-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.concepts}</p>
            <p className="text-xs text-muted-foreground">Conceitos</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/5 to-teal-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.aiGenerated}</p>
            <p className="text-xs text-muted-foreground">Gerados por IA</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Page List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na wiki..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-1 flex-wrap">
            <Badge
              variant={activeFilter === "all" ? "default" : "outline"}
              className="cursor-pointer text-[10px]"
              onClick={() => setActiveFilter("all")}
            >
              Todos
            </Badge>
            {Object.entries(typeLabels).map(([k, v]) => (
              <Badge
                key={k}
                variant={activeFilter === k ? "default" : "outline"}
                className="cursor-pointer text-[10px]"
                onClick={() => setActiveFilter(k)}
              >
                {v}
              </Badge>
            ))}
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {displayedPages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma página encontrada
                </p>
              ) : (
                displayedPages.map((page: any) => (
                  <div
                    key={page.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPage?.id === page.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/30 hover:border-border/60"
                    }`}
                    onClick={() => setSelectedPage(page)}
                  >
                    <div className="flex items-center gap-2">
                      {typeIcons[page.page_type]}
                      <span className="text-sm font-medium line-clamp-1 flex-1">{page.title}</span>
                      {page.ai_generated && (
                        <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[9px] px-1.5">{typeLabels[page.page_type]}</Badge>
                      <span className="text-[10px] text-muted-foreground">v{page.version}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(page.updated_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {page.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {page.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Page Content */}
        <div className="lg:col-span-2">
          {selectedPage ? (
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {typeIcons[selectedPage.page_type]}
                    <CardTitle className="text-lg">{selectedPage.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">v{selectedPage.version}</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {selectedPage.last_updated_by === "user" ? "Manual" : selectedPage.last_updated_by}
                    </Badge>
                  </div>
                </div>
                {selectedPage.tags?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {selectedPage.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">#{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px]">
                  <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap">
                    {selectedPage.content || "Página vazia"}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">Selecione uma página para visualizar</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ou crie uma nova página manual ou gerada por IA
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
