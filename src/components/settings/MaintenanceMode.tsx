
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getMaintenanceMessage, getMaintenanceStatus, setMaintenanceMessage, setMaintenanceMode } from "@/services/maintenanceService";

const MaintenanceMode = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMaintenanceSettings();
  }, []);

  const loadMaintenanceSettings = async () => {
    setIsLoading(true);
    try {
      const status = await getMaintenanceStatus();
      const message = await getMaintenanceMessage();
      
      setIsEnabled(status);
      setMessage(message);
    } catch (error) {
      console.error("Error loading maintenance settings:", error);
      toast({
        title: "Error Loading Settings",
        description: "Failed to load maintenance settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveMaintenanceSettings = async () => {
    setIsSaving(true);
    try {
      const modeSuccess = await setMaintenanceMode(isEnabled);
      const messageSuccess = await setMaintenanceMessage(message);
      
      if (modeSuccess && messageSuccess) {
        toast({
          title: "Settings Saved",
          description: "Maintenance settings have been updated successfully.",
        });
      } else {
        throw new Error("Failed to save maintenance settings");
      }
    } catch (error) {
      console.error("Error saving maintenance settings:", error);
      toast({
        title: "Error Saving Settings",
        description: "Failed to save maintenance settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setIsEnabled(checked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
        <CardDescription>
          When enabled, the bot will inform users about temporary service unavailability.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
            <div className="text-sm text-muted-foreground">
              Enable to show maintenance message to all bot users
            </div>
          </div>
          <Switch 
            id="maintenance-mode" 
            checked={isEnabled}
            onCheckedChange={handleToggleChange}
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="maintenance-message">Maintenance Message</Label>
          <Textarea
            id="maintenance-message"
            placeholder="Enter message to display during maintenance"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={saveMaintenanceSettings} 
          disabled={isLoading || isSaving}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MaintenanceMode;
