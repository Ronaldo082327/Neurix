import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    description: "Para experimentar a plataforma",
    features: [
      "Até 3 disciplinas",
      "Plano de estudos básico",
      "Dashboard de progresso",
      "5 uploads de PDF",
      "Revisões limitadas",
    ],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 39",
    period: "/mês",
    description: "Para quem estuda sério",
    features: [
      "Disciplinas ilimitadas",
      "Plano de estudos com IA",
      "Coach NEURIX completo",
      "Uploads ilimitados",
      "Perfil cognitivo avançado",
      "Revisão espaçada inteligente",
      "Analytics detalhado",
    ],
    cta: "Assinar Pro",
    highlight: true,
  },
  {
    name: "Premium",
    price: "R$ 69",
    period: "/mês",
    description: "Máximo desempenho",
    features: [
      "Tudo do Pro",
      "Simulados com IA",
      "Mentoria prioritária",
      "Relatórios avançados",
      "API de integração",
      "Suporte prioritário",
      "Acesso antecipado a novidades",
    ],
    cta: "Assinar Premium",
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-24 relative" id="planos">
      <div className="absolute inset-0 neural-grid opacity-20" />
      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Escolha seu <span className="gradient-text">plano</span>
          </h2>
          <p className="text-muted-foreground text-lg">Invista na sua aprovação com o plano ideal para você.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`p-8 rounded-2xl border transition-all duration-300 relative ${
                plan.highlight
                  ? "border-primary/50 bg-card glow-purple"
                  : "neuro-card"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-aurora-bg text-xs font-semibold text-white">
                  Mais popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <Button
                variant={plan.highlight ? "hero" : "hero-outline"}
                className="w-full mb-6"
                asChild
              >
                <Link to="/registro">{plan.cta}</Link>
              </Button>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
