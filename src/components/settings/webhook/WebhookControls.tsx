
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, PlayIcon, PauseIcon } from "lucide-react";
import { isPollingActive, startPolling, stopPolling, resetPolling } from "@/services/telegramPollingService";
import { useState, useEffect } from "react";

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

  useEffect(() => {
    const checkStatus = () => {
      setIsActive(isPollingActive());
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStartPolling = async () => {
    const result = await startPolling();
    setIsActive(true);
  };

  const handleStopPolling = () => {
    stopPolling();
    setIsActive(false);
  };

  const handleResetPolling = async () => {
    const success = await resetPolling();
    if (success) {
      if (isActive) {
        stopPolling();
        setTimeout(() => startPolling(), 1000);
      }
    }
  };

  return (
    <>
      <div className="flex justify-between space-x-2">
        <Button
          variant={isActive ? "destructive" : "default"}
          onClick={isActive ? handleStopPolling : handleStartPolling}
          disabled={isLoading}
        >
          {isActive ? (
            <>
              <PauseIcon className="mr-2 h-4 w-4" />
              Остановить опрос
            </>
          ) : (
            <>
              <PlayIcon className="mr-2 h-4 w-4" />
              Запустить опрос
            </>
          )}
        </Button>
        
        <Button
          variant="secondary"
          onClick={handleResetPolling}
          disabled={isLoading}
        >
          <RefreshCwIcon className="mr-2 h-4 w-4" />
          Сбросить счетчик
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
