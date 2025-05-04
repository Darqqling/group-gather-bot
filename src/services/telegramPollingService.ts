
import { supabase } from "@/integrations/supabase/client";

// Interval in milliseconds between polling checks (default: 5 seconds)
const DEFAULT_POLLING_INTERVAL = 5000;

// Store for the polling interval
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let isPolling = false;

/**
 * Start polling for Telegram updates
 */
export const startPolling = async (callback?: () => void, interval = DEFAULT_POLLING_INTERVAL) => {
  if (isPolling) {
    console.log("Polling already active");
    return false;
  }
  
  console.log(`Starting Telegram polling with interval ${interval}ms`);
  
  try {
    // First, ensure any webhooks are deleted
    const webhookDeleted = await deleteWebhook();
    console.log("Webhook deletion result:", webhookDeleted);
    
    // Only start polling if webhook was deleted successfully
    if (!webhookDeleted.success) {
      console.error("Failed to delete webhook before starting polling");
      return false;
    }
    
    isPolling = true;
    
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Initial poll
    const initialPollResult = await pollUpdates();
    if (!initialPollResult) {
      console.error("Initial poll failed, stopping polling");
      stopPolling();
      return false;
    }
    
    // Set interval for subsequent polls
    pollingInterval = setInterval(async () => {
      const success = await pollUpdates();
      if (!success) {
        console.warn("Poll failed, but continuing with next interval");
      }
      if (callback) callback();
    }, interval);
    
    return true;
  } catch (error) {
    console.error("Exception in startPolling:", error);
    isPolling = false;
    return false;
  }
};

/**
 * Stop polling for Telegram updates
 */
export const stopPolling = () => {
  console.log("Stopping Telegram polling");
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  isPolling = false;
};

/**
 * Reset the update ID to start polling from the beginning
 */
export const resetPolling = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('telegram-polling', {
      method: 'POST',
      body: { action: 'reset' },
    });
    
    if (error) {
      console.error("Error resetting polling:", error);
      return false;
    }
    
    console.log("Polling reset successful:", data);
    return data?.success === true;
  } catch (error) {
    console.error("Exception resetting polling:", error);
    return false;
  }
};

/**
 * Explicitly delete any existing webhook
 */
export const deleteWebhook = async (): Promise<{success: boolean, result?: any, error?: string}> => {
  try {
    // Use the telegram-polling function to delete any webhook
    const { data, error } = await supabase.functions.invoke('telegram-polling', {
      method: 'POST',
      body: { action: 'deleteWebhook' },
    });
    
    if (error) {
      console.error("Error deleting webhook:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Webhook deletion result:", data);
    return { success: data?.success === true, result: data };
  } catch (error: any) {
    console.error("Exception deleting webhook:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if polling is currently active
 */
export const isPollingActive = (): boolean => {
  return isPolling;
};

/**
 * Poll for Telegram updates
 */
async function pollUpdates() {
  try {
    const { data, error } = await supabase.functions.invoke('telegram-polling', {
      method: 'POST',
      body: { action: 'process' },
    });
    
    if (error) {
      console.error("Error polling updates:", error);
      return false;
    }
    
    if (data && data.updates > 0) {
      console.log(`Processed ${data.updates} updates, new lastUpdateId: ${data.lastUpdateId}`);
    }
    
    return data?.success;
  } catch (error) {
    console.error("Exception polling updates:", error);
    return false;
  }
}
