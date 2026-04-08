import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Lucas Ferreira",
    role: "Beta Tester — Área Fiscal",
    avatar: "LF",
    text: "Estou usando o NEURIX há 3 semanas no período de testes e já consigo perceber uma organização muito maior nos meus estudos. O motor de prioridade me mostrou que eu estava negligenciando matérias que pesam muito na prova.",
    stars: 5,
  },
  {
    name: "Camila Rodrigues",
    role: "Beta Tester — Área Tribunais",
    avatar: "CR",
    text: "A revisão espaçada é incrível. Antes eu esquecia tudo depois de uma semana, agora o sistema me avisa exatamente quando preciso revisar cada tópico. Sinto que estou retendo muito mais conteúdo.",
    stars: 5,
  },
  {
    name: "Pedro Henrique Santos",
    role: "Beta Tester — Área Policial",
    avatar: "PH",
    text: "O que mais me impressionou foi o perfil cognitivo. Ver meus pontos fortes e fracos de forma visual e com dados reais mudou completamente minha estratégia. Nunca tinha visto algo assim para concursos.",
    stars: 4,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24" id="depoimentos">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="neuro-badge mb-6">
            <Quote className="h-4 w-4 text-primary" />
            <span>Fase de Testes</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que nossos <span className="gradient-text">beta testers</span> estao dizendo
          </h2>
          <p className="text-muted-foreground text-lg">
            Feedback real de quem esta testando o NEURIX agora mesmo.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -4 }}
              className="neuro-card p-6 relative group hover:border-primary/30 transition-all duration-300"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s < t.stars ? "fill-warning text-warning" : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
