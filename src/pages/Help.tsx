
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bot, Shield } from "lucide-react";

const Help = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Help & Documentation</h1>
      
      <Tabs defaultValue="admin" className="space-y-4">
        <TabsList>
          <TabsTrigger value="admin">Admin Guide</TabsTrigger>
          <TabsTrigger value="bot">Bot Commands</TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Interface Guide
              </CardTitle>
              <CardDescription>
                Quick guide to using the admin interface efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  The dashboard provides a quick overview of your system:
                  - Real-time statistics of users and collections
                  - Recent collection activities
                  - Collection success rates
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Collections Management</h3>
                <p className="text-sm text-muted-foreground">
                  - View all collections and their status
                  - Filter collections by status, date, or amount
                  - Manually change collection status
                  - Review and approve payments
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">User Management</h3>
                <p className="text-sm text-muted-foreground">
                  - View all registered users
                  - Check user participation in collections
                  - Review user payment history
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">System Settings</h3>
                <p className="text-sm text-muted-foreground">
                  - Toggle maintenance mode
                  - Configure bot settings
                  - View error logs
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Bot Commands Reference
              </CardTitle>
              <CardDescription>
                Complete list of available bot commands and their usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">/start</h3>
                <p className="text-sm text-muted-foreground">
                  Starts the bot and displays welcome message with available commands.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">/new</h3>
                <p className="text-sm text-muted-foreground">
                  Creates a new collection. The bot will ask for:
                  - Collection name
                  - Description
                  - Target amount
                  - Deadline
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">/finish</h3>
                <p className="text-sm text-muted-foreground">
                  Marks a collection as finished. Only available to collection creators.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">/cancel</h3>
                <p className="text-sm text-muted-foreground">
                  Cancels an active collection. Only available to collection creators.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">/paid</h3>
                <p className="text-sm text-muted-foreground">
                  Reports a payment for a collection. The bot will ask for:
                  - Collection selection
                  - Payment amount
                  - Payment confirmation
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">/history</h3>
                <p className="text-sm text-muted-foreground">
                  Shows your participation history in collections.
                </p>
              </div>

              <div className="mt-4 rounded-md bg-muted p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    If you encounter any issues, contact the administrator or check the logs in the admin panel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Help;
