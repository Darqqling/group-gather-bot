
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDefaultWebhookUrl, getWebhookUrl, setWebhookUrl } from "@/services/webhookService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import WebhookUrlInput from "./webhook/WebhookUrlInput";
import WebhookStatus from "./webhook/WebhookStatus";
import WebhookControls from "./webhook/WebhookControls";

const WebhookSettings = () => {
  const [webhookUrl, setWebhookUrlState] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWebhookUrl();
  }, []);

  const loadWebhookUrl = async () => {
    setIsLoading(true);
    try {
      const url = await getWebhookUrl();
      setWebhookUrlState(url || getDefaultWebhookUrl());
    } catch (error) {
      console.error("Error loading webhook URL:", error);
      toast({
        title: "Error Loading Webhook URL",
        description: "Failed to load the webhook URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveWebhookUrl = async () => {
    setIsSaving(true);
    try {
      const success = await setWebhookUrl(webhookUrl);
      if (success) {
        toast({
          title: "Webhook URL Saved",
          description: "The webhook URL has been updated successfully.",
        });
      } else {
        throw new Error("Failed to save webhook URL");
      }
    } catch (error) {
      console.error("Error saving webhook URL:", error);
      toast({
        title: "Error Saving Webhook URL",
        description: "Failed to save the webhook URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const setupWebhook = async () => {
    setIsSettingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook')
      
      if (error) throw error;

      if (data.success) {
        setWebhookStatus(data.webhookInfo);
        toast({
          title: "Webhook Setup Success",
          description: "Telegram bot webhook has been configured successfully",
        });
      } else {
        throw new Error(data.error || 'Failed to setup webhook');
      }
    } catch (error) {
      console.error("Error setting up webhook:", error);
      toast({
        title: "Webhook Setup Failed",
        description: error.message || "Failed to setup the webhook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  const resetToDefault = () => {
    setWebhookUrlState(getDefaultWebhookUrl());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook URL</CardTitle>
        <CardDescription>
          Configure the URL that will receive updates from Telegram.
          This URL needs to be registered with the Telegram Bot API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <WebhookUrlInput
          webhookUrl={webhookUrl}
          isLoading={isLoading}
          onWebhookUrlChange={setWebhookUrlState}
        />
        
        <WebhookControls
          onSetup={setupWebhook}
          onReset={resetToDefault}
          onSave={saveWebhookUrl}
          isSettingUp={isSettingUp}
          isLoading={isLoading}
          isSaving={isSaving}
        />

        <WebhookStatus webhookStatus={webhookStatus} />
      </CardContent>
    </Card>
  );
};

export default WebhookSettings;
