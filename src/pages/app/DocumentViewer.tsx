import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Plus,
  Save,
  Trash2,
  FileText,
  Edit3,
  Loader2,
  StickyNote,
  Highlighter,
  AlertTriangle,
  HelpCircle,
  Star,
  Pencil,
  PenTool,
  Eraser,
  MousePointer,
  Undo2,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import PdfDrawingCanvas, { type DrawingTool, type DrawingStroke } from "@/components/app/PdfDrawingCanvas";
import TextSelectionPopup from "@/components/app/TextSelectionPopup";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const NOTE_CATEGORIES = [
  { value: "concept", label: "Conceito importante", icon: Star, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  { value: "doubt", label: "Dúvida", icon: HelpCircle, color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  { value: "review", label: "Ponto de revisão", icon: Highlighter, color: "text-primary bg-primary/10 border-primary/30" },
  { value: "trap", label: "Pegadinha de prova", icon: AlertTriangle, color: "text-red-400 bg-red-400/10 border-red-400/30" },
];

const DRAWING_TOOLS: { value: DrawingTool; label: string; icon: typeof Pencil }[] = [
  { value: "none", label: "Cursor", icon: MousePointer },
  { value: "highlighter", label: "Marca-texto", icon: Highlighter },
  { value: "pencil", label: "Lápis", icon: Pencil },
  { value: "pen", label: "Caneta", icon: PenTool },
  { value: "eraser", label: "Borracha", icon: Eraser },
];

const DRAWING_COLORS = [
  { value: "#FACC15", label: "Amarelo" },
  { value: "#4ADE80", label: "Verde" },
  { value: "#60A5FA", label: "Azul" },
  { value: "#F87171", label: "Vermelho" },
  { value: "#C084FC", label: "Roxo" },
  { value: "#FB923C", label: "Laranja" },
  { value: "#F472B6", label: "Rosa" },
  { value: "#FFFFFF", label: "Branco" },
];

interface NoteData {
  id: string;
  title: string;
  content: string | null;
  document_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  discipline_id: string | null;
  topic_id: string | null;
}

export default function DocumentViewerPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  // Drawing state
  const [activeTool, setActiveTool] = useState<DrawingTool>("none");
  const [activeColor, setActiveColor] = useState("#FACC15");
  const [showColors, setShowColors] = useState(false);
  const [pageStrokes, setPageStrokes] = useState<Record<number, DrawingStroke[]>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Notes state
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("concept");
  const [showNewNote, setShowNewNote] = useState(false);
  const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({});

  // Fetch document
  const { data: doc } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId!)
        .single();
      return data;
    },
    enabled: !!documentId && !!user,
  });

  // Get signed URL
  useEffect(() => {
    if (!doc?.file_path) return;
    supabase.storage
      .from("study-documents")
      .createSignedUrl(doc.file_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setPdfUrl(data.signedUrl);
      });
  }, [doc?.file_path]);

  // Load annotations from DB
  const { data: savedAnnotations } = useQuery({
    queryKey: ["document-annotations", documentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("document_annotations")
        .select("*")
        .eq("document_id", documentId!)
        .eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!documentId && !!user,
  });

  // Load saved annotations into state
  useEffect(() => {
    if (!savedAnnotations) return;
    const loaded: Record<number, DrawingStroke[]> = {};
    for (const ann of savedAnnotations) {
      loaded[ann.page_number] = (ann.annotation_data as any) ?? [];
    }
    setPageStrokes(loaded);
  }, [savedAnnotations]);

  // Save annotations to DB (debounced)
  const saveAnnotations = useCallback(
    (page: number, strokes: DrawingStroke[]) => {
      if (!user || !documentId) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        await supabase.from("document_annotations").upsert(
          {
            user_id: user.id,
            document_id: documentId,
            page_number: page,
            annotation_data: strokes as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,document_id,page_number" }
        );
      }, 1000);
    },
    [user, documentId]
  );

  const handleStrokesChange = useCallback(
    (newStrokes: DrawingStroke[]) => {
      setPageStrokes((prev) => ({ ...prev, [currentPage]: newStrokes }));
      saveAnnotations(currentPage, newStrokes);
    },
    [currentPage, saveAnnotations]
  );

  const handleUndo = () => {
    const current = pageStrokes[currentPage] ?? [];
    if (current.length === 0) return;
    const newStrokes = current.slice(0, -1);
    setPageStrokes((prev) => ({ ...prev, [currentPage]: newStrokes }));
    saveAnnotations(currentPage, newStrokes);
  };

  // Fetch notes for this document
  const { data: notes = [] } = useQuery({
    queryKey: ["document-notes", documentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("document_id", documentId!)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as NoteData[];
    },
    enabled: !!documentId && !!user,
  });

  // Create note
  const createNote = useMutation({
    mutationFn: async () => {
      const categoryMeta = NOTE_CATEGORIES.find((c) => c.value === newNoteCategory);
      const title = newNoteTitle || categoryMeta?.label || "Anotação";
      const content = `<!-- category: ${newNoteCategory} -->\n<!-- page: ${currentPage} -->\n\n${newNoteContent}`;
      const { error } = await supabase.from("notes").insert({
        user_id: user!.id,
        document_id: documentId!,
        title,
        content,
        discipline_id: doc?.discipline_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-notes", documentId] });
      setNewNoteTitle("");
      setNewNoteContent("");
      setShowNewNote(false);
      toast({ title: "Anotação salva!" });
    },
  });

  // Text highlight from selection
  const handleTextHighlight = useCallback(async (text: string, category: string) => {
    if (!user || !documentId) return;
    const catMeta = NOTE_CATEGORIES.find((c) => c.value === category);
    const title = `${catMeta?.label || "Destaque"} (seleção)`;
    const content = `<!-- category: ${category} -->\n<!-- page: ${currentPage} -->\n\n> ${text}`;
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      document_id: documentId,
      title,
      content,
      discipline_id: doc?.discipline_id ?? null,
    });
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["document-notes", documentId] });
      toast({ title: "Destaque salvo!", description: `"${text.slice(0, 40)}${text.length > 40 ? "..." : ""}"` });
    }
  }, [user, documentId, currentPage, doc?.discipline_id, queryClient, toast]);

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase.from("notes").update({ content }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-notes", documentId] });
      setEditingNote(null);
      toast({ title: "Anotação atualizada!" });
    },
  });

  // Delete note
  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-notes", documentId] });
      toast({ title: "Anotação removida." });
    },
  });

  const extractCategory = (content: string | null) => {
    const match = content?.match(/<!-- category: (\w+) -->/);
    return match?.[1] || "concept";
  };

  const extractPage = (content: string | null) => {
    const match = content?.match(/<!-- page: (\d+) -->/);
    return match ? parseInt(match[1]) : null;
  };

  const cleanContent = (content: string | null) => {
    if (!content) return "";
    return content.replace(/<!-- category: \w+ -->\n?/g, "").replace(/<!-- page: \d+ -->\n?/g, "").trim();
  };

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const onPageRenderSuccess = useCallback(() => {
    const container = pageContainerRef.current;
    if (!container) return;
    const pageCanvas = container.querySelector(".react-pdf__Page__canvas") as HTMLCanvasElement;
    if (pageCanvas) {
      setPageDimensions({
        width: pageCanvas.offsetWidth,
        height: pageCanvas.offsetHeight,
      });
    }
  }, []);

  const currentStrokes = pageStrokes[currentPage] ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-3 border-b border-border/50 flex-shrink-0 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/biblioteca")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="h-5 w-px bg-border/50" />
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium truncate max-w-[140px] lg:max-w-md">{doc?.title}</span>
        <div className="flex-1" />

        {/* Drawing tools */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
          {DRAWING_TOOLS.map((tool) => (
            <button
              key={tool.value}
              title={tool.label}
              onClick={() => {
                setActiveTool(tool.value);
                if (tool.value !== "none" && tool.value !== "eraser") setShowColors(false);
              }}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-md transition-all",
                activeTool === tool.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <tool.icon className="h-3.5 w-3.5" />
            </button>
          ))}
          <div className="h-5 w-px bg-border/50 mx-0.5" />
          <button
            title="Desfazer"
            onClick={handleUndo}
            disabled={currentStrokes.length === 0}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-all"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <div className="relative">
            <button
              title="Cores"
              onClick={() => setShowColors(!showColors)}
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <div className="h-4 w-4 rounded-full border-2 border-current" style={{ backgroundColor: activeColor }} />
            </button>
            {showColors && (
              <div className="absolute top-full right-0 mt-1 bg-card border border-border/50 rounded-lg p-2 z-50 shadow-xl">
                <div className="grid grid-cols-4 gap-1.5">
                  {DRAWING_COLORS.map((color) => (
                    <button
                      key={color.value}
                      title={color.label}
                      onClick={() => { setActiveColor(color.value); setShowColors(false); }}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 transition-all hover:scale-110",
                        activeColor === color.value ? "border-foreground scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-5 w-px bg-border/50" />

        {/* Page controls */}
        <div className="flex items-center gap-1 text-sm">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground min-w-[60px] text-center">
            {currentPage} / {numPages}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage >= numPages} onClick={() => setCurrentPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-5 w-px bg-border/50" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale((s) => Math.min(3, s + 0.2))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-0 overflow-hidden mt-3">
        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-muted/30 rounded-l-xl border border-border/50 flex justify-center">
          {pdfUrl ? (
            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
              <div ref={pageContainerRef} className="relative inline-block">
                <Page pageNumber={currentPage} scale={scale} onRenderSuccess={onPageRenderSuccess} />
                {pageDimensions.width > 0 && (
                  <PdfDrawingCanvas
                    width={pageDimensions.width}
                    height={pageDimensions.height}
                    activeTool={activeTool}
                    activeColor={activeColor}
                    strokes={currentStrokes}
                    onStrokesChange={handleStrokesChange}
                  />
                )}
                {activeTool === "none" && (
                  <TextSelectionPopup
                    containerRef={pageContainerRef}
                    onHighlight={handleTextHighlight}
                  />
                )}
              </div>
            </Document>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Notes Panel */}
        <div className="w-80 lg:w-96 border border-l-0 border-border/50 rounded-r-xl bg-card/50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Anotações</span>
              <Badge variant="secondary" className="text-xs">{notes.length}</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNewNote(!showNewNote)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {/* New note form */}
              {showNewNote && (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {NOTE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setNewNoteCategory(cat.value)}
                        className={cn(
                          "flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-all",
                          newNoteCategory === cat.value ? cat.color + " font-medium" : "border-border/50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <cat.icon className="h-3 w-3" />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Título (opcional)"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="text-sm h-8"
                  />
                  <Textarea
                    placeholder="Escreva em Markdown... (ex: **negrito**, *itálico*, - lista)"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={4}
                    className="text-sm resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Pág. {currentPage}</span>
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowNewNote(false)}>
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => createNote.mutate()}
                        disabled={!newNoteContent.trim() || createNote.isPending}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing notes */}
              {notes.map((note) => {
                const category = extractCategory(note.content);
                const page = extractPage(note.content);
                const catMeta = NOTE_CATEGORIES.find((c) => c.value === category) || NOTE_CATEGORIES[0];
                const content = cleanContent(note.content);
                const isEditing = editingNote === note.id;
                const isPreview = previewMode[note.id] ?? true;

                return (
                  <div key={note.id} className={cn("p-3 rounded-lg border transition-all", catMeta.color)}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <catMeta.icon className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{note.title}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {page && (
                          <button
                            onClick={() => setCurrentPage(page)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-background/50 hover:bg-background/80 transition-colors"
                          >
                            p.{page}
                          </button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            if (isEditing) {
                              setEditingNote(null);
                            } else {
                              setEditingNote(note.id);
                              setPreviewMode((prev) => ({ ...prev, [note.id]: false }));
                            }
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-destructive"
                          onClick={() => deleteNote.mutate(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex gap-1 mb-1">
                          <button
                            onClick={() => setPreviewMode((prev) => ({ ...prev, [note.id]: false }))}
                            className={cn("text-[10px] px-2 py-0.5 rounded", !isPreview ? "bg-background/80 font-medium" : "bg-background/30")}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setPreviewMode((prev) => ({ ...prev, [note.id]: true }))}
                            className={cn("text-[10px] px-2 py-0.5 rounded", isPreview ? "bg-background/80 font-medium" : "bg-background/30")}
                          >
                            Preview
                          </button>
                        </div>
                        {isPreview ? (
                          <div className="prose prose-sm prose-invert max-w-none text-xs">
                            <ReactMarkdown>{content}</ReactMarkdown>
                          </div>
                        ) : (
                          <Textarea
                            defaultValue={content}
                            rows={4}
                            className="text-xs resize-none"
                            id={`note-edit-${note.id}`}
                          />
                        )}
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setEditingNote(null)}>
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={() => {
                              const el = document.getElementById(`note-edit-${note.id}`) as HTMLTextAreaElement;
                              const newContent = `<!-- category: ${category} -->\n<!-- page: ${page || currentPage} -->\n\n${el?.value || content}`;
                              updateNote.mutate({ id: note.id, content: newContent });
                            }}
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed">
                        <ReactMarkdown>{content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                );
              })}

              {notes.length === 0 && !showNewNote && (
                <div className="text-center py-8 text-muted-foreground">
                  <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Nenhuma anotação ainda.</p>
                  <p className="text-[10px] mt-1">Clique em + para adicionar.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
