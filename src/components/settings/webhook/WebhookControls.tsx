
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, PlayIcon, PauseIcon } from "lucide-react";
import { isPollingActive, startPolling, stopPolling, resetPolling } from "@/services/telegramPollingService";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface WebhookControlsProps {
  onSave: () => void;
  isLoading: boolean;
  isSaving: boolean;
}

const WebhookControls = ({ 
  onSave, 
  isLoading, 
  isSaving 
}: WebhookControlsProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkStatus = () => {
      setIsActive(isPollingActive());
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStartPolling = async () => {
    setIsStarting(true);
    try {
      const result = await startPolling();
      setIsActive(isPollingActive());
      
      if (result) {
        toast({
          title: "Опрос запущен",
          description: "Бот успешно подключен к Telegram API",
        });
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось запустить опрос. Проверьте токен и логи",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting polling:", error);
      toast({
        title: "Ошибка",
        description: `Не удалось запустить опрос: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopPolling = () => {
    setIsStopping(true);
    try {
      stopPolling();
      setIsActive(false);
      toast({
        title: "Опрос остановлен",
        description: "Бот отключен от Telegram API"
      });
    } catch (error) {
      console.error("Error stopping polling:", error);
      toast({
        title: "Ошибка",
        description: `Не удалось остановить опрос: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
        variant: "destructive",
      });
    } finally {
      setIsStopping(false);
    }
  };

  const handleResetPolling = async () => {
    setIsResetting(true);
    try {
      const success = await resetPolling();
      if (success) {
        if (isActive) {
          stopPolling();
          setTimeout(async () => {
            const restartSuccess = await startPolling();
            if (!restartSuccess) {
              toast({
                title: "Ошибка",
                description: "Не удалось перезапустить опрос после сброса счетчика",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Счетчик сброшен",
                description: "Опрос успешно перезапущен"
              });
            }
          }, 1000);
        } else {
          toast({
            title: "Счетчик сброшен",
            description: "Счетчик обновлений успешно сброшен"
          });
        }
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось сбросить счетчик обновлений",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting polling:", error);
      toast({
        title: "Ошибка",
        description: `Не удалось сбросить счетчик: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div className="flex justify-between space-x-2">
        <Button
          variant={isActive ? "destructive" : "default"}
          onClick={isActive ? handleStopPolling : handleStartPolling}
          disabled={isLoading || isStarting || isStopping}
        >
          {isActive ? (
            <>
              {isStopping ? (
                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PauseIcon className="mr-2 h-4 w-4" />
              )}
              {isStopping ? "Остановка..." : "Остановить опрос"}
            </>
          ) : (
            <>
              {isStarting ? (
                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayIcon className="mr-2 h-4 w-4" />
              )}
              {isStarting ? "Запуск..." : "Запустить опрос"}
            </>
          )}
        </Button>
        
        <Button
          variant="secondary"
          onClick={handleResetPolling}
          disabled={isLoading || isResetting}
        >
          {isResetting ? (
            <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCwIcon className="mr-2 h-4 w-4" />
          )}
          {isResetting ? "Сброс..." : "Сбросить счетчик"}
        </Button>
      </div>
      <div className="flex justify-between mt-4">
        <Button onClick={onSave} disabled={isLoading || isSaving}>
          {isSaving ? "Сохранение..." : "Сохранить настройки"}
        </Button>
      </div>
    </>
  );
};

export default WebhookControls;
