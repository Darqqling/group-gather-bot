
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import { initializeMaintenanceSettings } from "./services/maintenanceService";
import { startPolling, resetPolling } from "./services/telegramPollingService";
import { toast } from "@/components/ui/use-toast";

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
    // Initialize settings and start polling when the app starts
    const initApp = async () => {
      try {
        // Initialize settings
        await initializeMaintenanceSettings();
        console.log("Settings initialized successfully");
        
        // Reset polling state and then start polling
        try {
          console.log("Resetting polling state before starting");
          await resetPolling();
          
          const pollingResult = await startPolling();
          if (pollingResult.success) {
            console.log("Telegram polling started successfully");
            toast({
              title: "Telegram-бот активирован",
              description: "Бот успешно запущен и готов к работе",
              variant: "default"
            });
          } else {
            console.warn("Failed to start polling:", pollingResult.error);
            toast({
              title: "Ошибка активации бота",
              description: pollingResult.error || "Не удалось запустить бота. Проверьте логи.",
              variant: "destructive"
            });
          }
        } catch (pollError) {
          console.error("Error starting Telegram polling:", pollError);
          toast({
            title: "Ошибка активации бота",
            description: "Произошла ошибка при запуске бота. Проверьте логи.",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error("Failed to initialize app:", err);
        toast({
          title: "Ошибка инициализации",
          description: "Не удалось инициализировать приложение. Проверьте логи.",
          variant: "destructive"
        });
      }
    };
    
    initApp();
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
