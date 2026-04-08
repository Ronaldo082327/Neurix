import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface FormulaCardProps {
  icon: LucideIcon;
  title: string;
  formula: string;
  variables: { symbol: string; meaning: string }[];
  explanation: string;
  example?: string;
  index: number;
}

export function FormulaCard({ icon: Icon, title, formula, variables, explanation, example, index }: FormulaCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="neuro-card p-6 space-y-4 hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
          whileHover={{ rotate: 12, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="h-5 w-5 text-primary" />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      </div>

      {/* Formula display */}
      <motion.div
        className="rounded-xl bg-muted/80 border border-border/40 p-4 text-center shadow-inner shadow-primary/5"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
      >
        <pre className="text-sm md:text-base font-mono text-primary font-bold whitespace-pre-wrap leading-relaxed drop-shadow-[0_0_8px_hsl(262_83%_58%/0.3)]">
          {formula}
        </pre>
      </motion.div>

      {/* Variables */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variáveis</span>
        <div className="grid gap-1.5">
          {variables.map((v, i) => (
            <motion.div
              key={v.symbol}
              className="flex items-start gap-2 text-sm"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <code className="font-mono text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded text-xs shrink-0">
                {v.symbol}
              </code>
              <span className="text-muted-foreground text-xs leading-relaxed">{v.meaning}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <p className="text-muted-foreground text-sm leading-relaxed border-t border-border/30 pt-3">
        {explanation}
      </p>

      {/* Example */}
      {example && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <span className="text-xs font-semibold text-primary block mb-1">Exemplo prático</span>
          <p className="text-xs text-muted-foreground leading-relaxed">{example}</p>
        </div>
      )}
    </motion.div>
  );
}
