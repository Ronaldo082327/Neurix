import { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const studyAreas = [
  "Área Fiscal",
  "Área de Tribunais",
  "Área Policial",
  "Área de Controle",
  "Área Administrativa",
  "Área Bancária",
  "Área de Gestão",
  "Outra",
];

const stages = [
  "Ainda não comecei a estudar",
  "Estudo há menos de 6 meses",
  "Estudo há 6 meses a 1 ano",
  "Estudo há mais de 1 ano",
  "Já fui aprovado(a) antes",
];

export function PreLaunchSection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    study_area: "",
    current_stage: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Preencha pelo menos nome e email.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("pre_launch_signups" as any).insert({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      study_area: form.study_area || null,
      current_stage: form.current_stage || null,
    });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("Este email já está cadastrado!");
      } else {
        toast.error("Erro ao cadastrar. Tente novamente.");
      }
      return;
    }

    setSubmitted(true);
    toast.success("Cadastro realizado com sucesso!");
  };

  if (submitted) {
    return (
      <section className="py-24 relative" id="pre-lancamento">
        <div className="absolute inset-0 neural-grid opacity-20" />
        <div className="container relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center p-10 rounded-2xl border border-primary/30 bg-card glow-purple"
          >
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-3">Você está na lista!</h3>
            <p className="text-muted-foreground">
              Enviamos um email de confirmação. Enquanto isso, você já pode explorar a plataforma
              criando sua conta gratuitamente.
            </p>
            <Button variant="hero" className="mt-6" asChild>
              <a href="/registro">Começar a usar agora</a>
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 relative" id="pre-lancamento">
      <div className="absolute inset-0 neural-grid opacity-20" />
      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="neuro-badge mb-6 border-warning/30 bg-warning/5">
            <Rocket className="h-4 w-4 text-warning" />
            <span className="text-warning">Pré-lançamento — Vagas Limitadas</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Garanta seu acesso ao{" "}
            <span className="gradient-text">NEURIX</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cadastre-se para o pré-lançamento e comece a usar a plataforma gratuitamente durante o período de testes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto"
        >
          <form
            onSubmit={handleSubmit}
            className="neuro-card p-8 space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={100}
                className="bg-muted/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                maxLength={255}
                className="bg-muted/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={20}
                className="bg-muted/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Qual área de concursos você estuda?</Label>
              <select
                id="area"
                className="flex h-10 w-full rounded-md border border-border/50 bg-muted/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.study_area}
                onChange={(e) => setForm({ ...form, study_area: e.target.value })}
              >
                <option value="">Selecione...</option>
                {studyAreas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Há quanto tempo estuda para concursos?</Label>
              <select
                id="stage"
                className="flex h-10 w-full rounded-md border border-border/50 bg-muted/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.current_stage}
                onChange={(e) => setForm({ ...form, current_stage: e.target.value })}
              >
                <option value="">Selecione...</option>
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full text-base py-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Garantir meu acesso gratuito
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Ao se cadastrar, você concorda com nossos termos de uso e política de privacidade.
            </p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
