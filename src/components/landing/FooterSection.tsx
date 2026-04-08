import { Link } from "react-router-dom";
import { NeurixLogo } from "@/components/NeurixLogo";

export function FooterSection() {
  return (
    <footer className="relative pt-12 pb-8">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      {/* Subtle glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 bg-primary/5 blur-3xl pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="flex flex-col items-center gap-6">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <NeurixLogo size={32} animated={false} />
              <span className="font-display text-xl font-bold gradient-text">NEURIX</span>
            </div>
            <p className="text-xs text-muted-foreground tracking-wide">
              Engenharia Cognitiva para Concursos
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="#" className="hover:text-primary transition-colors">Termos</Link>
            <Link to="#" className="hover:text-primary transition-colors">Privacidade</Link>
            <Link to="#" className="hover:text-primary transition-colors">Contato</Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            &copy; 2026 NEURIX. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
