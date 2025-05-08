
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const MiniApp = () => {
  const docsUrl = "https://smlqmythgpkucxbaxuob.supabase.co/functions/v1/docs";

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Telegram Mini App</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
            <CardDescription>
              View the Swagger UI documentation for the Group Collect Bot API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => window.open(docsUrl, '_blank')}
            >
              <ExternalLink size={16} />
              Open API Documentation
            </Button>
          </CardContent>
        </Card>

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
    </div>
  );
};

export default MiniApp;
