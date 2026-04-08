import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Upload, Search, Trash2, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function BibliotecaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 20MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage.from("study-documents").upload(filePath, file);
    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("documents").insert({
      user_id: user.id,
      title: file.name,
      file_path: filePath,
      file_size: file.size,
    });

    if (dbError) {
      toast({ title: "Erro ao salvar", description: dbError.message, variant: "destructive" });
    } else {
      toast({ title: "Upload concluído!", description: `${file.name} foi adicionado à sua biblioteca.` });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (id: string, filePath: string) => {
    await supabase.storage.from("study-documents").remove([filePath]);
    await supabase.from("documents").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const filtered = documents?.filter(d => d.title.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Biblioteca</h1>
          <p className="text-muted-foreground text-sm">Seus materiais de estudo organizados.</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.md" className="hidden" onChange={handleUpload} />
          <Button variant="hero" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? "Enviando..." : "Upload PDF"}
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar documentos..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum documento encontrado.</p>
          <p className="text-sm">Faça upload do seu primeiro material de estudo.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc: any) => (
            <div key={doc.id} className="p-5 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 transition-all group cursor-pointer" onClick={() => navigate(`/app/biblioteca/${doc.id}`)}>
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/app/biblioteca/${doc.id}`); }} className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.file_path); }} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-medium text-sm mb-1 truncate">{doc.title}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatSize(doc.file_size)}</span>
                <span>·</span>
                <span>{new Date(doc.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
