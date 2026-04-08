import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import RegistroPage from "./pages/Registro";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import OnboardingPage from "./pages/Onboarding";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/app/Dashboard";
import DisciplinasPage from "./pages/app/Disciplinas";
import PlanoPage from "./pages/app/Plano";
import BibliotecaPage from "./pages/app/Biblioteca";
import DocumentViewerPage from "./pages/app/DocumentViewer";
import DesempenhoPage from "./pages/app/Desempenho";
import RevisoesPage from "./pages/app/Revisoes";
import CoachPage from "./pages/app/Coach";
import MetasPage from "./pages/app/Metas";
import ConfiguracoesPage from "./pages/app/Configuracoes";
import GrafoCognitivoPage from "./pages/app/GrafoCognitivo";
import PomodoroPage from "./pages/app/Pomodoro";
import MotorCognitivoPage from "./pages/app/MotorCognitivo";
import QuestoesPage from "./pages/app/Questoes";
import FlashcardsPage from "./pages/app/Flashcards";
import SessaoRevisaoPage from "./pages/app/SessaoRevisao";
import OrquestradorPage from "./pages/app/Orquestrador";
import CentroTarefasPage from "./pages/app/CentroTarefas";
import WikiVivaPage from "./pages/app/WikiViva";
import AgentesPage from "./pages/app/Agentes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="disciplinas" element={<DisciplinasPage />} />
            <Route path="plano" element={<PlanoPage />} />
            <Route path="biblioteca" element={<BibliotecaPage />} />
            <Route path="biblioteca/:documentId" element={<DocumentViewerPage />} />
            <Route path="desempenho" element={<DesempenhoPage />} />
            <Route path="revisoes" element={<RevisoesPage />} />
            <Route path="revisoes/sessao" element={<SessaoRevisaoPage />} />
            <Route path="coach" element={<CoachPage />} />
            <Route path="metas" element={<MetasPage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
            <Route path="grafo" element={<GrafoCognitivoPage />} />
            <Route path="pomodoro" element={<PomodoroPage />} />
            <Route path="motor-cognitivo" element={<MotorCognitivoPage />} />
            <Route path="questoes" element={<QuestoesPage />} />
            <Route path="flashcards" element={<FlashcardsPage />} />
            <Route path="orquestrador" element={<OrquestradorPage />} />
            <Route path="tarefas" element={<CentroTarefasPage />} />
            <Route path="wiki" element={<WikiVivaPage />} />
            <Route path="agentes" element={<AgentesPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
