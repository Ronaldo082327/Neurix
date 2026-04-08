import { motion } from "framer-motion";
import { Brain, BarChart3, TrendingDown, RefreshCw, Network, Cpu, Zap, Activity, Calculator, GitBranch } from "lucide-react";
import { AnimatedCognitiveGraph } from "./AnimatedCognitiveGraph";
import { FormulaCard } from "./FormulaCard";
import { ForgettingCurveChart } from "./ForgettingCurveChart";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const cardHover = {
  rest: { scale: 1, borderColor: "hsl(200 12% 13% / 0.6)" },
  hover: {
    scale: 1.02,
    borderColor: "hsl(168 64% 40% / 0.4)",
    transition: { duration: 0.25 },
  },
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-md bg-primary/10 text-primary font-semibold text-sm border border-primary/20">
      {children}
    </span>
  );
}

const scienceCards = [
  {
    icon: Brain,
    title: "Inferência Bayesiana",
    desc: "Seu cérebro atualiza crenças a cada nova informação. O NEURIX replica esse processo: cada interação recalcula a probabilidade de domínio de cada conceito.",
  },
  {
    icon: Network,
    title: "Grafo Cognitivo",
    desc: "Todo conteúdo vira um grafo de conhecimento interconectado. Cada nó possui probabilidade de domínio, histórico de erros, estabilidade de memória e tempo de revisão.",
  },
  {
    icon: RefreshCw,
    title: "Atualização em Tempo Real",
    desc: "A cada questão respondida, o sistema atualiza o nível de domínio usando Bayesian Knowledge Tracing (BKT) com 4 parâmetros: P(L₀), P(T), P(S), P(G).",
  },
  {
    icon: TrendingDown,
    title: "Curva de Esquecimento",
    desc: "Baseado no modelo de Ebbinghaus, o NEURIX prevê quando a retenção cairá e agenda revisões automáticas antes que o esquecimento aconteça.",
  },
];

const formulas = [
  {
    icon: Calculator,
    title: "Bayesian Knowledge Tracing (BKT)",
    formula: `P(Lₙ | acerto) = \n  P(Lₙ) × (1 - P(S))\n─────────────────────────────\nP(Lₙ)×(1-P(S)) + (1-P(Lₙ))×P(G)\n\nP(Lₙ₊₁) = P(Lₙ | obs) + (1 - P(Lₙ | obs)) × P(T)`,
    variables: [
      { symbol: "P(Lₙ)", meaning: "Probabilidade de domínio do conceito no momento n — representa o quanto o aluno sabe antes da interação" },
      { symbol: "P(T)", meaning: "Probabilidade de transição (aprender). Chance de o aluno aprender o conceito após uma interação. Valor padrão: 0.12" },
      { symbol: "P(S)", meaning: "Probabilidade de Slip (escorregão). Chance de errar mesmo sabendo o conteúdo — modela desatenção. Valor padrão: 0.10" },
      { symbol: "P(G)", meaning: "Probabilidade de Guess (chute). Chance de acertar sem realmente saber — modela sorte. Valor padrão: 0.20" },
      { symbol: "P(L₀)", meaning: "Conhecimento inicial (prior). Probabilidade de já saber o conceito antes de qualquer interação. Valor padrão: 0.25" },
    ],
    explanation: "O BKT é um modelo de Markov Oculto (HMM) que trata o conhecimento como uma variável latente binária (sabe ou não sabe). A cada interação do aluno, o sistema aplica o Teorema de Bayes para atualizar a probabilidade posterior de domínio. Se o aluno acerta, P(Lₙ) sobe (descontando a chance de chute). Se erra, desce (descontando a chance de escorregão). Após a atualização bayesiana, soma-se a probabilidade de transição P(T) — representando a chance de aprendizado ter ocorrido.",
    example: "Se P(L₀)=0.25, o aluno acerta uma questão: P(L|acerto) = 0.25×0.90 / (0.25×0.90 + 0.75×0.20) = 0.225/0.375 = 0.60. Depois: P(L₁) = 0.60 + 0.40×0.12 = 0.648. O domínio saltou de 25% para 64.8% com um único acerto.",
  },
  {
    icon: TrendingDown,
    title: "Curva de Esquecimento de Ebbinghaus",
    formula: `R(t) = e^(-t/S)\n\nS = S₀ × d^(n-1)\n\nt_revisão = -S × ln(R_alvo)`,
    variables: [
      { symbol: "R(t)", meaning: "Retenção no tempo t — proporção do conhecimento que o aluno ainda retém após t dias sem revisão" },
      { symbol: "t", meaning: "Tempo decorrido desde a última revisão (em dias)" },
      { symbol: "S", meaning: "Estabilidade da memória — constante que determina a velocidade do esquecimento. Quanto maior, mais lenta a curva de decaimento" },
      { symbol: "S₀", meaning: "Estabilidade inicial — valor base antes de qualquer revisão. Valor padrão: 1.0 dia" },
      { symbol: "d", meaning: "Fator de crescimento da estabilidade a cada revisão bem-sucedida. Valor padrão: 2.0 (dobra a cada revisão)" },
      { symbol: "n", meaning: "Número de revisões bem-sucedidas realizadas" },
      { symbol: "R_alvo", meaning: "Retenção mínima desejada antes de agendar nova revisão. Padrão: 0.85 (85%)" },
    ],
    explanation: "O modelo exponencial de Ebbinghaus descreve como a memória decai ao longo do tempo sem reforço. A retenção cai exponencialmente com taxa inversamente proporcional à estabilidade S. A cada revisão bem-sucedida, a estabilidade multiplica pelo fator d, tornando o esquecimento cada vez mais lento (espaçamento crescente). O sistema calcula automaticamente o momento ideal para revisão (t_revisão) resolvendo a equação para R(t) = R_alvo.",
    example: "Após 1ª revisão: S=1, o aluno esquece 15% em -1×ln(0.85) ≈ 0.16 dias (~4h). Após 2ª revisão: S=2, esquece 15% em 0.33 dias (~8h). Após 5ª revisão: S=16, esquece 15% em 2.6 dias. O intervalo entre revisões cresce exponencialmente.",
  },
  {
    icon: Activity,
    title: "Atualização Bayesiana Posterior",
    formula: `P(H|E) = P(E|H) × P(H)\n         ─────────────\n             P(E)\n\nP(E) = P(E|H)×P(H) + P(E|¬H)×P(¬H)`,
    variables: [
      { symbol: "P(H|E)", meaning: "Probabilidade posterior — a crença atualizada sobre a hipótese H dado que observamos a evidência E" },
      { symbol: "P(H)", meaning: "Probabilidade prior — crença anterior sobre H antes de ver a evidência" },
      { symbol: "P(E|H)", meaning: "Verossimilhança (likelihood) — probabilidade de observar E se H for verdadeira" },
      { symbol: "P(E)", meaning: "Evidência marginal — probabilidade total de observar E sob todas as hipóteses" },
    ],
    explanation: "O Teorema de Bayes é o fundamento matemático de todo o motor cognitivo. Ele formaliza como atualizar crenças racionalmente à luz de novas evidências. No NEURIX, H = 'o aluno domina o conceito' e E = 'o aluno acertou/errou a questão'. A cada interação, o prior P(H) é atualizado para o posterior P(H|E), que se torna o novo prior para a próxima interação. Isso cria um ciclo de aprendizado contínuo e cada vez mais preciso.",
    example: "Se acreditamos com 60% que o aluno sabe (prior), e ele erra uma questão difícil onde P(erro|sabe)=0.10 e P(erro|não sabe)=0.80: P(H|erro) = 0.10×0.60 / (0.10×0.60 + 0.80×0.40) = 0.06/0.38 = 0.158. O domínio cai de 60% para 15.8%.",
  },
  {
    icon: GitBranch,
    title: "Prioridade de Estudo (Score Composto)",
    formula: `Score(c) = w₁×(1 - P(Lₙ)) \n         + w₂×(1 - R(t))\n         + w₃×Importância(c)\n         + w₄×Incerteza(c)`,
    variables: [
      { symbol: "Score(c)", meaning: "Pontuação de prioridade do conceito c — quanto maior, mais urgente o estudo" },
      { symbol: "P(Lₙ)", meaning: "Domínio atual do conceito (do BKT)" },
      { symbol: "R(t)", meaning: "Retenção atual (da curva de Ebbinghaus)" },
      { symbol: "Importância(c)", meaning: "Peso do conceito no edital/prova alvo (0-1)" },
      { symbol: "Incerteza(c)", meaning: "Entropia da estimativa — alta quando o sistema tem pouca evidência sobre o conceito" },
      { symbol: "w₁...w₄", meaning: "Pesos adaptativos calibrados por tipo de prova e perfil do aluno. Padrão: w₁=0.35, w₂=0.30, w₃=0.20, w₄=0.15" },
    ],
    explanation: "O Planner Adaptativo combina todas as métricas em um score composto para decidir o que o aluno deve estudar a seguir. Conceitos com baixo domínio, retenção decaindo, alta importância no edital e alta incerteza recebem prioridade máxima. Os pesos são calibrados dinamicamente: próximo da prova, w₃ (importância) aumenta; quando há muitos conceitos novos, w₄ (incerteza) aumenta para maximizar a coleta de evidências.",
    example: "Conceito 'ADI/ADC': P(Lₙ)=0.28, R(t)=0.45, Importância=0.9, Incerteza=0.7. Score = 0.35×0.72 + 0.30×0.55 + 0.20×0.9 + 0.15×0.7 = 0.252 + 0.165 + 0.18 + 0.105 = 0.702. Este conceito terá alta prioridade no plano de estudos.",
  },
];

const bktParams = [
  { param: "P(L₀)", meaning: "Conhecimento inicial", value: "0.25" },
  { param: "P(T)", meaning: "Probabilidade de aprender", value: "0.12" },
  { param: "P(S)", meaning: "Probabilidade de errar mesmo sabendo", value: "0.10" },
  { param: "P(G)", meaning: "Probabilidade de acertar chutando", value: "0.20" },
];

export function ScienceSection() {
  return (
    <section id="ciencia" className="section-glow py-20 md:py-32 relative overflow-hidden">
      {/* Multi-layer background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[350px] h-[350px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-4"
        >
          <motion.div
            className="neuro-badge"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Cpu className="h-4 w-4 text-primary" />
            </motion.div>
            <span className="text-sm text-primary font-medium">Arquitetura Científica</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground leading-tight">
            A Ciência por Trás do <span className="gradient-text">Motor Cognitivo</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            O NEURIX combina modelos matemáticos de ponta com IA para criar um{" "}
            <Pill>gêmeo cognitivo</Pill> de cada aluno.
          </p>
        </motion.div>

        {/* Interactive Cognitive Graph */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="neuro-card mb-16 p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
              <Network className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Grafo Cognitivo Interativo</h3>
              <p className="text-muted-foreground text-xs">
                Passe o mouse sobre os nós para explorar as conexões — clique para ver detalhes
              </p>
            </div>
          </div>
          <AnimatedCognitiveGraph />
        </motion.div>

        {/* Forgetting Curve Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="neuro-card mb-16 p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Curva de Esquecimento de Ebbinghaus</h3>
              <p className="text-muted-foreground text-xs">
                Visualize como a retenção decai e como revisões espaçadas combatem o esquecimento
              </p>
            </div>
          </div>
          <ForgettingCurveChart />
        </motion.div>

        {/* Science concept cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-16">
          {scienceCards.map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
              whileHover="hover"
              animate="rest"
            >
              <motion.div
                variants={cardHover}
                className="neuro-card p-6 space-y-3 h-full"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center shrink-0"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <card.icon className="h-5 w-5 text-primary" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-foreground">{card.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm">{card.desc}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Mathematical Formulas Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-10 space-y-3 relative"
        >
          {/* Aurora glow behind formula section */}
          <div className="absolute -inset-20 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 rounded-full blur-[80px] pointer-events-none" />

          <motion.div
            className="neuro-badge relative"
            whileHover={{ scale: 1.05 }}
          >
            <Calculator className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Fundamentação Matemática</span>
          </motion.div>
          <h3 className="text-2xl md:text-3xl font-display font-extrabold text-foreground leading-tight relative">
            As Fórmulas que <span className="gradient-aurora-text">Governam o Motor</span>
          </h3>
          <p className="text-muted-foreground relative">
            Cada decisão do NEURIX é fundamentada em modelos matemáticos rigorosos e validados cientificamente.
          </p>
        </motion.div>

        {/* Formula cards grid */}
        <div className="grid md:grid-cols-2 gap-5 mb-16">
          {formulas.map((formula, i) => (
            <FormulaCard key={formula.title} {...formula} index={i} />
          ))}
        </div>

        {/* BKT Parameters Table + Architecture Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-5"
        >
          {/* BKT Parameters Table */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="neuro-card p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Parâmetros BKT Padrão</h3>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary/10">
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">Parâmetro</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-foreground">Significado</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-foreground">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {bktParams.map((row, i) => (
                    <motion.tr
                      key={row.param}
                      className="border-t border-border/30 hover:bg-primary/5 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                    >
                      <td className="px-4 py-2.5 font-mono text-primary font-medium">{row.param}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.meaning}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-foreground">{row.value}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Architecture Stack */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="neuro-card p-6 space-y-4 border-primary/20 bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0"
                animate={{
                  boxShadow: [
                    "0 0 0px hsl(168 64% 40% / 0)",
                    "0 0 20px hsl(168 64% 40% / 0.35)",
                    "0 0 0px hsl(168 64% 40% / 0)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap className="h-5 w-5 text-primary" />
              </motion.div>
              <h3 className="text-lg font-bold text-foreground">Arquitetura Completa</h3>
            </div>
            <pre className="rounded-lg bg-muted/60 border border-border/40 p-4 text-sm font-mono overflow-x-auto whitespace-pre leading-relaxed">
              <span className="text-primary font-semibold">Graph</span>{" "}
              <span className="text-foreground">Knowledge Model</span>
              {"\n  + "}
              <span className="text-primary font-semibold">Bayesian</span>{" "}
              <span className="text-foreground">Knowledge Tracing</span>
              {"\n  + "}
              <span className="text-primary font-semibold">Ebbinghaus</span>{" "}
              <span className="text-foreground">Forgetting Curve</span>
              {"\n  + "}
              <span className="text-primary font-semibold">Adaptive</span>{" "}
              <span className="text-foreground">Study Planner</span>
              {"\n  + "}
              <span className="text-primary font-semibold">Priority</span>{" "}
              <span className="text-foreground">Score Engine</span>
              {"\n  + "}
              <span className="text-primary font-semibold">LLM</span>{" "}
              <span className="text-foreground">Cognitive Tutor</span>
              {"\n  ─────────────────────────"}
              {"\n  = "}
              <span className="gradient-text font-bold">Copiloto Cognitivo NEURIX</span>
            </pre>
            <p className="text-muted-foreground text-sm">
              Essa é exatamente a arquitetura que universidades e big techs pesquisam para{" "}
              <strong className="text-foreground">educação adaptativa</strong>. Cada camada alimenta a seguinte com dados probabilísticos em tempo real.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
