
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HealthCheckResult {
  success: boolean;
  status?: string;
  timestamp?: string;
  message?: string;
}

const PROJECT_ID = "smlqmythgpkucxbaxuob";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtbHFteXRoZ3BrdWN4YmF4dW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NTMxMjEsImV4cCI6MjA2MTEyOTEyMX0.ns2zOcH6JElPYV-f6MrXEN1sRsIVS6pOWSPzAxAJ2Us";

export async function checkApiHealth(): Promise<HealthCheckResult> {
  try {
    // Use the supabase functions invoke method for calling edge functions
    const { data, error } = await supabase.functions.invoke('bot-api', {
      method: 'GET',
      path: '/health',
    });

    if (error) {
      console.error('Health check failed:', error);
      return {
        success: false,
        message: `API returned error: ${error.message}`,
      };
    }

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
