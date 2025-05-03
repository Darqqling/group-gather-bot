
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWebhookUrl, setWebhookUrl } from "@/services/webhookService";
import { useToast } from "@/hooks/use-toast";
import WebhookStatus from "./webhook/WebhookStatus";
import WebhookControls from "./webhook/WebhookControls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const WebhookSettings = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const saveSettings = async () => {
    setIsSaving(true);
    setError(null);
    try {
      toast({
        title: "Telegram API",
        description: "Настройки обновлены. Используется Long Polling для получения обновлений от Telegram.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки Telegram API</CardTitle>
        <CardDescription>
          Настройка режима опроса Telegram API (Long Polling)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Важно</AlertTitle>
          <AlertDescription>
            Убедитесь, что вы установили токен Telegram бота в настройках API, прежде чем запускать опрос.
          </AlertDescription>
        </Alert>
        
        <WebhookControls
          onSave={saveSettings}
          isLoading={isLoading}
          isSaving={isSaving}
        />

        <WebhookStatus />
      </CardContent>
    </Card>
  );
};

export default WebhookSettings;
