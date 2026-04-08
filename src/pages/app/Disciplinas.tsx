import { useState } from "react";
import { BookOpen, Plus, Trash2, ChevronDown, ChevronRight, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDisciplines } from "@/hooks/use-cognitive-engine";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function DisciplinasPage() {
  const { user } = useAuth();
  const { data: disciplines, isLoading } = useDisciplines();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ id: string; name: string } | null>(null);

  // Fetch full topics for expanded discipline
  const { data: expandedTopics } = useQuery({
    queryKey: ["discipline-topics", expandedId],
    queryFn: async () => {
      const { data } = await supabase
        .from("topics")
        .select("id, name, mastery_score, retention_score, last_studied_at, review_count")
        .eq("discipline_id", expandedId!)
        .eq("user_id", user!.id)
        .order("name");
      return data ?? [];
    },
    enabled: !!expandedId && !!user,
  });

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const colors = ["hsl(217, 91%, 60%)", "hsl(270, 60%, 55%)", "hsl(190, 95%, 55%)", "hsl(152, 69%, 46%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];
    const { error } = await supabase.from("disciplines").insert({
      user_id: user.id,
      name: newName.trim(),
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    setCreating(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewName("");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["disciplines"] });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("disciplines").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["disciplines"] });
  };

  const handleAddTopic = async (disciplineId: string) => {
    if (!user || !newTopicName.trim()) return;
    const { error } = await supabase.from("topics").insert({
      user_id: user.id,
      discipline_id: disciplineId,
      name: newTopicName.trim(),
      relevance: 1.0,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewTopicName("");
      setAddingTopicFor(null);
      queryClient.invalidateQueries({ queryKey: ["discipline-topics", disciplineId] });
      queryClient.invalidateQueries({ queryKey: ["disciplines"] });
    }
  };

  const handleEditTopic = async (topicId: string, newName: string) => {
    if (!newName.trim()) return;
    await supabase.from("topics").update({ name: newName.trim() }).eq("id", topicId);
    setEditingTopic(null);
    queryClient.invalidateQueries({ queryKey: ["discipline-topics", expandedId] });
    queryClient.invalidateQueries({ queryKey: ["disciplines"] });
  };

  const handleDeleteTopic = async (topicId: string) => {
    await supabase.from("topics").delete().eq("id", topicId);
    queryClient.invalidateQueries({ queryKey: ["discipline-topics", expandedId] });
    queryClient.invalidateQueries({ queryKey: ["disciplines"] });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
    setAddingTopicFor(null);
    setEditingTopic(null);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando disciplinas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Disciplinas</h1>
          <p className="text-muted-foreground text-sm">Gerencie suas disciplinas e tópicos de estudo.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><Plus className="h-4 w-4 mr-2" />Nova Disciplina</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Disciplina</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da disciplina</Label>
                <Input placeholder="Ex: Direito Constitucional" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <Button variant="hero" onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? "Criando..." : "Criar disciplina"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(!disciplines || disciplines.length === 0) ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma disciplina cadastrada.</p>
          <p className="text-sm">Crie sua primeira disciplina ou complete o onboarding.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disciplines.map((d: any) => {
            const topics = d.topics ?? [];
            const mastered = topics.filter((t: any) => (t.mastery_score ?? 0) >= 70).length;
            const pct = topics.length ? Math.round((mastered / topics.length) * 100) : 0;
            const isExpanded = expandedId === d.id;
            const lastStudied = topics.reduce((latest: string | null, t: any) => {
              if (!t.last_studied_at) return latest;
              if (!latest) return t.last_studied_at;
              return t.last_studied_at > latest ? t.last_studied_at : latest;
            }, null);
            const lastLabel = lastStudied
              ? new Date(lastStudied).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
              : "Nunca";

            return (
              <div key={d.id} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden transition-all hover:border-primary/30">
                {/* Discipline header */}
                <div
                  className="flex items-center gap-3 p-5 cursor-pointer"
                  onClick={() => toggleExpand(d.id)}
                >
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${d.color}20` }}>
                    <BookOpen className="h-5 w-5" style={{ color: d.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{d.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{topics.length} tópicos · Último: {lastLabel}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Progress value={pct} className="flex-1 h-2" />
                      <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Topics panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-border/30 pt-4 space-y-2">
                        {expandedTopics?.map((topic) => {
                          const mastery = topic.mastery_score ?? 0;
                          const isEditing = editingTopic?.id === topic.id;

                          return (
                            <div key={topic.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/20 group">
                              <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                                mastery >= 70 ? "bg-success" : mastery >= 30 ? "bg-warning" : "bg-destructive"
                              }`} />
                              {isEditing ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <Input
                                    value={editingTopic.name}
                                    onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                                    className="h-7 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleEditTopic(topic.id, editingTopic.name);
                                      if (e.key === "Escape") setEditingTopic(null);
                                    }}
                                  />
                                  <button onClick={() => handleEditTopic(topic.id, editingTopic.name)} className="text-success hover:text-success/80">
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => setEditingTopic(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm">{topic.name}</span>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                      <span>{Math.round(mastery)}% domínio</span>
                                      <span>·</span>
                                      <span>{topic.review_count ?? 0} revisões</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingTopic({ id: topic.id, name: topic.name })} className="text-muted-foreground hover:text-primary p-1">
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteTopic(topic.id)} className="text-muted-foreground hover:text-destructive p-1">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}

                        {expandedTopics?.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-3">Nenhum tópico cadastrado.</p>
                        )}

                        {/* Add topic */}
                        {addingTopicFor === d.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              placeholder="Nome do tópico"
                              value={newTopicName}
                              onChange={(e) => setNewTopicName(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddTopic(d.id);
                                if (e.key === "Escape") { setAddingTopicFor(null); setNewTopicName(""); }
                              }}
                            />
                            <Button variant="hero" size="sm" className="h-8 text-xs" onClick={() => handleAddTopic(d.id)}>
                              Adicionar
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setAddingTopicFor(null); setNewTopicName(""); }}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingTopicFor(d.id)}
                            className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 mt-2 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Adicionar tópico
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
