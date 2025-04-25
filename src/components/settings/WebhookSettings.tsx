import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getDefaultWebhookUrl, getWebhookUrl, setWebhookUrl } from "@/services/webhookService";
import { useToast } from "@/hooks/use-toast";
import { CheckIcon, ClipboardCopyIcon, RefreshCwIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WebhookSettings = () => {
  const [webhookUrl, setWebhookUrlState] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setIsCopied(true);
      toast({
        title: "URL Copied",
        description: "Webhook URL copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy the URL to clipboard",
        variant: "destructive",
      });
    }
  };

  const resetToDefault = () => {
    setWebhookUrlState(getDefaultWebhookUrl());
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>
            Configure the URL that will receive updates from Telegram.
            This URL needs to be registered with the Telegram Bot API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex">
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrlState(e.target.value)}
                placeholder="https://your-webhook-url.com/webhook"
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                className="ml-2" 
                variant="outline" 
                onClick={copyToClipboard}
                disabled={isLoading || !webhookUrl}
              >
                {isCopied ? <CheckIcon className="h-4 w-4" /> : <ClipboardCopyIcon className="h-4 w-4" />}
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={setupWebhook}
              disabled={isSettingUp}
            >
              {isSettingUp ? (
                <>
                  <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Setup Webhook"
              )}
            </Button>
          </div>

          {webhookStatus && (
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
                  {webhookStatus.pending_update_count > 0 && (
                    <p>Pending Updates: {webhookStatus.pending_update_count}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={resetToDefault} disabled={isLoading || isSaving}>
            Reset to Default
          </Button>
          <Button onClick={saveWebhookUrl} disabled={isLoading || isSaving}>
            {isSaving ? "Saving..." : "Save URL"}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default WebhookSettings;
