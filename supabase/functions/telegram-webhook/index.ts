
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
  if (!message || !message.from) {
    console.log("Invalid message format or missing from field");
    return;
  }

  console.log(`Processing message from ${message.from.first_name} (${message.from.id}): ${message.text}`);
  
  // Save or update the user
  await saveUser(message.from);
  
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
  console.log(`Processing command: ${command}`);
  
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

// Command handlers (improved implementations)
async function handleStartCommand(message) {
  console.log(`Sending start command response to ${message.chat.id}`);
  
  try {
    // Add keyboard markup for better UX
    const replyMarkup = {
      keyboard: [
        [{ text: '/new' }, { text: '/history' }],
        [{ text: '/finish' }, { text: '/cancel' }],
        [{ text: '/paid' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    };
    
    await sendTelegramMessage(
      message.chat.id,
      "Добро пожаловать! Я бот для организации сборов средств. Используйте следующие команды:\n\n" +
      "📝 /new - создать новый сбор\n" +
      "✅ /finish - завершить активный сбор\n" +
      "❌ /cancel - отменить активный сбор\n" +
      "💰 /paid - подтвердить оплату\n" +
      "📊 /history - история ваших сборов",
      { reply_markup: JSON.stringify(replyMarkup) }
    );
  } catch (error) {
    console.error("Error handling start command:", error);
  }
}

async function handleNewCommand(message) {
  try {
    // Update user state in database to indicate they're creating a new collection
    await supabaseAdmin
      .from("telegram_users")
      .update({ 
        current_state: "creating_collection",
        state_data: JSON.stringify({ step: "title" })
      })
      .eq("telegram_id", message.from.id.toString());
    
    await sendTelegramMessage(
      message.chat.id,
      "Для создания нового сбора введите название:"
    );
  } catch (error) {
    console.error("Error handling new command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при создании нового сбора. Пожалуйста, попробуйте позже."
    );
  }
}

async function handleFinishCommand(message) {
  await sendTelegramMessage(
    message.chat.id,
    "Выберите сбор, который хотите завершить:",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "Выбрать из списка", callback_data: "list_collections_to_finish" }]
        ]
      })
    }
  );
}

async function handleCancelCommand(message) {
  await sendTelegramMessage(
    message.chat.id,
    "Выберите сбор, который хотите отменить:",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "Выбрать из списка", callback_data: "list_collections_to_cancel" }]
        ]
      })
    }
  );
}

async function handlePaidCommand(message) {
  await sendTelegramMessage(
    message.chat.id,
    "Выберите сбор, для которого хотите подтвердить оплату:",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "Выбрать из списка", callback_data: "list_collections_to_pay" }]
        ]
      })
    }
  );
}

async function handleHistoryCommand(message) {
  try {
    // Fetch user collections
    const { data: collections, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("creator_id", message.from.id.toString())
      .order("created_at", { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!collections || collections.length === 0) {
      await sendTelegramMessage(
        message.chat.id,
        "У вас пока нет созданных сборов."
      );
      return;
    }
    
    let historyText = "📊 *История ваших сборов:*\n\n";
    
    for (const collection of collections) {
      const status = collection.status === 'active' 
        ? '🟢 Активен' 
        : collection.status === 'finished' 
          ? '✅ Завершен' 
          : '❌ Отменен';
      
      historyText += `*${collection.title}*\n`;
      historyText += `Статус: ${status}\n`;
      historyText += `Цель: ${collection.target_amount} ₽\n`;
      historyText += `Собрано: ${collection.current_amount || 0} ₽\n`;
      historyText += `Дедлайн: ${new Date(collection.deadline).toLocaleDateString()}\n\n`;
    }
    
    await sendTelegramMessage(
      message.chat.id,
      historyText,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error handling history command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при получении истории сборов. Пожалуйста, попробуйте позже."
    );
  }
}

// Handle callback queries (for inline buttons)
async function handleCallbackQuery(callbackQuery) {
  console.log("Received callback query:", callbackQuery);
  
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  try {
    if (data.startsWith('list_collections_to_')) {
      // Handle listing collections for various actions
      const action = data.replace('list_collections_to_', '');
      await listCollectionsForAction(chatId, callbackQuery.from.id, action);
    } else if (data.startsWith('select_collection_')) {
      // Handle specific collection selection
      const [, action, collectionId] = data.split('_');
      await handleCollectionAction(chatId, collectionId, action);
    }
    
    // Answer callback query to remove loading state
    await answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error("Error handling callback query:", error);
    await sendTelegramMessage(
      chatId,
      "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже."
    );
  }
}

async function listCollectionsForAction(chatId, userId, action) {
  try {
    const { data: collections, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("creator_id", userId.toString())
      .eq("status", "active");
    
    if (error) throw error;
    
    if (!collections || collections.length === 0) {
      await sendTelegramMessage(
        chatId,
        "У вас нет активных сборов."
      );
      return;
    }
    
    const keyboard = collections.map(collection => {
      return [{
        text: `${collection.title} (${collection.current_amount || 0}/${collection.target_amount} ₽)`,
        callback_data: `select_collection_${action}_${collection.id}`
      }];
    });
    
    await sendTelegramMessage(
      chatId,
      "Выберите сбор из списка:",
      {
        reply_markup: JSON.stringify({
          inline_keyboard: keyboard
        })
      }
    );
  } catch (error) {
    console.error("Error listing collections:", error);
    await sendTelegramMessage(
      chatId,
      "Произошла ошибка при получении списка сборов. Пожалуйста, попробуйте позже."
    );
  }
}

async function handleCollectionAction(chatId, collectionId, action) {
  // This function will handle specific actions on collections
  // Implementation depends on the action (finish, cancel, pay)
  const actionMessages = {
    'finish': "Сбор успешно завершен!",
    'cancel': "Сбор отменен.",
    'pay': "Пожалуйста, укажите сумму, которую вы хотите внести:"
  };
  
  await sendTelegramMessage(chatId, actionMessages[action] || "Действие выполнено.");
}

// Helper function to answer callback query
async function answerCallbackQuery(callbackQueryId, text = "") {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return;
  }
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text
        }),
      }
    );
    
    const data = await response.json();
    console.log("Answered callback query:", data);
    return data;
  } catch (error) {
    console.error("Error answering callback query:", error);
    return null;
  }
}

// Helper function to save/update a user in the database
async function saveUser(user) {
  if (!user || !user.id) {
    console.log("Invalid user object:", user);
    return;
  }
  
  try {
    console.log(`Saving user: ${user.first_name} (ID: ${user.id})`);
    
    const { data, error } = await supabaseAdmin
      .from("telegram_users")
      .upsert({
        telegram_id: user.id.toString(),
        username: user.username || null,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        last_active_at: new Date().toISOString(),
        joined_at: new Date().toISOString() // This will only be used for new records
      }, {
        onConflict: 'telegram_id'  // Specify the conflict column
      })
      .select();
    
    if (error) {
      console.error("Error saving user:", error);
      throw error;
    }
    
    console.log("User saved successfully:", data);
    return data;
  } catch (error) {
    console.error("Exception saving user:", error);
    throw error;
  }
}

// Helper function to send messages via Telegram API
async function sendTelegramMessage(chatId, text, options = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return;
  }
  
  try {
    console.log(`Sending message to chat ${chatId}: ${text.substring(0, 50)}...`);
    
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
    console.log("Message sent response:", data);
    if (!data.ok) {
      console.error("Error from Telegram API:", data.description);
    }
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
}
