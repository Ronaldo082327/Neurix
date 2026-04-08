import { motion } from "framer-motion";
import {
  Upload,
  Brain,
  Eye,
  Layers,
  BarChart3,
  RefreshCw,
  Zap,
  BookOpen,
  Target,
  Activity,
  MessageSquare,
  Sparkles,
  FileText,
  Highlighter,
  Clock,
  TrendingUp,
  Shield,
  Cpu,
} from "lucide-react";

const phases = [
  {
    id: "upload",
    icon: Upload,
    color: "from-primary to-blue-400",
    title: "1. Upload & Ingestão de Materiais",
    subtitle: "Seu conteúdo se torna inteligente",
    description:
      "Tudo começa quando você faz upload dos seus materiais — PDFs, apostilas, resumos, mapas mentais, editais, anotações. O pipeline interno do NEURIX processa cada documento: extrai metadados, indexa o conteúdo, quebra em trechos semânticos, detecta disciplinas e conecta assuntos. Seus arquivos deixam de ser estáticos e passam a se comportar como objetos cognitivos interativos, prontos para RAG e diálogo com IA.",
    details: [
      "Processamento assíncrono de PDFs com OCR",
      "Extração de metadados e criação de camadas semânticas",
      "Indexação para busca e conexão entre tópicos",
      "Preparação para RAG — a IA conversa com seus materiais",
    ],
  },
  {
    id: "observe",
    icon: Eye,
    color: "from-purple-500 to-violet-400",
    title: "2. Observação & Eventos Cognitivos",
    subtitle: "Cada interação é um sinal",
    description:
      "Quando você abre um material dentro do NEURIX, a plataforma não atua como leitor passivo. Ela observa e interpreta sua interação: tempo de permanência em trechos, destaques, marcações de dúvida, anotações de pegadinhas, revisitações de páginas. Cada interação é capturada como evento cognitivo e alimenta um motor de inferência que identifica padrões de atenção, zonas de dificuldade, lacunas conceituais, sinais de fadiga e áreas de falsa fluência.",
    details: [
      "Telemetria de leitura — tempo por página, por trecho, por tópico",
      "Captura de highlights categorizados (conceito, dúvida, pegadinha, revisão)",
      "Detecção de padrões de atenção e dispersão",
      "Identificação de falsa fluência vs. domínio real",
    ],
  },
  {
    id: "twin",
    icon: Brain,
    color: "from-cyan-500 to-teal-400",
    title: "3. Construção do Gêmeo Cognitivo",
    subtitle: "Quatro camadas modelam sua mente",
    description:
      "O gêmeo cognitivo nasce da integração de quatro camadas. A camada de conteúdo (tudo que você sobe e produz). A camada comportamental (sessões, tempo, frequência, pausas, consistência). A camada de desempenho (questões, acertos, desempenho por matéria/banca/nível). E a camada inferencial, onde os modelos calculam retenção via Ebbinghaus, domínio via BKT bayesiano, prioridade de revisão, fadiga, confiança real e risco de ilusão de aprendizagem.",
    details: [
      "Camada de Conteúdo — materiais, highlights, anotações, flashcards",
      "Camada Comportamental — sessões, ritmo, energia, consistência semanal",
      "Camada de Desempenho — questões, acertos por disciplina/banca/nível",
      "Camada Inferencial — BKT, Ebbinghaus, Monte Carlo, Hazard Function",
    ],
  },
  {
    id: "review",
    icon: RefreshCw,
    color: "from-emerald-500 to-green-400",
    title: "4. Revisão Estratégica Automatizada",
    subtitle: "O que voltar, quando voltar, em que formato",
    description:
      "O NEURIX não oferece revisões genéricas. Quando você resolve questões, o sistema cruza respostas com materiais estudados, highlights feitos, tempo dedicado e histórico de revisões. Ele entende relações causais: leu o assunto mas errou questões básicas? Baixa consolidação. Acertou questões difíceis rapidamente? Domínio real. Acerta logo após estudar mas erra dias depois? Retenção fraca. Com isso, cria revisões personalizadas — D+1, D+3, D+7, D+15, D+30 — baseadas no estado cognitivo real de cada conteúdo na sua mente.",
    details: [
      "Revisões SM-2 adaptativas por tópico individual",
      "Geração automática de flashcards a partir dos seus highlights",
      "Cadernos de erro inteligentes com contexto dos materiais",
      "Pacotes de revisão por urgência e risco de esquecimento",
    ],
  },
  {
    id: "optimize",
    icon: Zap,
    color: "from-amber-500 to-orange-400",
    title: "5. Otimização Contínua & Coach IA",
    subtitle: "Cada ação produz valor cumulativo",
    description:
      "Ao longo do tempo, o sistema constrói uma memória estruturada: quais disciplinas são frágeis, quais assuntos voláteis, quais bancas expõem mais erros, quais horários funcionam melhor, quais conteúdos precisam voltar em formato de questão e quais em formato de explicação. O NEURIX age como coach proativo — orienta o que estudar hoje, o que revisar agora, onde há risco de esquecimento, quais erros se repetem, onde existe chance real de ganho de pontuação. Cada interação retroalimenta o modelo. Cada documento amplia sua base. Cada questão recalibra seu mapa de domínio.",
    details: [
      "Simulação Monte Carlo de nota esperada na prova",
      "Planejamento adaptativo moldado pela sua biografia cognitiva",
      "Alertas proativos de revisão, risco e oportunidade",
      "Coach IA com contexto real dos seus materiais via RAG",
    ],
  },
];

const architectureFeatures = [
  { icon: FileText, label: "Biblioteca Documental Inteligente", desc: "Upload, processamento e visualização de PDFs com camadas semânticas" },
  { icon: Highlighter, label: "Motor de Highlights", desc: "Destaques categorizados que viram flashcards, resumos e revisões" },
  { icon: Clock, label: "Telemetria de Sessões", desc: "Registro de início, fim, duração, intensidade e foco de cada estudo" },
  { icon: RefreshCw, label: "Fila de Revisão Espaçada", desc: "SM-2 adaptativo com intervalos calculados por estado cognitivo" },
  { icon: Brain, label: "Modelagem BKT Bayesiana", desc: "Separa acerto por chute de conhecimento verdadeiro" },
  { icon: Activity, label: "Curva de Ebbinghaus + Hazard", desc: "Fadiga e estado emocional modulam taxa de esquecimento" },
  { icon: BarChart3, label: "Simulação Monte Carlo", desc: "Milhares de cenários estimam sua nota e mostram onde investir" },
  { icon: Cpu, label: "RAG Contextual", desc: "A IA conversa com base nos seus materiais reais, não em prompts soltos" },
  { icon: Target, label: "Detecção de Falsa Fluência", desc: "Identifica quando você acha que sabe, mas os dados dizem o contrário" },
  { icon: TrendingUp, label: "Plano Adaptativo Individual", desc: "Dois alunos, mesmo PDF — planos diferentes baseados em perfil cognitivo" },
  { icon: Shield, label: "Armazenamento Privado", desc: "Seus materiais seguros com processamento assíncrono no backend" },
  { icon: MessageSquare, label: "Coach IA Proativo", desc: "Orientações, lembretes e recomendações baseadas no seu gêmeo cognitivo" },
];

/* Animated dot that travels along the timeline connector */
function TimelineDot({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(262_83%_58%/0.6)]"
      initial={{ top: "0%", opacity: 0 }}
      animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        repeatDelay: 3,
        ease: "easeInOut",
      }}
    />
  );
}

export function HowItWorksSection() {
  return (
    <section className="py-24 relative overflow-hidden" id="como-funciona">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px]" />
        <div className="absolute top-3/4 left-0 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="container px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="neuro-badge mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Engenharia Cognitiva + IA</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Como o <span className="gradient-text">Gêmeo Cognitivo</span> funciona
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            O NEURIX não é um app de estudos. É um sistema de modelagem da mente que observa, registra,
            interpreta e otimiza seu comportamento cognitivo — transformando estudo em sistema,
            esforço em inteligência acumulada e comportamento em vantagem competitiva.
          </p>
        </motion.div>

        {/* Core philosophy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-20 p-6 md:p-8 rounded-2xl glass-strong"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Não armazenamos conteúdo — modelamos aprendizagem</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                O NEURIX constrói uma representação viva do estudante. Não se trata de um avatar estético,
                mas de um modelo matemático e operacional do seu processo de aprendizagem — uma extensão
                computacional da sua mente de concurseiro. Ele organiza não só o conteúdo, mas a forma como
                seu cérebro aprende, esquece, revisa, erra, evolui, se dispersa e consolida conhecimento.
                Você estuda uma vez, mas o sistema reaproveita esse esforço diversas vezes, desdobrando cada
                interação em múltiplos ativos de aprendizagem.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Vertical Timeline */}
        <div className="max-w-5xl mx-auto mb-24 relative">
          {/* Central timeline line (desktop) */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-[hsl(160,84%,39%)]" />

          {/* Animated traveling dots on the desktop line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 overflow-hidden">
            <TimelineDot delay={0} />
            <TimelineDot delay={1.2} />
            <TimelineDot delay={2.4} />
          </div>

          {/* Mobile timeline line */}
          <div className="md:hidden absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-[hsl(160,84%,39%)]" />

          <div className="space-y-16 md:space-y-20">
            {phases.map((phase, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="relative"
                >
                  {/* Phase number circle on timeline - Desktop */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-6 z-20">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className={`h-12 w-12 rounded-full bg-gradient-to-br ${phase.color} flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-background`}
                    >
                      {i + 1}
                    </motion.div>
                  </div>

                  {/* Phase number circle on timeline - Mobile */}
                  <div className="md:hidden absolute left-6 -translate-x-1/2 top-0 z-20">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className={`h-10 w-10 rounded-full bg-gradient-to-br ${phase.color} flex items-center justify-center text-white font-bold text-sm shadow-lg ring-4 ring-background`}
                    >
                      {i + 1}
                    </motion.div>
                  </div>

                  {/* Card layout - alternates left/right on desktop */}
                  <div className="md:grid md:grid-cols-2 md:gap-12">
                    {/* Spacer for right-aligned cards */}
                    {!isLeft && <div className="hidden md:block" />}

                    {/* Content card */}
                    <div className={`pl-14 md:pl-0 ${isLeft ? "md:pr-16 md:text-right" : "md:pl-16 md:text-left"}`}>
                      <div className="neuro-card p-6 group hover:border-primary/40 transition-colors">
                        {/* Gradient icon badge */}
                        <div
                          className={`inline-flex h-11 w-11 rounded-xl bg-gradient-to-br ${phase.color} items-center justify-center mb-4 shadow-md`}
                        >
                          <phase.icon className="h-5 w-5 text-white" />
                        </div>

                        <p className="text-xs font-mono text-primary/60 uppercase tracking-wider mb-1">
                          {phase.subtitle}
                        </p>
                        <h3 className="text-xl md:text-2xl font-display font-bold mb-3">
                          {phase.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                          {phase.description}
                        </p>

                        {/* Detail bullets in nested card */}
                        <div className="space-y-2 p-4 rounded-xl bg-background/40 border border-border/20">
                          {phase.details.map((detail, j) => (
                            <motion.div
                              key={j}
                              initial={{ opacity: 0, x: isLeft ? -10 : 10 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.25 + j * 0.08 }}
                              className={`flex items-start gap-3 ${isLeft ? "md:flex-row-reverse md:text-right" : ""}`}
                            >
                              <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${phase.color} mt-1.5 shrink-0`} />
                              <span className="text-sm text-foreground/80">{detail}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Spacer for left-aligned cards */}
                    {isLeft && <div className="hidden md:block" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Architecture Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl md:text-3xl font-display font-bold mb-3">
            Arquitetura do <span className="gradient-text">Motor Cognitivo</span>
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Backend estruturado, processamento assíncrono, IA contextual e telemetria completa —
            cada componente trabalha em conjunto para refinar continuamente sua representação cognitiva.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {architectureFeatures.map((feat, i) => (
            <motion.div
              key={feat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="neuro-card p-4 group"
            >
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <feat.icon className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold mb-1">{feat.label}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 max-w-2xl mx-auto"
        >
          <p className="text-muted-foreground text-sm leading-relaxed italic">
            "O objetivo final é transformar estudo em sistema, esforço em inteligência acumulada e
            comportamento em vantagem competitiva. O concurseiro não fica mais sozinho. O NEURIX observa
            tudo, calcula tudo e devolve decisões concretas. Em vez de apenas armazenar conteúdo,
            ele <strong className="text-foreground">aprende o aluno</strong>."
          </p>
        </motion.div>
      </div>
    </section>
  );
}
