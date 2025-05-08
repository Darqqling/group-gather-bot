
import { supabase } from "@/integrations/supabase/client";
import { deleteWebhook } from "@/services/webhookService";

let pollingActive = false;
let pollingTimeout: ReturnType<typeof setTimeout> | null = null;
let pollingErrorCount = 0;
const POLLING_RETRY_MAX = 5;

export function isPollingActive(): boolean {
  return pollingActive;
}

export async function startPolling(): Promise<{ success: boolean, error?: string }> {
  try {
    if (pollingActive) {
      console.log("Polling already active, not starting again");
      return { success: true };
    }

    console.log("Starting Telegram polling...");
    pollingErrorCount = 0;

    // Make sure to clear existing timeouts
    if (pollingTimeout) {
      clearTimeout(pollingTimeout);
      pollingTimeout = null;
    }

    // Reset any local storage errors
    localStorage.removeItem('telegram_polling_error');

    // Before starting polling, ensure webhook is disabled
    try {
      console.log("Disabling webhook before starting polling...");
      await deleteWebhook();
    } catch (webhookError) {
      console.warn("Non-critical error when disabling webhook:", webhookError);
      // Continue despite webhook error - polling should work anyway
    }

    // Call the polling function and start the polling cycle
    const result = await pollTelegram();

    if (!result.success) {
      console.error("Initial polling failed:", result.error);
      localStorage.setItem('telegram_polling_error', result.error || 'Не удалось запустить опрос');
      pollingActive = false;
      return { success: false, error: result.error };
    }

    pollingActive = true;
    scheduleTelegramPolling();
    return { success: true };

  } catch (error) {
    console.error("Error starting Telegram polling:", error);
    localStorage.setItem('telegram_polling_error', error.message || 'Неизвестная ошибка при запуске опроса');
    pollingActive = false;
    return { success: false, error: error.message || 'Неизвестная ошибка при запуске опроса' };
  }
}

export function stopPolling(): void {
  console.log("Stopping Telegram polling...");
  pollingActive = false;

  if (pollingTimeout) {
    clearTimeout(pollingTimeout);
    pollingTimeout = null;
  }
}

// Add the resetPolling function that was referenced but not implemented
export async function resetPolling(): Promise<boolean> {
  console.log("Resetting Telegram polling state...");
  
  try {
    // Reset error count
    pollingErrorCount = 0;
    
    // Clear any stored errors
    localStorage.removeItem('telegram_polling_error');
    
    // Call edge function to reset update ID if needed
    const { error } = await supabase.functions.invoke('telegram-polling', {
      body: { action: 'reset' },
    });
    
    if (error) {
      console.error("Error resetting polling:", error);
      return false;
    }
    
    console.log("Polling state reset successfully");
    return true;
  } catch (error) {
    console.error("Exception resetting polling:", error);
    return false;
  }
}

async function pollTelegram(): Promise<{ success: boolean, error?: string }> {
  try {
    // Call the Edge function to process Telegram updates
    const { data, error } = await supabase.functions.invoke('telegram-polling', {
      body: { action: 'process' },
    });

    if (error) {
      pollingErrorCount++;
      console.error(`Telegram polling error (attempt ${pollingErrorCount}):`, error);

      if (pollingErrorCount >= POLLING_RETRY_MAX) {
        localStorage.setItem('telegram_polling_error', 
          `Превышено количество попыток опроса (${pollingErrorCount}). Проверьте настройки бота и логи.`);
        stopPolling();
        return { success: false, error: `Превышено количество попыток опроса (${pollingErrorCount})` };
      }
      
      return { success: false, error: error.message || 'Error during polling' };
    }

    // Reset error count on success
    if (pollingErrorCount > 0) {
      console.log("Polling successful after errors, resetting error count");
      pollingErrorCount = 0;
    }

    console.log("Telegram polling successful:", data);
    return { success: true };

  } catch (error) {
    pollingErrorCount++;
    console.error(`Telegram polling exception (attempt ${pollingErrorCount}):`, error);

    if (pollingErrorCount >= POLLING_RETRY_MAX) {
      localStorage.setItem('telegram_polling_error', 
        `Превышено количество попыток опроса (${pollingErrorCount}). Проверьте настройки бота и логи.`);
      stopPolling();
      return { success: false, error: `Превышено количество попыток опроса (${pollingErrorCount})` };
    }
    
    return { success: false, error: error.message || 'Exception during polling' };
  }
}

function scheduleTelegramPolling() {
  if (!pollingActive) {
    console.log("Polling disabled, not scheduling next poll");
    return;
  }

  pollingTimeout = setTimeout(async () => {
    if (!pollingActive) {
      console.log("Polling disabled before timeout, not polling");
      return;
    }

    try {
      const result = await pollTelegram();
      
      if (!result.success) {
        console.warn("Polling failed, but continuing to try:", result.error);
      }
    } catch (error) {
      console.error("Error during scheduled polling:", error);
    }

    // Schedule the next poll regardless of success/failure
    // As long as we haven't hit the maximum retry limit
    if (pollingActive && pollingErrorCount < POLLING_RETRY_MAX) {
      scheduleTelegramPolling();
    } else if (pollingErrorCount >= POLLING_RETRY_MAX) {
      console.error(`Stopping polling due to too many errors (${pollingErrorCount})`);
      localStorage.setItem('telegram_polling_error', 
        `Превышено количество попыток опроса (${pollingErrorCount}). Проверьте настройки бота и логи.`);
      stopPolling();
    }
  }, 5000); // Poll every 5 seconds
}
