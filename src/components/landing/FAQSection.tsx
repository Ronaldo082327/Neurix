import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "O que é o NEURIX?",
    a: "O NEURIX é uma plataforma de engenharia cognitiva que funciona como um gêmeo digital do estudante. Ele organiza seus estudos, acompanha seu desempenho e usa inteligência artificial para otimizar sua preparação para concursos públicos.",
  },
  {
    q: "Preciso pagar para usar?",
    a: "Não! Oferecemos um plano gratuito para você experimentar as funcionalidades básicas. Para recursos avançados como Coach IA e perfil cognitivo completo, temos planos acessíveis a partir de R$ 39/mês.",
  },
  {
    q: "Como a IA personaliza meus estudos?",
    a: "O sistema analisa seu histórico de sessões, taxa de acerto, tempo entre revisões e padrões de produtividade para criar um perfil cognitivo único. Com base nisso, ele sugere o que, quando e como estudar de forma otimizada.",
  },
  {
    q: "Posso fazer upload dos meus materiais?",
    a: "Sim! Você pode fazer upload de PDFs, anotar trechos importantes, categorizar destaques e conectá-los aos seus tópicos de estudo para uma revisão mais eficiente.",
  },
  {
    q: "O NEURIX substitui cursinhos preparatórios?",
    a: "O NEURIX complementa qualquer método de estudo. Ele não é um cursinho, mas sim uma ferramenta de organização e otimização cognitiva que potencializa o que você já estuda.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Absolutamente. Utilizamos criptografia de ponta a ponta e infraestrutura segura. Seus dados são exclusivamente seus e nunca são compartilhados com terceiros.",
  },
];

export function FAQSection() {
  return (
    <section className="py-24 section-glow" id="faq">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perguntas <span className="gradient-text">Frequentes</span>
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <AccordionItem
                  value={`faq-${i}`}
                  className="border border-border/50 rounded-xl px-6 bg-card/50 hover:border-primary/20 hover:bg-card/70 transition-all duration-300"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
