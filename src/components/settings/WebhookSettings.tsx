
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDefaultWebhookUrl, getWebhookUrl, setWebhookUrl } from "@/services/webhookService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import WebhookUrlInput from "./webhook/WebhookUrlInput";
import WebhookStatus from "./webhook/WebhookStatus";
import WebhookControls from "./webhook/WebhookControls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const WebhookSettings = () => {
  const [webhookUrl, setWebhookUrlState] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWebhookUrl();
  }, []);

  const loadWebhookUrl = async () => {
    setIsLoading(true);
    setError(null);
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
    setError(null);
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
    setError(null);
    try {
      console.log("Setting up webhook...");
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook', {
        method: 'POST',
        body: { action: 'set' }
      });
      
      console.log("Webhook setup response:", data);
      
      if (error) {
        console.error("Webhook setup error:", error);
        throw error;
      }

      if (data.success) {
        setWebhookStatus(data.webhookInfo);
        toast({
          title: "Webhook Setup Success",
          description: "Telegram bot webhook has been configured successfully",
        });
      } else {
        throw new Error(data.error || 'Failed to setup webhook');
      }
    } catch (error: any) {
      console.error("Error setting up webhook:", error);
      setError(error?.message || "Failed to setup the webhook. Please check your bot token and try again.");
      toast({
        title: "Webhook Setup Failed",
        description: error?.message || "Failed to setup the webhook. Please check your bot token and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSettingUp(false);
    }
  };
  
  const checkWebhookStatus = async () => {
    setIsSettingUp(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook', {
        method: 'POST',
        body: { action: 'check' }
      });
      
      if (error) throw error;

      if (data.success) {
        setWebhookStatus(data.webhookInfo);
        toast({
          title: "Webhook Status",
          description: data.webhookInfo?.url ? "Webhook is active" : "No webhook is currently set",
        });
      } else {
        throw new Error(data.error || 'Failed to check webhook status');
      }
    } catch (error: any) {
      console.error("Error checking webhook status:", error);
      setError(error?.message || "Failed to check webhook status. Please try again.");
      toast({
        title: "Webhook Check Failed",
        description: error?.message || "Failed to check webhook status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  const deleteWebhook = async () => {
    setIsSettingUp(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook', {
        method: 'POST',
        body: { action: 'delete' }
      });
      
      if (error) throw error;

      if (data.success) {
        setWebhookStatus(null);
        toast({
          title: "Webhook Deleted",
          description: "Telegram bot webhook has been removed successfully",
        });
      } else {
        throw new Error(data.error || 'Failed to delete webhook');
      }
    } catch (error: any) {
      console.error("Error deleting webhook:", error);
      setError(error?.message || "Failed to delete webhook. Please try again.");
      toast({
        title: "Webhook Deletion Failed",
        description: error?.message || "Failed to delete webhook. Please try again.",
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
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Make sure you have set your Telegram bot token in the API Settings tab before setting up the webhook.
          </AlertDescription>
        </Alert>
        
        <WebhookUrlInput
          webhookUrl={webhookUrl}
          isLoading={isLoading}
          onWebhookUrlChange={setWebhookUrlState}
        />
        
        <WebhookControls
          onSetup={setupWebhook}
          onCheck={checkWebhookStatus}
          onDelete={deleteWebhook}
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
