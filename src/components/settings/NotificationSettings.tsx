
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const NotificationSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure when and how you receive notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>New Collection Notifications</Label>
            <div className="text-sm text-muted-foreground">
              Receive notifications when a new collection is created
            </div>
          </div>
          <Switch defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Error Notifications</Label>
            <div className="text-sm text-muted-foreground">
              Receive notifications about system errors
            </div>
          </div>
          <Switch defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Payment Notifications</Label>
            <div className="text-sm text-muted-foreground">
              Receive notifications about new payments
            </div>
          </div>
          <Switch defaultChecked />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notification-email">Notification Email</Label>
          <Input
            id="notification-email"
            type="email"
            placeholder="notifications@example.com"
            defaultValue="admin@example.com"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button>Save Notification Settings</Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationSettings;
