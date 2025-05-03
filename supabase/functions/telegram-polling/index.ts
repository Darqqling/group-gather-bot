
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import { handleMessage } from "./handlers/messageHandlers.ts";
import { handleCallbackQuery } from "./handlers/callbackHandlers.ts";
import { sendTelegramMessage, answerCallbackQuery } from "./utils/telegramApi.ts";
import { logError } from "./utils/databaseUtils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a supabase client with the service role key
const supabaseAdmin = createClient(SUPABASE_URL || "https://smlqmythgpkucxbaxuob.supabase.co", SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Get the bot token from the database
async function getBotToken() {
  try {
    console.log("Retrieving bot token from database");
    const { data, error } = await supabaseAdmin
      .from('app_secrets')
      .select('value')
      .eq('key', 'TELEGRAM_BOT_TOKEN')
      .maybeSingle();
      
    if (error) {
      console.error("Error retrieving bot token from database:", error);
      return null;
    }
    
    if (!data || !data.value) {
      console.error("Bot token not found in database");
      return null;
    }
    
    const tokenPreview = data.value.length > 10 
      ? `${data.value.substring(0, 5)}...${data.value.substring(data.value.length - 5)}`
      : "[EMPTY]";
    console.log(`Retrieved bot token: ${tokenPreview}`);
    return data.value;
  } catch (error) {
    console.error("Exception retrieving bot token:", error);
    return null;
  }
}

// Check if maintenance mode is enabled
async function isMaintenanceMode() {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle();
    
    if (error) {
      console.error("Error checking maintenance mode:", error);
      return false;
    }
    
    return data?.value === 'true';
  } catch (error) {
    console.error("Exception checking maintenance mode:", error);
    return false;
  }
}

// Get maintenance message
async function getMaintenanceMessage() {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_message')
      .maybeSingle();
    
    if (error || !data) {
      return "Сервис временно недоступен. Пожалуйста, попробуйте позже.";
    }
    
    return data.value;
  } catch (error) {
    return "Сервис временно недоступен. Пожалуйста, попробуйте позже.";
  }
}

// Delete any existing webhooks
async function deleteWebhook(token: string) {
  try {
    console.log("Attempting to delete webhook");
    const url = `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error deleting webhook: ${response.status} ${errorText}`);
      return { success: false, error: errorText };
    }
    
    const result = await response.json();
    console.log("Delete webhook result:", result);
    
    return { success: result.ok, result };
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return { success: false, error: error.message };
  }
}

// Get updates from Telegram (long polling)
async function getUpdates(token: string, offset = 0, timeout = 30) {
  try {
    // Using timeout parameter as recommended in the docs for long polling
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=${timeout}`;
    console.log(`Requesting updates with offset ${offset}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), (timeout + 5) * 1000); // Add 5 seconds buffer
    
    try {
      const response = await fetch(url, { 
        method: "GET",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching updates: ${response.status} ${errorText}`);
        return { ok: false, error: errorText };
      }
      
      return await response.json();
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.error("Fetch request aborted due to timeout");
        return { ok: false, error: "Request timeout" };
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Exception fetching updates:", error);
    return { ok: false, error: error.message };
  }
}

// Process updates
async function processUpdates(updates: any[], token: string, maintenanceMode: boolean) {
  const maintenanceMessage = maintenanceMode ? await getMaintenanceMessage() : null;
  
  for (const update of updates) {
    try {
      console.log("Processing update:", JSON.stringify(update));
      
      // Handle message
      if (update.message) {
        if (maintenanceMode) {
          await sendTelegramMessage(update.message.chat.id, maintenanceMessage, { token });
        } else {
          await handleMessage(
            update.message, 
            supabaseAdmin,
            (chatId: number | string, text: string, options = {}) => 
              sendTelegramMessage(chatId, text, { ...options, token })
          );
        }
      } 
      // Handle callback query
      else if (update.callback_query) {
        if (maintenanceMode) {
          await answerCallbackQuery(update.callback_query.id, "Сервис на обслуживании", { token });
          await sendTelegramMessage(update.callback_query.message.chat.id, maintenanceMessage, { token });
        } else {
          await handleCallbackQuery(
            update.callback_query,
            supabaseAdmin,
            (chatId: number | string, text: string, options = {}) => 
              sendTelegramMessage(chatId, text, { ...options, token }),
            (callbackQueryId: string, text = "", options = {}) => 
              answerCallbackQuery(callbackQueryId, text, { ...options, token })
          );
        }
      }
    } catch (error) {
      console.error(`Error processing update ${update.update_id}:`, error);
      await logError(error, { source: "telegram-polling", update_id: update.update_id }, supabaseAdmin);
    }
  }
}

// Store the last update ID to avoid processing the same updates multiple times
let lastUpdateId = 0;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Telegram polling function called");
    
    // Parse the request body to get the action
    let body;
    let action = 'check';

    try {
      body = await req.json();
      action = body.action || action;
    } catch (e) {
      // If body parsing fails, use default values
      console.log('No valid JSON body, using default values');
    }
    
    // If reset is requested, reset the last update ID
    if (action === 'reset') {
      lastUpdateId = 0;
      console.log("Update ID reset to 0");
      
      return new Response(
        JSON.stringify({ success: true, message: "Update ID reset successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the bot token from the database
    const token = await getBotToken();
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle webhook deletion
    if (action === 'deleteWebhook') {
      const result = await deleteWebhook(token);
      return new Response(
        JSON.stringify({ success: result.success, result: result.result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For process action, first ensure webhook is deleted
    if (action === 'process') {
      // Always try to delete webhook first to avoid conflicts
      const webhookResult = await deleteWebhook(token);
      
      if (!webhookResult.success) {
        console.error("Failed to delete webhook before polling");
        return new Response(
          JSON.stringify({ success: false, error: "Failed to delete webhook" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check maintenance mode
    const maintenanceMode = await isMaintenanceMode();
    console.log(`Maintenance mode: ${maintenanceMode}`);

    // Fetch updates from Telegram
    const updates = await getUpdates(token, lastUpdateId);
    if (!updates.ok) {
      console.error("Error fetching updates:", updates.error);
      return new Response(
        JSON.stringify({ success: false, error: updates.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If there are no updates, return success
    if (!updates.result || updates.result.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updates: 0, message: "No new updates" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Received ${updates.result.length} updates`);

    // Process updates if action is 'process'
    if (action === 'process') {
      await processUpdates(updates.result, token, maintenanceMode);
      
      // Update lastUpdateId to be the highest update_id + 1, as per Telegram docs
      if (updates.result.length > 0) {
        const maxUpdateId = Math.max(...updates.result.map((u: any) => u.update_id));
        lastUpdateId = maxUpdateId + 1;
        console.log(`New lastUpdateId: ${lastUpdateId}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updates: updates.result.length,
        lastUpdateId: lastUpdateId,
        maintenanceMode
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in telegram-polling:", error);
    
    try {
      await logError(error, { source: "telegram-polling" }, supabaseAdmin);
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
