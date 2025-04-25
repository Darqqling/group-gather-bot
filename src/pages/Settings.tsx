
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralSettings from "@/components/settings/GeneralSettings";
import BotSettings from "@/components/settings/BotSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import ApiSettings from "@/components/settings/ApiSettings";

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
          <GeneralSettings />
        </TabsContent>
        
        <TabsContent value="bot" className="space-y-6 mt-6">
          <BotSettings />
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="api" className="space-y-6 mt-6">
          <ApiSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
