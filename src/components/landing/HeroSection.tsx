import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Brain, Zap, Target, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { NeuralBackground } from "./NeuralBackground";
import neurixLogo from "@/assets/neurix-logo-new.png";

const cards = [
  {
    icon: Brain,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Curva de Ebbinghaus",
    formula: "R = e^{-Δt / S}",
    desc: "Modelamos a retenção de cada tópico com decaimento exponencial. A estabilidade S cresce a cada revisão bem-sucedida.",
  },
  {
    icon: Zap,
    color: "text-secondary",
    bg: "bg-secondary/10",
    title: "Rastreamento Bayesiano",
    formula: "P(L|obs) ∝ P(obs|L)·P(L)",
    desc: "Usamos BKT para estimar a probabilidade real de domínio, separando acertos por chute de conhecimento verdadeiro.",
  },
  {
    icon: Target,
    color: "text-accent",
    bg: "bg-accent/10",
    title: "Simulação Monte Carlo",
    formula: "E(nota) = Σ wᵢ × pLᵢ",
    desc: "Milhares de simulações probabilísticas estimam sua nota esperada, identificando onde cada hora de estudo tem mais impacto.",
  },
  {
    icon: Shield,
    color: "text-neural-emerald",
    bg: "bg-neural-emerald/10",
    title: "Função Hazard Adaptativa",
    formula: "λ = e^{α + b₁·Δt + b₂·F + b₃·A}",
    desc: "Fatores como fadiga e estado emocional modulam sua taxa de esquecimento em tempo real.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <NeuralBackground />

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 neuro-badge mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              Plataforma de Engenharia Cognitiva com IA
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 relative"
          >
            {/* Animated glow behind gradient text */}
            <span className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r from-primary via-accent to-secondary pointer-events-none" />
            <span className="relative">
              Seu{" "}
              <span className="gradient-aurora-text">Gêmeo Digital</span>
              <br />
              <span className="text-foreground">Cognitivo</span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            NEURIX combina inteligência artificial, repetição espaçada e perfil cognitivo
            dinâmico para maximizar sua aprovação em concursos públicos.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="hero" size="lg" className="text-base px-8 py-6" asChild>
              <Link to="/registro">
                <img src={neurixLogo} alt="" className="h-5 w-5 mr-2" />
                Começar Gratuitamente
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-8 py-6" asChild>
              <Link to="/login">
                Já tenho conta
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* Formula Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
          >
            {cards.map((card) => (
              <motion.div
                key={card.title}
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.03 }}
                className="neuro-card group relative p-5 text-left"
              >
                <div
                  className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}
                >
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {card.title}
                </h3>
                <code className="block text-xs font-mono text-primary/80 mb-2 bg-primary/5 px-2 py-1 rounded">
                  {card.formula}
                </code>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {card.desc}
                </p>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
