
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getMaintenanceMessage, getMaintenanceStatus, setMaintenanceMessage, setMaintenanceMode } from "@/services/maintenanceService";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MaintenanceMode = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMaintenanceSettings();
  }, []);

  const loadMaintenanceSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = await getMaintenanceStatus();
      const message = await getMaintenanceMessage();
      
      setIsEnabled(status);
      setMessage(message);
    } catch (error) {
      console.error("Error loading maintenance settings:", error);
      setError("Failed to load maintenance settings. Please try again.");
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
    setError(null);
    setSuccess(false);
    
    try {
      const modeSuccess = await setMaintenanceMode(isEnabled);
      const messageSuccess = await setMaintenanceMessage(message);
      
      if (modeSuccess && messageSuccess) {
        setSuccess(true);
        toast({
          title: "Settings Saved",
          description: "Maintenance settings have been updated successfully.",
        });
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error("Failed to save maintenance settings");
      }
    } catch (error) {
      console.error("Error saving maintenance settings:", error);
      setError("Failed to save maintenance settings. Please try again.");
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
        <CardDescription>
          When enabled, the bot will inform users about temporary service unavailability.
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
          <Alert variant="success" className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Success</AlertTitle>
            <AlertDescription className="text-green-600">
              Maintenance settings have been updated successfully.
            </AlertDescription>
          </Alert>
        )}

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
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={loadMaintenanceSettings} 
          disabled={isLoading || isSaving}
        >
          Reload Settings
        </Button>
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
