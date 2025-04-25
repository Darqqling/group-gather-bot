
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCopyIcon, CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebhookUrlInputProps {
  webhookUrl: string;
  isLoading: boolean;
  onWebhookUrlChange: (url: string) => void;
}

const WebhookUrlInput = ({ webhookUrl, isLoading, onWebhookUrlChange }: WebhookUrlInputProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="space-y-2">
      <Label htmlFor="webhook-url">Webhook URL</Label>
      <div className="flex">
        <Input
          id="webhook-url"
          value={webhookUrl}
          onChange={(e) => onWebhookUrlChange(e.target.value)}
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
  );
};

export default WebhookUrlInput;
