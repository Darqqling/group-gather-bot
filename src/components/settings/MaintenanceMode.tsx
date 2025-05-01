
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getMaintenanceMode, setMaintenanceMode } from "@/services/webhookService";

const MaintenanceMode = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [message, setMessage] = useState<string>(
    "Бот временно находится в режиме обслуживания. Пожалуйста, попробуйте позже."
  );
  const { toast } = useToast();

  useEffect(() => {
    loadMaintenanceMode();
  }, []);

  const loadMaintenanceMode = async () => {
    setIsLoading(true);
    try {
      const status = await getMaintenanceMode();
      setEnabled(status);
      
      // TODO: Load custom message if needed
    } catch (error) {
      console.error("Error loading maintenance mode:", error);
      toast({
        title: "Error Loading Settings",
        description: "Failed to load maintenance mode settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const success = await setMaintenanceMode(enabled, message);
      if (success) {
        toast({
          title: "Settings Saved",
          description: enabled ? "Maintenance mode has been activated" : "Maintenance mode has been deactivated",
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving maintenance mode settings:", error);
      toast({
        title: "Error Saving Settings",
        description: "Failed to save maintenance mode settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
        <CardDescription>
          When enabled, the bot will inform users about temporary service unavailability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
            <div className="text-sm text-muted-foreground">
              Enable to put the bot into maintenance mode
            </div>
          </div>
          <Switch 
            id="maintenance-mode" 
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={isLoading || isSaving}
          />
        </div>
        
        {enabled && (
          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Maintenance Message</Label>
            <Textarea
              id="maintenance-message"
              placeholder="Message to display to users during maintenance"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading || isSaving}
            />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={saveSettings}
          disabled={isLoading || isSaving}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MaintenanceMode;
