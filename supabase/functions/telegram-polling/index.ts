
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import { handleMessage } from "../telegram-webhook/handlers/messageHandlers.ts";
import { handleCallbackQuery } from "../telegram-webhook/handlers/callbackHandlers.ts";
import { sendTelegramMessage, answerCallbackQuery } from "../telegram-webhook/utils/telegramApi.ts";
import { logError } from "../telegram-webhook/utils/databaseUtils.ts";

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

// Get updates from Telegram (long polling)
async function getUpdates(token: string, offset = 0) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`,
      { method: "GET" }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching updates: ${response.status} ${errorText}`);
      return { ok: false, error: errorText };
    }
    
    return await response.json();
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
    // Get request parameters
    const params = new URL(req.url).searchParams;
    const action = params.get('action') || 'check';
    const reset = params.get('reset') === 'true';
    
    // If reset is requested, reset the last update ID
    if (reset) {
      lastUpdateId = 0;
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

    // Check maintenance mode
    const maintenanceMode = await isMaintenanceMode();

    // Fetch updates from Telegram
    const updates = await getUpdates(token, lastUpdateId);
    if (!updates.ok) {
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
      
      // Update lastUpdateId to avoid processing the same updates again
      if (updates.result.length > 0) {
        const maxUpdateId = Math.max(...updates.result.map(u => u.update_id));
        lastUpdateId = maxUpdateId + 1;
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
