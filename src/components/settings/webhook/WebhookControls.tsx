
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";

interface WebhookControlsProps {
  onSetup: () => void;
  onReset: () => void;
  onSave: () => void;
  isSettingUp: boolean;
  isLoading: boolean;
  isSaving: boolean;
}

const WebhookControls = ({ 
  onSetup, 
  onReset, 
  onSave, 
  isSettingUp, 
  isLoading, 
  isSaving 
}: WebhookControlsProps) => {
  return (
    <>
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onSetup}
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
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onReset} disabled={isLoading || isSaving}>
          Reset to Default
        </Button>
        <Button onClick={onSave} disabled={isLoading || isSaving}>
          {isSaving ? "Saving..." : "Save URL"}
        </Button>
      </div>
    </>
  );
};

export default WebhookControls;
