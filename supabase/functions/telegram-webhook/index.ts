
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import { handleMessage } from "./handlers/messageHandlers.ts";
import { handleCallbackQuery } from "./handlers/callbackHandlers.ts";
import { sendTelegramMessage, answerCallbackQuery } from "./utils/telegramApi.ts";
import { saveUser, logError, getUserState, updateUserState } from "./utils/databaseUtils.ts";

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
      .single();
      
    if (error || !data) {
      console.error("Error retrieving bot token from database:", error);
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
      .single();
    
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
      .single();
    
    if (error || !data) {
      return "Сервис временно недоступен. Пожалуйста, попробуйте позже.";
    }
    
    return data.value;
  } catch (error) {
    return "Сервис временно недоступен. Пожалуйста, попробуйте позже.";
  }
}

serve(async (req) => {
  console.log("Webhook received a request");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the bot token from the database
    const TELEGRAM_BOT_TOKEN = await getBotToken();
    
    // Check if bot token is set
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not configured or could not be retrieved");
      return new Response(
        JSON.stringify({ success: false, error: "Bot token not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Bot token is configured: ${TELEGRAM_BOT_TOKEN.substring(0, 3)}...${TELEGRAM_BOT_TOKEN.substring(TELEGRAM_BOT_TOKEN.length - 3)}`);

    // Process the Telegram update
    const update = await req.json();
    console.log("Received update:", JSON.stringify(update));

    // Basic validation to ensure this is a Telegram webhook
    if (!update || !update.update_id) {
      console.error("Invalid Telegram update format");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid update format" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Check maintenance mode
    const maintenanceMode = await isMaintenanceMode();
    console.log(`Maintenance mode: ${maintenanceMode}`);
    
    // Handle updates based on type
    if (update.message) {
      // Save or update the user regardless of maintenance mode
      await saveUser(update.message.from, supabaseAdmin);
      
      if (maintenanceMode) {
        // If in maintenance mode, send the maintenance message
        const maintenanceMessage = await getMaintenanceMessage();
        await sendTelegramMessage(update.message.chat.id, maintenanceMessage, { token: TELEGRAM_BOT_TOKEN });
      } else {
        // Regular message handling
        await handleMessage(
          update.message, 
          supabaseAdmin,
          (chatId: number | string, text: string, options = {}) => 
            sendTelegramMessage(chatId, text, { ...options, token: TELEGRAM_BOT_TOKEN })
        );
      }
    } else if (update.callback_query) {
      if (maintenanceMode) {
        // If in maintenance mode, answer callback query with maintenance message
        const maintenanceMessage = await getMaintenanceMessage();
        await answerCallbackQuery(update.callback_query.id, "Сервис на обслуживании", { token: TELEGRAM_BOT_TOKEN });
        await sendTelegramMessage(update.callback_query.message.chat.id, maintenanceMessage, { token: TELEGRAM_BOT_TOKEN });
      } else {
        // Regular callback query handling
        await handleCallbackQuery(
          update.callback_query,
          supabaseAdmin,
          (chatId: number | string, text: string, options = {}) => 
            sendTelegramMessage(chatId, text, { ...options, token: TELEGRAM_BOT_TOKEN }),
          (callbackQueryId: string, text = "", options = {}) => 
            answerCallbackQuery(callbackQueryId, text, { ...options, token: TELEGRAM_BOT_TOKEN })
        );
      }
    }

    // Always respond with success to Telegram
    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    
    // Log the error to the database
    try {
      await logError(error, { source: "telegram-webhook" }, supabaseAdmin);
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
