
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { isPollingActive, startPolling, stopPolling } from "@/services/telegramPollingService";

const PollingStatus = () => {
  const [active, setActive] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    // Update status initially and every second
    const updateStatus = () => {
      setActive(isPollingActive());
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
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
    <div className="flex items-center space-x-2">
      <span>Статус:</span>
      {active ? (
        <Badge variant="success" className="bg-green-500">
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
  );
};

export default PollingStatus;
