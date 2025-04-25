
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

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
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
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
      await supabaseAdmin
        .from("error_logs")
        .insert({
          message: `Error processing Telegram webhook: ${error.message}`,
          stack: error.stack,
          context: { source: "telegram-webhook" }
        });
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

// Handle incoming messages from Telegram
async function handleMessage(message) {
  if (!message || !message.from) return;

  // Save or update the user
  await saveUser(message.from);
  
  // Update last_active_at for the user
  await supabaseAdmin
    .from("telegram_users")
    .update({ last_active_at: new Date().toISOString() })
    .eq("telegram_id", message.from.telegram_id.toString());

  // Process commands
  if (message.text && message.text.startsWith('/')) {
    await handleCommand(message);
    return;
  }

  // Default response if no command matched
  await sendTelegramMessage(
    message.chat.id,
    "Извините, я не распознал команду. Используйте /start, /new, /finish, /cancel, /paid, /history."
  );
}

// Handle Telegram bot commands
async function handleCommand(message) {
  const command = message.text.split(' ')[0].toLowerCase();
  
  switch (command) {
    case '/start':
      await handleStartCommand(message);
      break;
    case '/new':
      await handleNewCommand(message);
      break;
    case '/finish':
      await handleFinishCommand(message);
      break;
    case '/cancel':
      await handleCancelCommand(message);
      break;
    case '/paid':
      await handlePaidCommand(message);
      break;
    case '/history':
      await handleHistoryCommand(message);
      break;
    default:
      await sendTelegramMessage(
        message.chat.id,
        "Извините, я не распознал команду. Используйте /start, /new, /finish, /cancel, /paid, /history."
      );
  }
}

// Command handlers (stub implementations)
async function handleStartCommand(message) {
  await sendTelegramMessage(
    message.chat.id,
    "Добро пожаловать! Я бот для организации сборов средств. Используйте следующие команды:\n" +
    "/new - создать новый сбор\n" +
    "/finish - завершить активный сбор\n" +
    "/cancel - отменить активный сбор\n" +
    "/paid - подтвердить оплату\n" +
    "/history - история ваших сборов"
  );
}

async function handleNewCommand(message) {
  // This would start a conversation flow to collect details for a new collection
  await sendTelegramMessage(message.chat.id, "Для создания нового сбора, введите название:");
  
  // Store the state that the user is now in the "new collection" flow
  // This would be handled by a proper state management system
}

async function handleFinishCommand(message) {
  await sendTelegramMessage(message.chat.id, "Функция завершения сбора в разработке.");
}

async function handleCancelCommand(message) {
  await sendTelegramMessage(message.chat.id, "Функция отмены сбора в разработке.");
}

async function handlePaidCommand(message) {
  await sendTelegramMessage(message.chat.id, "Функция подтверждения оплаты в разработке.");
}

async function handleHistoryCommand(message) {
  await sendTelegramMessage(message.chat.id, "История ваших сборов в разработке.");
}

// Handle callback queries (for inline buttons)
async function handleCallbackQuery(callbackQuery) {
  // Process callback data and respond
  console.log("Received callback query:", callbackQuery);
}

// Helper function to save/update a user in the database
async function saveUser(user) {
  if (!user || !user.id) return;
  
  const { data, error } = await supabaseAdmin
    .from("telegram_users")
    .upsert({
      telegram_id: user.id.toString(),
      username: user.username || null,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      last_active_at: new Date().toISOString()
    })
    .select();
  
  if (error) {
    console.error("Error saving user:", error);
  }
  
  return data;
}

// Helper function to send messages via Telegram API
async function sendTelegramMessage(chatId, text, options = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return;
  }
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          ...options,
        }),
      }
    );
    
    const data = await response.json();
    console.log("Sent message:", data);
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
}
