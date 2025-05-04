
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import { initializeMaintenanceSettings } from "./services/maintenanceService";
import { startPolling } from "./services/telegramPollingService";

const App = () => {
  // Move QueryClient initialization inside the component
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    // Initialize settings when the app starts
    const initSettings = async () => {
      try {
        await initializeMaintenanceSettings();
        console.log("Settings initialized successfully");
        
        // Auto-start polling when app loads
        try {
          const pollingResult = await startPolling();
          if (pollingResult.success) {
            console.log("Telegram polling started automatically");
          } else {
            console.warn("Failed to auto-start polling:", pollingResult.error);
          }
        } catch (pollError) {
          console.error("Error auto-starting Telegram polling:", pollError);
        }
      } catch (err) {
        console.error("Failed to initialize settings:", err);
      }
    };
    
    initSettings();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
