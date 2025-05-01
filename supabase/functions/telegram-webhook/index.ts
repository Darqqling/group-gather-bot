
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import { handleMessage } from "./handlers/messageHandlers.ts";
import { handleCallbackQuery } from "./handlers/callbackHandlers.ts";
import { sendTelegramMessage, answerCallbackQuery } from "./utils/telegramApi.ts";
import { saveUser, logError } from "./utils/databaseUtils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get the token from the environment variable
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://smlqmythgpkucxbaxuob.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a supabase client with the service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

serve(async (req) => {
  console.log("Webhook received a request");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Process different types of updates
    if (update.message) {
      await handleMessage(
        update.message, 
        (user) => saveUser(user, supabaseAdmin),
        sendTelegramMessage,
        supabaseAdmin
      );
    } else if (update.callback_query) {
      await handleCallbackQuery(
        update.callback_query,
        sendTelegramMessage,
        answerCallbackQuery,
        supabaseAdmin
      );
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
    await logError(error, { source: "telegram-webhook" }, supabaseAdmin);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
