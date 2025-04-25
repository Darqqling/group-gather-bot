
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface WebhookStatusProps {
  webhookStatus: {
    url: string;
    last_error_date?: number;
    last_error_message?: string;
    pending_update_count?: number;
  } | null;
}

const WebhookStatus = ({ webhookStatus }: WebhookStatusProps) => {
  if (!webhookStatus) return null;

  return (
    <Alert>
      <AlertTitle>Webhook Status</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-1">
          <p>URL: {webhookStatus.url}</p>
          {webhookStatus.last_error_date && (
            <p className="text-red-500">
              Last Error: {new Date(webhookStatus.last_error_date * 1000).toLocaleString()}
              {webhookStatus.last_error_message && ` - ${webhookStatus.last_error_message}`}
            </p>
          )}
          {webhookStatus.pending_update_count && webhookStatus.pending_update_count > 0 && (
            <p>Pending Updates: {webhookStatus.pending_update_count}</p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default WebhookStatus;
