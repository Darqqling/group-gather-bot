
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import WebhookStatus from "./webhook/WebhookStatus";
import WebhookControls from "./webhook/WebhookControls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const TelegramPollingSettings = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>(
    "Сервис временно недоступен. Пожалуйста, попробуйте позже."
  );
  const { toast } = useToast();

  // Load maintenance settings
  useEffect(() => {
    const loadMaintenanceSettings = async () => {
      setIsLoading(true);
      try {
        // Load maintenance mode
        const { data: modeData, error: modeError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle();
        
        if (modeError) throw modeError;
        
        if (modeData) {
          setMaintenanceMode(modeData.value === 'true');
        }
        
        // Load maintenance message
        const { data: messageData, error: messageError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'maintenance_message')
          .maybeSingle();
        
        if (messageError) throw messageError;
        
        if (messageData && messageData.value) {
          setMaintenanceMessage(messageData.value);
        }
      } catch (error) {
        console.error('Error loading maintenance settings:', error);
        setError('Не удалось загрузить настройки технического обслуживания');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMaintenanceSettings();
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Save maintenance mode
      const { error: modeError } = await supabase
        .from('app_settings')
        .upsert({
          key: 'maintenance_mode',
          value: maintenanceMode.toString(),
          description: 'Flag to enable maintenance mode for the Telegram bot'
        }, { onConflict: 'key' });
      
      if (modeError) throw modeError;
      
      // Save maintenance message
      const { error: messageError } = await supabase
        .from('app_settings')
        .upsert({
          key: 'maintenance_message',
          value: maintenanceMessage,
          description: 'Message shown to users when in maintenance mode'
        }, { onConflict: 'key' });
      
      if (messageError) throw messageError;
      
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

  const handleMaintenanceModeChange = (checked: boolean) => {
    setMaintenanceMode(checked);
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
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="maintenance-mode" 
              checked={maintenanceMode}
              onCheckedChange={handleMaintenanceModeChange}
              disabled={isLoading}
            />
            <Label htmlFor="maintenance-mode">Режим обслуживания</Label>
          </div>
          
          {maintenanceMode && (
            <div className="space-y-2">
              <Label htmlFor="maintenance-message">Сообщение в режиме обслуживания</Label>
              <Input
                id="maintenance-message"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Введите сообщение для режима обслуживания"
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Это сообщение будет отправлено пользователям, когда режим обслуживания активен.
              </p>
            </div>
          )}
        </div>
        
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

export default TelegramPollingSettings;
