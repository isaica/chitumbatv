import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/components/ui/notification-system";
import { Layout } from "@/components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Filiais from "./pages/Filiais";
import Clientes from "./pages/Clientes";
import Usuarios from "./pages/Usuarios";
import Precos from "./pages/PrecosPorFilial";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/filiais" element={<Filiais />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/precos" element={<Precos />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NotificationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </NotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
