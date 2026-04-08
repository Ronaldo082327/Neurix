import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function RegistroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Senha muito curta", description: "A senha precisa ter no mínimo 8 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
      navigate("/login");
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
          <h1 className="text-2xl font-bold mb-2">Crie sua conta</h1>
          <p className="text-muted-foreground text-sm">Comece sua jornada de estudos inteligentes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input id="password" type={showPw ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button variant="hero" className="w-full" type="submit" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
