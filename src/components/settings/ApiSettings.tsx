
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ApiSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Integration</CardTitle>
        <CardDescription>
          Manage your API keys and integrations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="telegram-api">Telegram Bot Token</Label>
          <div className="flex">
            <Input
              id="telegram-api"
              type="password"
              placeholder="Your Telegram Bot Token"
              defaultValue="••••••••••••••••••••••••••••••"
            />
            <Button className="ml-2" variant="outline">
              Show
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Used for connecting to the Telegram Bot API.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button>Save API Settings</Button>
      </CardFooter>
    </Card>
  );
};

export default ApiSettings;
