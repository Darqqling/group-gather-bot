
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { isPollingActive, startPolling, stopPolling } from "@/services/telegramPollingService";
import { AlertCircle } from "lucide-react";

const PollingStatus = () => {
  const [active, setActive] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [checkCount, setCheckCount] = useState<number>(0);

  // Use effect to continuously check polling status
  useEffect(() => {
    // Update status initially and every second
    const updateStatus = () => {
      const currentActive = isPollingActive();
      setActive(currentActive);
      
      // Reset error if polling is now active
      if (currentActive && lastError) {
        setLastError(null);
      }
      
      // Track check count for component re-rendering
      setCheckCount(prev => prev + 1);
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, [lastError]);
  
  // Update last check time when polling runs
  useEffect(() => {
    if (active) {
      const updateLastCheck = () => setLastCheck(new Date());
      const interval = setInterval(updateLastCheck, 5000); // Same as polling interval
      updateLastCheck();
      return () => clearInterval(interval);
    }
  }, [active]);

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <span>Статус:</span>
        {active ? (
          <Badge variant="default" className="bg-green-500">
            Активно
          </Badge>
        ) : (
          <Badge variant="destructive" className="bg-red-500">
            Неактивно
          </Badge>
        )}
        {lastCheck && active && (
          <span className="text-xs text-gray-500">
            Последняя проверка: {lastCheck.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {lastError && (
        <div className="flex items-center space-x-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{lastError}</span>
        </div>
      )}
      
      {!active && checkCount > 5 && (
        <p className="text-xs text-amber-600">
          Если опрос не запускается, проверьте, что токен бота правильно настроен в разделе API настроек.
        </p>
      )}
    </div>
  );
};

export default PollingStatus;
