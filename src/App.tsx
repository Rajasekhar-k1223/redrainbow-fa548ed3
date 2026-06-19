import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import DashboardLayout from "./components/DashboardLayout.tsx";
import Overview from "./pages/dashboard/Overview.tsx";
import Missions from "./pages/dashboard/Missions.tsx";
import Signals from "./pages/dashboard/Signals.tsx";
import Vault from "./pages/dashboard/Vault.tsx";
import Constellation from "./pages/dashboard/Constellation.tsx";
import TerminalPage from "./pages/dashboard/Terminal.tsx";
import Assets from "./pages/dashboard/Assets.tsx";
import Vulnerabilities from "./pages/dashboard/Vulnerabilities.tsx";
import Compliance from "./pages/dashboard/Compliance.tsx";
import Telemetry from "./pages/dashboard/Telemetry.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="assets" element={<Assets />} />
            <Route path="vulnerabilities" element={<Vulnerabilities />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="telemetry" element={<Telemetry />} />
            <Route path="signals" element={<Signals />} />
            <Route path="vault" element={<Vault />} />
            <Route path="missions" element={<Missions />} />
            <Route path="constellation" element={<Constellation />} />
            <Route path="terminal" element={<TerminalPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
