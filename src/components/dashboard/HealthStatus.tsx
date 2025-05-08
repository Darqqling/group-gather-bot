
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivitySquare, CheckCircle, XCircle } from "lucide-react";
import { performHealthCheck } from "@/services/apiHealthService";

const HealthStatus = () => {
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    checked: boolean;
    isHealthy: boolean;
    timestamp?: string;
    message?: string;
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
        isHealthy: result.success,
        timestamp: result.timestamp,
        message: result.message
      });
    } catch (error) {
      console.error("Health check failed:", error);
      setHealthStatus({
        checked: true,
        isHealthy: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivitySquare size={20} />
          API Health Status
        </CardTitle>
        <CardDescription>
          Check if the bot API is running and responsive
        </CardDescription>
      </CardHeader>
      <CardContent>
        {healthStatus.checked && (
          <div className="mb-4 flex items-center">
            <div className="mr-2">
              {healthStatus.isHealthy ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div>
              <div className={`font-medium ${healthStatus.isHealthy ? 'text-green-500' : 'text-red-500'}`}>
                {healthStatus.isHealthy ? 'Healthy' : 'Unhealthy'}
              </div>
              {healthStatus.timestamp && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(healthStatus.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {!healthStatus.checked 
            ? "Click the button below to check the API health status." 
            : healthStatus.message || (healthStatus.isHealthy 
                ? "The API is responding correctly." 
                : "The API is not responding correctly.")}
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleCheckHealth} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Checking..." : "Check API Health"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HealthStatus;
