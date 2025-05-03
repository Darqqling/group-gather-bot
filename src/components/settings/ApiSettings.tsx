
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCwIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, InfoIcon } from "lucide-react";

const TELEGRAM_TOKEN_SETTING_KEY = 'telegram_token_display';

const ApiSettings = () => {
  const [telegramToken, setTelegramToken] = useState<string>("");
  const [isShowingToken, setIsShowingToken] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTokenDisplay();
  }, []);

  // This only loads the display version of the token (asterisks or last saved value)
  const loadTokenDisplay = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', TELEGRAM_TOKEN_SETTING_KEY)
        .maybeSingle();
      
      if (error) throw error;
      
      // If we have a saved display value, use it
      if (data?.value) {
        setTelegramToken(data.value);
      } else {
        // Otherwise use default masked value
        setTelegramToken("••••••••••••••••••••••••••••••");
      }
    } catch (error) {
      console.error("Error loading token display:", error);
      setError("Failed to load settings. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load API settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = useCallback((token: string) => {
    // Simple validation - Telegram bot tokens look like: 123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ
    return /^\d+:[\w-]+$/.test(token);
  }, []);

  const saveToken = async () => {
    if (!telegramToken || telegramToken.trim() === "" || telegramToken === "••••••••••••••••••••••••••••••") {
      toast({
        title: "Validation Error",
        description: "Please enter a valid Telegram bot token",
        variant: "destructive",
      });
      return;
    }

    // If showing the token, validate it first
    if (isShowingToken && !validateToken(telegramToken)) {
      toast({
        title: "Invalid Token Format",
        description: "Telegram token should be in format: 123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // First we update the edge function secret using the functions API
      console.log("Saving token to edge function...");
      const { data, error: secretError } = await supabase.functions.invoke('update-telegram-token', {
        method: 'POST',
        body: { token: telegramToken },
      });
      
      if (secretError || !data?.success) {
        throw new Error(secretError?.message || data?.error || "Failed to update token");
      }
      
      console.log("Token updated in edge function, saving display value...");
      
      // Then we save the display value to database for the UI
      // We either save the full token (if showing) or a masked version if hidden
      const displayValue = isShowingToken ? telegramToken : "••••••••••••••••••••••••••••••";
      
      const { error: dbError } = await supabase
        .from('app_settings')
        .upsert({
          key: TELEGRAM_TOKEN_SETTING_KEY,
          value: displayValue,
          description: 'Display value for Telegram bot token (not the actual token)'
        });
      
      if (dbError) throw dbError;
      
      setSuccess(true);
      toast({
        title: "Success",
        description: "Telegram token has been saved",
      });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving token:", error);
      setError(error?.message || "Failed to save token. Please try again.");
      toast({
        title: "Error Saving Token",
        description: error?.message || "Failed to save the token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTokenVisibility = () => {
    setIsShowingToken(!isShowingToken);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Integration</CardTitle>
        <CardDescription>
          Manage your API keys and integrations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Success</AlertTitle>
            <AlertDescription className="text-green-600">
              Telegram token has been saved successfully.
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            The Telegram bot token must be correctly set for webhooks to function properly. 
            After entering your token, click "Save API Settings" and then set up the webhook in the Bot Settings tab.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="telegram-api">Telegram Bot Token</Label>
          <div className="flex">
            <Input
              id="telegram-api"
              type={isShowingToken ? "text" : "password"}
              placeholder="Your Telegram Bot Token (e.g., 123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ)"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              className="ml-2" 
              variant="outline"
              onClick={toggleTokenVisibility}
              disabled={isLoading}
            >
              {isShowingToken ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              {isShowingToken ? "Hide" : "Show"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Used for connecting to the Telegram Bot API. Format: 123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveToken} disabled={isLoading || isSaving}>
          {isSaving ? (
            <>
              <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save API Settings"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiSettings;
