
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import PollingStatus from "./PollingStatus";

const WebhookStatus = () => {
  return (
    <Alert>
      <AlertTitle>Статус опроса Telegram</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-1">
          <PollingStatus />
          <p className="text-sm text-gray-500 mt-2">
            Интервал опроса: 5 секунд. При опросе бот проверяет новые сообщения через API Telegram.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default WebhookStatus;
