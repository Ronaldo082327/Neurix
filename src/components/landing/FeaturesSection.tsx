import { motion } from "framer-motion";
import {
  Brain,
  Calendar,
  BarChart3,
  FileText,
  MessageSquare,
  Target,
  BookOpen,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Perfil Cognitivo",
    description:
      "IA que mapeia seus pontos fortes e fracos, criando um perfil dinâmico de aprendizagem personalizado.",
    featured: true,
  },
  {
    icon: Calendar,
    title: "Plano de Estudos Inteligente",
    description:
      "Cronograma adaptativo que ajusta prioridades automaticamente com base no seu desempenho e tempo disponível.",
    featured: true,
  },
  {
    icon: BarChart3,
    title: "Analytics de Desempenho",
    description:
      "Dashboards detalhados com métricas de evolução por disciplina, taxa de acerto e consistência de estudos.",
    featured: false,
  },
  {
    icon: FileText,
    title: "Biblioteca de Materiais",
    description:
      "Upload e organização de PDFs com destaques inteligentes e anotações conectadas aos seus tópicos.",
    featured: false,
  },
  {
    icon: MessageSquare,
    title: "Coach IA",
    description:
      "Assistente de inteligência artificial que analisa seus dados e oferece orientações estratégicas personalizadas.",
    featured: false,
  },
  {
    icon: Target,
    title: "Sistema de Revisão",
    description:
      "Fila de revisões baseada em repetição espaçada para maximizar a retenção de conteúdo a longo prazo.",
    featured: false,
  },
  {
    icon: BookOpen,
    title: "Gestão de Disciplinas",
    description:
      "Organize disciplinas e tópicos com acompanhamento de domínio e histórico completo de revisões.",
    featured: false,
  },
  {
    icon: Zap,
    title: "Metas e Consistência",
    description:
      "Defina metas semanais e acompanhe sua sequência de dias estudando para manter o ritmo.",
    featured: false,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function FeaturesSection() {
  return (
    <section className="py-24 relative" id="funcionalidades">
      {/* Neural grid background */}
      <div className="absolute inset-0 neural-grid opacity-20 pointer-events-none" />

      <div className="container relative z-10 px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para{" "}
            <span className="gradient-text">ser aprovado</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma plataforma completa que integra todas as ferramentas necessárias
            para uma preparação eficiente e estratégica.
          </p>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-6xl mx-auto"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className={`neuro-card group relative p-6 overflow-hidden ${
                  feature.featured
                    ? "md:col-span-2 md:row-span-2 border-primary/30"
                    : ""
                }`}
              >
                {/* Gradient border glow for featured cards */}
                {feature.featured && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 pointer-events-none" />
                )}

                <div className="relative z-10">
                  {/* Icon container */}
                  <div
                    className={`inline-flex items-center justify-center rounded-xl ${
                      feature.featured ? "h-14 w-14 mb-5" : "h-10 w-10 mb-4"
                    } bg-gradient-to-br from-primary/20 to-secondary/10 transition-transform duration-300 group-hover:[&>svg]:rotate-12`}
                  >
                    <Icon
                      className={`${
                        feature.featured ? "h-7 w-7" : "h-5 w-5"
                      } text-primary transition-transform duration-300 group-hover:rotate-12`}
                    />
                  </div>

                  <h3
                    className={`font-semibold text-foreground mb-2 ${
                      feature.featured ? "text-xl" : "text-base"
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`text-muted-foreground leading-relaxed ${
                      feature.featured ? "text-base" : "text-sm"
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
