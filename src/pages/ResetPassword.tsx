import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Senhas não coincidem", description: "Verifique se as senhas são iguais.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/app"), 3000);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background neural-grid p-4">
        <div className="w-full max-w-md text-center">
          <div className="p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl space-y-4">
            <Brain className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Link inválido ou expirado</h2>
            <p className="text-sm text-muted-foreground">
              Este link de recuperação não é válido. Solicite um novo link.
            </p>
            <Button variant="hero" asChild>
              <Link to="/forgot-password">Solicitar novo link</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background neural-grid p-4">
        <div className="w-full max-w-md text-center">
          <div className="p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl space-y-4">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
            <h2 className="text-xl font-bold">Senha atualizada! 🎉</h2>
            <p className="text-sm text-muted-foreground">
              Sua senha foi alterada com sucesso. Redirecionando...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold mb-2">Nova senha</h1>
          <p className="text-muted-foreground text-sm">Defina sua nova senha de acesso</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button variant="hero" className="w-full" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </div>
  );
}
