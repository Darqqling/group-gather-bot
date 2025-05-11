
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HealthCheckResult {
  success: boolean;
  status?: string;
  timestamp?: string;
  message?: string;
}

export async function checkApiHealth(): Promise<HealthCheckResult> {
  try {
    // Use the supabase functions invoke method for calling edge functions
    // Supabase v2 doesn't accept 'path' property in FunctionInvokeOptions
    // Instead, we include the path in the function name
    const { data, error } = await supabase.functions.invoke('bot-api/health', {
      method: 'GET',
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
