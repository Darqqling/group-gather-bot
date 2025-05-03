
import { supabase } from "@/integrations/supabase/client";

// Interval in milliseconds between polling checks (default: 5 seconds)
const DEFAULT_POLLING_INTERVAL = 5000;

// Store for the polling interval
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let isPolling = false;

/**
 * Start polling for Telegram updates
 */
export const startPolling = (callback?: () => void, interval = DEFAULT_POLLING_INTERVAL) => {
  if (isPolling) {
    console.log("Polling already active");
    return;
  }
  
  console.log(`Starting Telegram polling with interval ${interval}ms`);
  isPolling = true;
  
  // Clear any existing interval
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Initial poll
  pollUpdates();
  
  // Set interval for subsequent polls
  pollingInterval = setInterval(async () => {
    await pollUpdates();
    if (callback) callback();
  }, interval);
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
      body: { reset: true },
      method: 'GET'
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
      body: { action: 'process' },
      method: 'GET'
    });
    
    if (error) {
      console.error("Error polling updates:", error);
      return false;
    }
    
    if (data.updates > 0) {
      console.log(`Processed ${data.updates} updates, new lastUpdateId: ${data.lastUpdateId}`);
    }
    
    return data.success;
  } catch (error) {
    console.error("Exception polling updates:", error);
    return false;
  }
}
