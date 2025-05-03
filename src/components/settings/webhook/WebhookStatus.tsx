
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import PollingStatus from "./PollingStatus";

const WebhookStatus = () => {
  return (
    <Alert>
      <AlertTitle>Статус Long Polling для Telegram</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-1">
          <PollingStatus />
          <p className="text-sm text-gray-500 mt-2">
            Соединение с Telegram API работает по методу Long Polling (getUpdates). 
            Интервал опроса: 5 секунд. Данные обновляются автоматически.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default WebhookStatus;
