import { useState } from "react";
import {
  ListTodo, Plus, Play, Pause, Trash2, Clock, CheckCircle2,
  AlertCircle, Loader2, Brain, Sparkles, MessageCircle,
  Terminal, Rocket, BookOpen, Filter, RotateCcw, Zap,
  FileText, Layers, HelpCircle, Settings2, CalendarClock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTaskQueue, useTaskHistory, useCreateTask, useExecuteTask } from "@/hooks/use-orchestrator";
import { AI_PROVIDERS } from "@/lib/ai-orchestrator/types";
import type { AIProviderKey, AutonomousTaskCategory } from "@/lib/ai-orchestrator/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const categoryIcons: Record<string, React.ReactNode> = {
  study: <Brain className="h-4 w-4 text-blue-400" />,
  review: <Zap className="h-4 w-4 text-amber-400" />,
  research: <Sparkles className="h-4 w-4 text-purple-400" />,
  organization: <Settings2 className="h-4 w-4 text-slate-400" />,
  wiki: <FileText className="h-4 w-4 text-cyan-400" />,
  flashcard: <Layers className="h-4 w-4 text-emerald-400" />,
  question: <HelpCircle className="h-4 w-4 text-orange-400" />,
  protocol: <CalendarClock className="h-4 w-4 text-pink-400" />,
  obsidian_sync: <BookOpen className="h-4 w-4 text-teal-400" />,
};

const categoryLabels: Record<string, string> = {
  study: "Estudo",
  review: "Revisão",
  research: "Pesquisa",
  organization: "Organização",
  wiki: "Wiki",
  flashcard: "Flashcard",
  question: "Questões",
  protocol: "Protocolo",
  obsidian_sync: "Obsidian Sync",
};

const statusIcons: Record<string, React.ReactNode> = {
  queued: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  running: <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />,
  paused: <Pause className="h-3.5 w-3.5 text-yellow-400" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  failed: <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
  cancelled: <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />,
};

export default function CentroTarefasPage() {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<AutonomousTaskCategory>("study");
  const [provider, setProvider] = useState<AIProviderKey>("claude");
  const [priority, setPriority] = useState("5");
  const [topicInput, setTopicInput] = useState("");
  const { toast } = useToast();

  const { data: queue = [] } = useTaskQueue();
  const { data: history = [] } = useTaskHistory();
  const createTask = useCreateTask();
  const executeTask = useExecuteTask();

  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      const task = await createTask.mutateAsync({
        title,
        category,
        description: description || undefined,
        priority: parseInt(priority),
        assignedProvider: provider,
        inputData: topicInput ? { topic: topicInput } : {},
      });

      if (task) {
        toast({ title: "Tarefa criada", description: `"${title}" adicionada à fila.` });
        // Auto-execute
        await executeTask.mutateAsync(task.id);
      }

      setTitle("");
      setDescription("");
      setTopicInput("");
      setNewTaskOpen(false);
    } catch {
      toast({ title: "Erro", description: "Falha ao criar tarefa", variant: "destructive" });
    }
  };

  const handleQuickTask = async (taskTitle: string, cat: AutonomousTaskCategory, input: Record<string, unknown> = {}) => {
    try {
      const task = await createTask.mutateAsync({
        title: taskTitle,
        category: cat,
        assignedProvider: "claude",
        inputData: input,
      });
      if (task) {
        await executeTask.mutateAsync(task.id);
        toast({ title: "Executando", description: taskTitle });
      }
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleCancel = async (taskId: string) => {
    await supabase.from("autonomous_tasks").update({ status: "cancelled" }).eq("id", taskId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <ListTodo className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Centro de Tarefas</h1>
            <p className="text-sm text-muted-foreground">
              Execução autônoma de tarefas por agentes IA
            </p>
          </div>
        </div>

        <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-teal-500 to-teal-600">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Tarefa Autônoma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Título da tarefa" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Input placeholder="Tópico/tema (se aplicável)" value={topicInput} onChange={(e) => setTopicInput(e.target.value)} />
              <div className="grid grid-cols-3 gap-2">
                <Select value={category} onValueChange={(v) => setCategory(v as AutonomousTaskCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={provider} onValueChange={(v) => setProvider(v as AIProviderKey)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(AI_PROVIDERS).map((k) => (
                      <SelectItem key={k} value={k}>{AI_PROVIDERS[k as AIProviderKey].displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>P{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!title.trim() || createTask.isPending}>
                {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Criar e Executar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Tasks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: "Gerar Plano de Estudo", cat: "study" as const, icon: Brain, color: "from-blue-500/10 to-cyan-500/10 border-blue-500/20" },
          { title: "Organizar Revisões Pendentes", cat: "review" as const, icon: Zap, color: "from-amber-500/10 to-orange-500/10 border-amber-500/20" },
          { title: "Gerar 10 Flashcards", cat: "flashcard" as const, icon: Layers, color: "from-emerald-500/10 to-green-500/10 border-emerald-500/20" },
          { title: "Recalcular Prioridades", cat: "organization" as const, icon: RotateCcw, color: "from-slate-500/10 to-gray-500/10 border-slate-500/20" },
        ].map((qt) => (
          <Card
            key={qt.title}
            className={`cursor-pointer hover:scale-[1.02] transition-transform border bg-gradient-to-br ${qt.color}`}
            onClick={() => handleQuickTask(qt.title, qt.cat)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <qt.icon className="h-5 w-5 text-foreground/70" />
              <span className="text-sm font-medium">{qt.title}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue" className="gap-1.5">
            <Loader2 className="h-3.5 w-3.5" />
            Fila ({queue.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Histórico ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {queue.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma tarefa na fila</p>
                    <p className="text-xs mt-1">Crie uma tarefa ou use as ações rápidas acima</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {queue.map((task: any) => (
                      <div key={task.id} className="p-4 hover:bg-accent/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {statusIcons[task.status]}
                            {categoryIcons[task.task_category]}
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {AI_PROVIDERS[task.assigned_provider as AIProviderKey]?.displayName ?? task.assigned_provider}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">P{task.priority}</Badge>
                            {task.status === "queued" && (
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => executeTask.mutate(task.id)}>
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {(task.status === "queued" || task.status === "paused") && (
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => handleCancel(task.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {task.progress > 0 && task.progress < 100 && (
                          <Progress value={task.progress} className="mt-2 h-1.5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {history.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma tarefa concluída ainda</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {history.map((task: any) => (
                      <div key={task.id} className="p-4 hover:bg-accent/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {statusIcons[task.status]}
                            {categoryIcons[task.task_category]}
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {task.completed_at && new Date(task.completed_at).toLocaleString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {categoryLabels[task.task_category]}
                          </Badge>
                        </div>
                        {task.output_data && Object.keys(task.output_data).length > 0 && (
                          <pre className="mt-2 text-[10px] text-muted-foreground bg-muted/30 p-2 rounded overflow-x-auto">
                            {JSON.stringify(task.output_data, null, 2).slice(0, 200)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
