import { Timer, Play, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PomodoroWidgetProps {
  className?: string;
}

export function PomodoroWidget({ className }: PomodoroWidgetProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("p-5 rounded-xl border border-border/50 bg-card/50 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          Pomodoro
        </h3>
        <span className="text-xs text-muted-foreground">25 min</span>
      </div>

      {/* Mini timer visual */}
      <div className="flex items-center justify-center">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
            <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            <circle
              cx="48" cy="48" r="40" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={0}
              opacity={0.3}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-mono font-bold text-primary">25:00</span>
            <span className="text-[10px] text-muted-foreground">Foco</span>
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">Inicie uma sessão de estudo focada com o método Pomodoro.</p>
        <Button
          variant="hero"
          size="sm"
          className="w-full"
          onClick={() => navigate("/app/pomodoro")}
        >
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Iniciar Pomodoro
        </Button>
      </div>
    </div>
  );
}
