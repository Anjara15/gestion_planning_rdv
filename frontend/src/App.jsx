import { Toaster, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PatientDashboard from "./pages/PatientDashboard";
import MedecinDashboard from "./pages/MedecinDashboard";


const queryClient = new QueryClient();

// Expose toast globally for console testing
if (typeof window !== "undefined") {
  // Avoid overwriting if already set during HMR
  window.toast = window.toast || toast;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster
        position="top-center"
        richColors
        closeButton
        expand
        className="!z-[99999]"
        toastOptions={{
          duration: 4500,
          classNames: {
            toast: "px-5 py-4 rounded-xl shadow-xl border border-border text-base leading-relaxed",
            title: "font-semibold",
            description: "text-muted-foreground mt-1",
            actionButton: "bg-primary text-primary-foreground",
            cancelButton: "bg-muted text-muted-foreground",
          },
        }}
      />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Auth />} />
         <Route path="/dashboard" element={<Dashboard />} /> 
          <Route path="/patientdashboard" element={<PatientDashboard />} /> 
          <Route path="/medecindashboard" element={<MedecinDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
