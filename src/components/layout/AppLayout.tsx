import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Brain, LayoutDashboard, BookOpen, Calendar, FileText, BarChart3, MessageSquare, Target, Settings, LogOut, Menu, X, Zap, Network, Timer, Cpu, HelpCircle, Layers, Trophy, Workflow, ListTodo, Globe, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useGamificationProfile } from "@/hooks/use-gamification";

const sidebarGroups = [
  {
    label: "Principal",
    links: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
      { icon: Calendar, label: "Plano de Estudos", path: "/app/plano" },
      { icon: Timer, label: "Pomodoro", path: "/app/pomodoro" },
    ],
  },
  {
    label: "Aprendizagem",
    links: [
      { icon: BookOpen, label: "Disciplinas", path: "/app/disciplinas" },
      { icon: FileText, label: "Biblioteca", path: "/app/biblioteca" },
      { icon: Zap, label: "Revisões", path: "/app/revisoes" },
      { icon: Layers, label: "Flashcards", path: "/app/flashcards" },
      { icon: HelpCircle, label: "Questões", path: "/app/questoes" },
    ],
  },
  {
    label: "Orquestração IA",
    links: [
      { icon: Workflow, label: "Orquestrador", path: "/app/orquestrador" },
      { icon: ListTodo, label: "Centro de Tarefas", path: "/app/tarefas" },
      { icon: Globe, label: "Wiki Viva", path: "/app/wiki" },
      { icon: Bot, label: "Agentes IA", path: "/app/agentes" },
    ],
  },
  {
    label: "Inteligência",
    links: [
      { icon: Network, label: "Grafo Cognitivo", path: "/app/grafo" },
      { icon: Cpu, label: "Motor Cognitivo", path: "/app/motor-cognitivo" },
      { icon: MessageSquare, label: "Coach IA", path: "/app/coach" },
    ],
  },
  {
    label: "Progresso",
    links: [
      { icon: BarChart3, label: "Desempenho", path: "/app/desempenho" },
      { icon: Target, label: "Metas", path: "/app/metas" },
      { icon: Settings, label: "Configurações", path: "/app/configuracoes" },
    ],
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: gamification } = useGamificationProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = (user?.user_metadata?.display_name ?? user?.email ?? "U")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background flex">
      {mobileOpen && (
        <div className="fixed inset-0 bg-background/80 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen z-50 flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center gap-2 px-4 border-b border-border/50">
          <div className="h-8 w-8 rounded-lg gradient-primary-bg flex items-center justify-center flex-shrink-0">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-lg tracking-tight">NEURIX</span>}
        </div>

        <nav className="flex-1 py-2 px-2 overflow-y-auto space-y-1">
          {sidebarGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </div>
              )}
              {group.links.map((link) => {
                const active = location.pathname === link.path || (link.path !== "/app" && location.pathname.startsWith(link.path + "/"));
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                      active
                        ? "bg-sidebar-accent text-primary font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <link.icon className={cn("h-4 w-4 flex-shrink-0", active && "text-primary")} />
                    {!collapsed && link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* XP bar in sidebar */}
        {!collapsed && gamification && (
          <div className="px-3 py-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              <span>Nv. {gamification.level}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full gradient-primary-bg transition-all"
                  style={{ width: `${((gamification.xp % 500) / 500) * 100}%` }}
                />
              </div>
              <span>{gamification.xp} XP</span>
            </div>
          </div>
        )}

        <div className="p-2 border-t border-border/50">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all w-full"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && "Sair"}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border/50 flex items-center px-4 gap-4 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <button
            className="hidden md:block text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full gradient-primary-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
