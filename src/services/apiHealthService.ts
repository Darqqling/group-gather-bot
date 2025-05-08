
import { toast } from "@/components/ui/use-toast";

interface HealthCheckResult {
  success: boolean;
  status?: string;
  timestamp?: string;
  message?: string;
}

const PROJECT_ID = "smlqmythgpkucxbaxuob";

export async function checkApiHealth(): Promise<HealthCheckResult> {
  try {
    const response = await fetch(`https://${PROJECT_ID}.supabase.co/functions/v1/bot-api/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Health check failed:', errorData);
      return {
        success: false,
        message: `API returned ${response.status}: ${errorData}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      status: data.status,
      timestamp: data.timestamp,
      message: "API is healthy",
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      success: false,
      message: `Failed to connect: ${error.message}`,
    };
  }
}

export function performHealthCheck(): Promise<HealthCheckResult> {
  return checkApiHealth().then((result) => {
    if (result.success) {
      toast({
        title: "API Health Check",
        description: "API is responding correctly",
        variant: "default",
      });
    } else {
      toast({
        title: "API Health Check Failed",
        description: result.message || "Could not connect to API",
        variant: "destructive",
      });
    }
    return result;
  });
}
