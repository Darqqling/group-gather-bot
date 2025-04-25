import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import WebhookSettings from "@/components/settings/WebhookSettings";

const Settings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="bot">Bot Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your admin account settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Admin Name</Label>
                <Input id="name" placeholder="Admin Name" defaultValue="Admin User" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input id="email" type="email" placeholder="admin@example.com" defaultValue="admin@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="********" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <div className="text-sm text-muted-foreground">
                    Enable or disable dark mode for the admin panel
                  </div>
                </div>
                <Switch id="dark-mode" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="bot" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bot Configuration</CardTitle>
              <CardDescription>
                Configure your Telegram bot settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bot-name">Bot Name</Label>
                <Input id="bot-name" placeholder="Bot Name" defaultValue="GroupGatherBot" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bot-username">Bot Username</Label>
                <Input id="bot-username" placeholder="@bot_username" defaultValue="@group_gather_bot" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  placeholder="Welcome message for new users"
                  defaultValue="Welcome to Group Gather Bot! Use /new to start a new collection or /help to see available commands."
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <div className="text-sm text-muted-foreground">
                    When enabled, the bot will inform users about temporary service unavailability
                  </div>
                </div>
                <Switch id="maintenance-mode" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="active">Bot Active</Label>
                  <div className="text-sm text-muted-foreground">
                    Enable or disable the bot
                  </div>
                </div>
                <Switch id="active" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Bot Settings</Button>
            </CardFooter>
          </Card>
          
          <WebhookSettings />
          
          <Card>
            <CardHeader>
              <CardTitle>Command Settings</CardTitle>
              <CardDescription>
                Configure the commands available in your bot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { command: "/start", enabled: true },
                { command: "/new", enabled: true },
                { command: "/finish", enabled: true },
                { command: "/cancel", enabled: true },
                { command: "/paid", enabled: true },
                { command: "/history", enabled: true },
              ].map((item) => (
                <div key={item.command} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.command}</div>
                  </div>
                  <Switch id={`cmd-${item.command}`} defaultChecked={item.enabled} />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button>Update Commands</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6 mt-6">
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
        </TabsContent>
        
        <TabsContent value="api" className="space-y-6 mt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
