import { Trophy, Flame, Star, Zap, Award, Sparkles, TrendingUp, Crown, Rocket, HelpCircle, Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useGamificationProfile, useBadges, BADGE_DEFINITIONS } from "@/hooks/use-gamification";
import { cn } from "@/lib/utils";

const XP_PER_LEVEL = 500;

const ICON_MAP: Record<string, React.ElementType> = {
  trophy: Trophy,
  flame: Flame,
  fire: Flame,
  star: Star,
  zap: Zap,
  award: Award,
  sparkles: Sparkles,
  "trending-up": TrendingUp,
  crown: Crown,
  rocket: Rocket,
  "help-circle": HelpCircle,
  layers: Layers,
};

export function GamificationWidget() {
  const { data: profile } = useGamificationProfile();
  const { data: badges } = useBadges();

  if (!profile) return null;

  const xpInLevel = profile.xp % XP_PER_LEVEL;
  const progressPercent = (xpInLevel / XP_PER_LEVEL) * 100;
  const earnedKeys = new Set(badges?.map(b => b.badge_key) ?? []);

  return (
    <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Gamificação
        </h3>
        <div className="flex items-center gap-1 text-xs">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span className="font-medium">{profile.streak_days} dias</span>
        </div>
      </div>

      {/* Level & XP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-primary">Nível {profile.level}</span>
          <span className="text-xs text-muted-foreground">{xpInLevel}/{XP_PER_LEVEL} XP</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="text-xs text-muted-foreground">{profile.xp} XP total</div>
      </div>

      {/* Badges */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Badges ({badges?.length ?? 0}/{BADGE_DEFINITIONS.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {BADGE_DEFINITIONS.map(bd => {
            const earned = earnedKeys.has(bd.key);
            const Icon = ICON_MAP[bd.icon] ?? Star;
            return (
              <div
                key={bd.key}
                title={earned ? `${bd.name}: ${bd.description}` : `${bd.name} (bloqueado)`}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center border transition-all",
                  earned
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/30 bg-muted/20 text-muted-foreground/30"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
