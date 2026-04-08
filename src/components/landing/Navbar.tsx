import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import neurixLogo from "@/assets/neurix-icon-new.png";

const navLinks = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#como-funciona", label: "Como Funciona" },
  { href: "#ciencia", label: "Ciência" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 20);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(offset / docHeight, 1) : 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-strong shadow-lg shadow-violet-500/5" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative">
              <img
                src={neurixLogo}
                alt="Neurix"
                className="h-8 w-8 object-contain"
              />
              {/* Pulsing glow dot */}
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_2px_hsla(262,83%,58%,0.6)]" />
            </div>
            <span className="font-display text-xl font-bold tracking-wider gradient-text">
              NEURIX
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-3 py-2 text-sm text-white/70 hover:text-white transition-colors duration-300 group"
              >
                {link.label}
                {/* Underline animation expanding from center */}
                <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 bg-gradient-to-r from-violet-500 via-cyan-400 to-fuchsia-500 transition-all duration-300 group-hover:w-3/4 rounded-full" />
              </a>
            ))}
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/5">
                Entrar
              </Button>
            </Link>
            <Link to="/registro">
              <Button
                variant="default"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
              >
                Criar conta
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden glass-strong border-t border-white/5"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}

              <div className="pt-4 mt-2 border-t border-white/5 flex flex-col gap-2">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="ghost"
                    className="w-full text-white/80 hover:text-white hover:bg-white/5"
                  >
                    Entrar
                  </Button>
                </Link>
                <Link to="/registro" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="default"
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0"
                  >
                    Criar conta
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent">
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${scrollProgress * 100}%`,
            background:
              "linear-gradient(90deg, hsl(262 83% 58%), hsl(195 100% 42%), hsl(330 80% 60%))",
          }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </nav>
  );
}
