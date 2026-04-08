import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background neural-grid p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl gradient-primary-bg flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">NEURIX</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Recuperar senha</h1>
          <p className="text-muted-foreground text-sm">
            {sent
              ? "Verifique seu e-mail para redefinir sua senha"
              : "Digite seu e-mail para receber o link de recuperação"}
          </p>
        </div>

        {sent ? (
          <div className="p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold">E-mail enviado! ✉️</h3>
            <p className="text-sm text-muted-foreground">
              Enviamos um link de recuperação para <strong>{email}</strong>. 
              Verifique sua caixa de entrada e spam.
            </p>
            <Button variant="ghost" asChild className="mt-4">
              <Link to="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao login
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button variant="hero" className="w-full" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline font-medium">
                <ArrowLeft className="h-3 w-3 inline mr-1" />
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
