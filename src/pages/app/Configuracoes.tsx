import { useState, useEffect } from "react";
import { Settings, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ConfiguracoesPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [dailyHours, setDailyHours] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setTargetExam(profile.target_exam ?? "");
      setDailyHours(String(profile.daily_hours ?? 2));
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName,
      target_exam: targetExam,
      daily_hours: parseFloat(dailyHours) || 2,
    }).eq("user_id", user.id);
    setSaving(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo!", description: "Suas configurações foram atualizadas." });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie sua conta e preferências.</p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={user?.email ?? ""} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label>Concurso alvo</Label>
            <Input placeholder="Ex: Analista TRF" value={targetExam} onChange={(e) => setTargetExam(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Horas de estudo por dia</Label>
            <Input type="number" value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <Button variant="hero" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleSignOut}>Sair da conta</Button>
          </div>
        </TabsContent>

        <TabsContent value="assinatura" className="mt-6">
          <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Plano {profile?.subscription_plan === "pro" ? "Pro" : "Gratuito"}</h3>
                <p className="text-sm text-muted-foreground">{profile?.subscription_plan === "pro" ? "R$ 39/mês" : "Recursos básicos"}</p>
              </div>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-4 mt-6">
          {["Revisões pendentes", "Resumo diário", "Dicas do Coach IA", "Novidades da plataforma"].map((n) => (
            <div key={n} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
              <span className="text-sm">{n}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
