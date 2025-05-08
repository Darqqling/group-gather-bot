
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { performHealthCheck } from "@/services/apiHealthService";
import { ExternalLink, Check, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function MiniApp() {
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    checked: boolean;
    isHealthy: boolean;
  }>({
    checked: false,
    isHealthy: false
  });

  const handleCheckHealth = async () => {
    setLoading(true);
    try {
      const result = await performHealthCheck();
      setHealthStatus({
        checked: true,
        isHealthy: result.success
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Telegram Bot Mini App</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Welcome to the Mini App</CardTitle>
            <CardDescription>
              This is a placeholder page for the Telegram Bot Mini App interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-primary/10 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">About Mini Apps</h2>
              <p className="mb-4 text-muted-foreground">
                Telegram Mini Apps are web apps that can be seamlessly integrated into the Telegram messenger.
                They provide a rich user interface for bot interactions directly within the Telegram app.
              </p>
              
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Simple user interface for your Telegram bot</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Direct integration with Telegram</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Works on all platforms that support Telegram</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`h-3 w-3 rounded-full ${healthStatus.checked ? (healthStatus.isHealthy ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-300'}`}></div>
                <span>{healthStatus.checked ? (healthStatus.isHealthy ? 'API is healthy' : 'API health check failed') : 'API status unknown'}</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCheckHealth}
                disabled={loading}
              >
                {loading ? "Checking..." : "Check API"}
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <a href="https://core.telegram.org/bots/webapps" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Learn More About Telegram Mini Apps
              </a>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Development Status</CardTitle>
            <CardDescription>Current development information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  This is a placeholder page. The actual Mini App interface is under development and will be implemented according to the specified requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>How to integrate this Mini App</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Configure your bot with BotFather</li>
              <li>Add the /setmenubutton command</li>
              <li>Set this URL as your Web App</li>
              <li>Test the integration in Telegram</li>
            </ol>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <a href="https://core.telegram.org/bots/webapps#implementing-mini-apps" target="_blank" rel="noopener noreferrer">
                Implementation Guide
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
