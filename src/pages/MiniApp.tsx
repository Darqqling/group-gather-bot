
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MiniApp = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Telegram Mini App</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Mini App Development</CardTitle>
          <CardDescription>
            Information about the Telegram Mini App integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            This page provides resources for developing and testing the Telegram Mini App
            that interacts with the Group Collect Bot.
          </p>
          <p className="text-sm text-gray-500">
            The Mini App allows users to view and manage their collections directly
            from Telegram without using bot commands.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MiniApp;
