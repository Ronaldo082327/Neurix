import { Brain, GitBranch, BarChart3, Zap, Target, Cpu, Sparkles, TrendingDown, RefreshCw, Network } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

function SectionCard({
  icon: Icon,
  emoji,
  number,
  title,
  children,
  index,
}: {
  icon: React.ElementType;
  emoji: string;
  number: number;
  title: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.section
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={fadeUp}
      className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 md:p-8 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          <span className="text-primary">{emoji} {number}.</span> {title}
        </h2>
      </div>
      <div className="text-muted-foreground leading-relaxed space-y-3 pl-0 md:pl-[52px]">
        {children}
      </div>
    </motion.section>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-semibold text-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border/30">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-lg bg-muted/60 border border-border/40 p-4 text-sm font-mono text-foreground overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary font-medium text-sm">
      {children}
    </span>
  );
}

export default function MotorCognitivoPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4 py-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Cpu className="h-4 w-4" />
          Arquitetura Científica
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
          O Motor Cognitivo do <span className="text-primary">NEURIX</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Uma das ideias mais poderosas da IA moderna de aprendizagem adaptativa — e o cérebro humano funciona exatamente assim.
        </p>
      </motion.div>

      {/* Section 1 */}
      <SectionCard icon={Brain} emoji="🧠" number={1} title="Aprendizagem humana é bayesiana" index={1}>
        <p>O cérebro funciona mais ou menos assim:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Você tem uma <strong className="text-foreground">crença inicial</strong> sobre algo</li>
          <li>Recebe <strong className="text-foreground">nova informação</strong></li>
          <li>Atualiza sua <strong className="text-foreground">crença</strong></li>
        </ul>
        <p><strong className="text-foreground">Exemplo no estudo:</strong></p>
        <p>
          Antes de estudar Direito Constitucional você pode acreditar que sabe 40% do conteúdo.
          Depois de ler teoria, fazer questões, errar algumas e acertar outras — seu cérebro atualiza a crença sobre o seu conhecimento.
        </p>
        <p>Isso é exatamente: <Highlight>Inferência Bayesiana</Highlight>.</p>
      </SectionCard>

      {/* Section 2 */}
      <SectionCard icon={Target} emoji="🧩" number={2} title="O que o NEURIX faz" index={2}>
        <p>O NEURIX trata cada conceito como uma <strong className="text-foreground">probabilidade de domínio</strong>.</p>
        <DataTable
          headers={["Conceito", "Probabilidade de domínio"]}
          rows={[
            ["Controle de constitucionalidade", "0.35"],
            ["Poder constituinte", "0.62"],
            ["Direitos fundamentais", "0.81"],
          ]}
        />
        <p>O sistema calcula o quanto você provavelmente domina cada conceito, criando um <Highlight>mapa cognitivo probabilístico</Highlight>.</p>
      </SectionCard>

      {/* Section 3 */}
      <SectionCard icon={Network} emoji="🕸️" number={3} title="O grafo cognitivo do NEURIX" index={3}>
        <p>Os conteúdos viram um <strong className="text-foreground">grafo de conhecimento</strong>:</p>
        <CodeBlock>{`Direito Constitucional
       |
       |--- Poder Constituinte
       |
       |--- Controle de Constitucionalidade
       |
       |--- Direitos Fundamentais`}</CodeBlock>
        <p>Cada nó do grafo tem:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Probabilidade de domínio</li>
          <li>Histórico de erros</li>
          <li>Tempo de revisão</li>
          <li>Dificuldade percebida</li>
        </ul>
      </SectionCard>

      {/* Section 4 */}
      <SectionCard icon={RefreshCw} emoji="🔄" number={4} title="Atualização bayesiana após cada questão" index={4}>
        <p>Quando o aluno responde uma questão, o sistema <strong className="text-foreground">atualiza o domínio em tempo real</strong>:</p>
        <div className="space-y-2 bg-muted/40 rounded-lg p-4 border border-border/30">
          <p className="text-foreground font-medium">Antes da questão:</p>
          <p>P(domínio de Controle de Constitucionalidade) = <Highlight>0.40</Highlight></p>
          <p className="text-foreground font-medium mt-3">Aluno acerta uma questão difícil → Depois:</p>
          <p>P(domínio) = <Highlight>0.57</Highlight></p>
          <p className="text-foreground font-medium mt-3">Aluno erra outra → Depois:</p>
          <p>P(domínio) = <Highlight>0.46</Highlight></p>
        </div>
        <p>O sistema <strong className="text-foreground">aprende sobre o aluno</strong> a cada interação.</p>
      </SectionCard>

      {/* Section 5 */}
      <SectionCard icon={TrendingDown} emoji="📉" number={5} title="Curva de esquecimento" index={5}>
        <p>A <strong className="text-foreground">curva de esquecimento de Ebbinghaus</strong> modela a queda de retenção:</p>
        <DataTable
          headers={["Dia", "Domínio"]}
          rows={[
            ["Dia 1", "0.80"],
            ["Dia 3", "0.65"],
            ["Dia 7", "0.52"],
          ]}
        />
        <p>O NEURIX <Highlight>agenda revisões automaticamente</Highlight> para combater o esquecimento.</p>
      </SectionCard>

      {/* Section 6 */}
      <SectionCard icon={BarChart3} emoji="🤖" number={6} title="BKT — Bayesian Knowledge Tracing" index={6}>
        <p>O modelo BKT calcula quatro parâmetros fundamentais:</p>
        <DataTable
          headers={["Parâmetro", "Significado"]}
          rows={[
            ["P(L₀)", "Conhecimento inicial"],
            ["P(T)", "Probabilidade de aprender"],
            ["P(S)", "Probabilidade de errar mesmo sabendo"],
            ["P(G)", "Probabilidade de acertar chutando"],
          ]}
        />
        <p>
          Com isso o sistema estima: <em className="text-foreground">"Qual a probabilidade do aluno já dominar esse conceito?"</em>
        </p>
      </SectionCard>

      {/* Section 7 */}
      <SectionCard icon={Cpu} emoji="📊" number={7} title="Como isso vira o motor do NEURIX" index={7}>
        <p>Cada interação no app gera dados:</p>
        <div className="flex flex-wrap gap-2">
          {["Abrir material", "Fazer highlight", "Resolver questão", "Revisar flashcard", "Tempo de leitura", "Taxa de erro"].map((item) => (
            <span key={item} className="px-3 py-1 rounded-full bg-muted text-foreground text-xs font-medium border border-border/40">
              {item}
            </span>
          ))}
        </div>
        <p>Tudo alimenta o modelo para calcular:</p>
        <CodeBlock>{`Mapa cognitivo do aluno
  + Probabilidade de domínio
  + Velocidade de aprendizagem
  + Taxa de esquecimento
  = Um gêmeo cognitivo matemático`}</CodeBlock>
      </SectionCard>

      {/* Section 8 */}
      <SectionCard icon={Sparkles} emoji="🚀" number={8} title="O diferencial revolucionário" index={8}>
        <p>Plataformas tradicionais oferecem banco de questões, flashcards e trilhas fixas.</p>
        <p>O NEURIX faz algo muito mais avançado: <Highlight>engenharia cognitiva adaptativa</Highlight>.</p>
        <p className="text-foreground font-semibold">
          Cada aluno tem um modelo matemático da própria mente.
        </p>
      </SectionCard>

      {/* Section 9 */}
      <SectionCard icon={GitBranch} emoji="🧬" number={9} title="Isso é exatamente como funciona IA moderna" index={9}>
        <p>Sistemas de recomendação, IA de aprendizagem e robôs autônomos — todos funcionam assim:</p>
        <CodeBlock>{`hipótese
  + evidência
  + atualização bayesiana`}</CodeBlock>
      </SectionCard>

      {/* Section 10 */}
      <SectionCard icon={Zap} emoji="🔥" number={10} title="O que torna o NEURIX único no mundo" index={10}>
        <p>A arquitetura completa:</p>
        <CodeBlock>{`Graph Knowledge Model
  + Bayesian Learning Engine
  + Forgetting Curve Model
  + Adaptive Study Planner
  + LLM Tutor`}</CodeBlock>
        <p>Resultado: um <Highlight>copiloto cognitivo de estudo</Highlight>.</p>
      </SectionCard>

      {/* Closing */}
      <motion.div
        custom={11}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8 space-y-3 text-center"
      >
        <p className="text-foreground font-semibold text-lg">
          💡 Essa arquitetura é exatamente o que universidades e big techs estão pesquisando para educação adaptativa.
        </p>
        <p className="text-muted-foreground">
          E existe algo ainda mais avançado: <strong className="text-foreground">Redes Bayesianas Cognitivas Dinâmicas</strong> (Dynamic Bayesian Networks) — que permitem modelar como o conhecimento evolui no tempo.
        </p>
        <p className="text-sm text-muted-foreground italic">
          Isso parece coisa de laboratório de pesquisa. Mas é o que o NEURIX faz.
        </p>
      </motion.div>
    </div>
  );
}
