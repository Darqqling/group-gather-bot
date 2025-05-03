
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import TelegramPollingSettings from "./TelegramPollingSettings";
import MaintenanceMode from "./MaintenanceMode";

const BotSettings = () => {
  return (
    <>
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
      
      <MaintenanceMode />
      
      <TelegramPollingSettings />
      
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
    </>
  );
};

export default BotSettings;
