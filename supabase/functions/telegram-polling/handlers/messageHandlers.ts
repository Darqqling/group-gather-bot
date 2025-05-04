
// Message handlers for the Telegram bot
import { saveUser, getUserState } from "../utils/databaseUtils.ts";
import { handleCommand } from "../utils/commandHandler.ts";
import { handleCallbackQuery } from "../utils/callbackHandler.ts";
import { 
  DialogState, 
  resetDialogState 
} from "../utils/dialogStateManager.ts";
import { 
  handleCollectionCreation,
  handlePaymentFlow,
  handleAdminMode
} from "../utils/dialogHandler.ts";
import { sendTelegramMessage } from "../utils/telegramApi.ts";

/**
 * Handle incoming messages from Telegram
 */
export async function handleMessage(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  if (!message || !message.from) {
    console.log("Invalid message format or missing from field");
    return;
  }

  console.log(`Processing message from ${message.from.first_name} (${message.from.id}): ${message.text || "no text"}`);
  
  const userId = message.from.id.toString();
  
  // Сохраняем или обновляем информацию о пользователе
  await saveUser(message.from, supabaseAdmin);
  
  // Проверяем состояние пользователя (находится ли он в диалоге)
  const userState = await getUserState(userId, supabaseAdmin);
  
  // Обрабатываем команды
  if (message.text && message.text.startsWith('/')) {
    return handleCommand(message, supabaseAdmin, sendTelegramMessage);
  }
  
  // Обрабатываем пользователя, который находится в диалоге
  if (userState && userState.state) {
    console.log(`User ${userId} is in state ${userState.state} with data:`, userState.data);
    
    switch (userState.state) {
      case DialogState.CREATING_COLLECTION:
        return handleCollectionCreation(message, userState.data, supabaseAdmin, sendTelegramMessage);
      
      case DialogState.PAYMENT_FLOW:
        return handlePaymentFlow(message, userState.data, supabaseAdmin, sendTelegramMessage);
      
      case DialogState.ADMIN_MODE:
        return handleAdminMode(message, userState.data, supabaseAdmin, sendTelegramMessage);
      
      default:
        // Сбрасываем неизвестное состояние
        await resetDialogState(userId, supabaseAdmin);
    }
  }

  // Стандартный ответ на нераспознанные сообщения
  return sendTelegramMessage(
    message.chat.id,
    "Извините, я не распознал команду. Используйте /start для просмотра доступных команд.",
    {
      reply_markup: JSON.stringify({
        keyboard: [
          [{ text: '/new' }, { text: '/history' }],
          [{ text: '/finish' }, { text: '/cancel' }],
          [{ text: '/paid' }, { text: '/start' }]
        ],
        resize_keyboard: true
      })
    }
  );
}

/**
 * Handle callback queries from Telegram
 */
export function handleCallback(
  callbackQuery: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  if (!callbackQuery) {
    console.log("Invalid callback query format");
    return;
  }
  
  return handleCallbackQuery(callbackQuery, supabaseAdmin, sendTelegramMessage);
}

/**
 * Process Telegram updates using Long Polling
 */
export async function handleTelegramUpdates(supabaseAdmin: any) {
  try {
    console.log("Starting to process Telegram updates...");
    
    // Get bot token from database
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('app_secrets')
      .select('value')
      .eq('key', 'TELEGRAM_BOT_TOKEN')
      .maybeSingle();
    
    if (tokenError || !tokenData) {
      console.error("Failed to get bot token:", tokenError);
      return { 
        success: false, 
        error: "Bot token not configured or could not be retrieved" 
      };
    }
    
    const botToken = tokenData.value;
    
    // Check if maintenance mode is enabled
    const { data: maintenanceData, error: maintenanceError } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle();
    
    const maintenanceMode = maintenanceData?.value === 'true';
    console.log(`Maintenance mode: ${maintenanceMode}`);
    
    // Get the last update ID
    const { data: lastUpdateData, error: updateError } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'telegram_last_update_id')
      .maybeSingle();
    
    if (updateError) {
      console.error("Error getting last update ID:", updateError);
      return { 
        success: false, 
        error: "Could not retrieve last update ID" 
      };
    }
    
    // Default to 0 if no update ID found
    let lastUpdateId = 0;
    if (lastUpdateData && lastUpdateData.value) {
      lastUpdateId = parseInt(lastUpdateData.value, 10);
    }
    
    console.log(`Last update ID: ${lastUpdateId}`);
    
    // Call Telegram API to get updates
    const params = new URLSearchParams({
      offset: (lastUpdateId + 1).toString(),
      limit: '10',
      timeout: '2'
    });
    
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?${params.toString()}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error getting updates from Telegram: ${response.status} ${errorText}`);
      return { 
        success: false, 
        error: `Failed to get updates: ${response.status} ${errorText}`
      };
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      console.error("Error response from Telegram:", data);
      return { 
        success: false, 
        error: `Telegram API error: ${data.description}` 
      };
    }
    
    console.log(`Got ${data.result.length} updates from Telegram`);
    
    // Process each update
    let newLastUpdateId = lastUpdateId;
    
    for (const update of data.result) {
      try {
        // Keep track of the highest update ID
        if (update.update_id > newLastUpdateId) {
          newLastUpdateId = update.update_id;
        }
        
        // Handle the update based on its type
        if (update.message) {
          await handleMessage(
            update.message,
            supabaseAdmin,
            (chatId: number | string, text: string, options = {}) => 
              sendTelegramMessage(chatId, text, { ...options, token: botToken })
          );
        } else if (update.callback_query) {
          await handleCallback(
            update.callback_query,
            supabaseAdmin,
            (chatId: number | string, text: string, options = {}) => 
              sendTelegramMessage(chatId, text, { ...options, token: botToken })
          );
        }
      } catch (updateError) {
        console.error("Error processing update:", updateError);
        // Continue processing other updates
      }
    }
    
    // Save the new last update ID if changed
    if (newLastUpdateId !== lastUpdateId) {
      const { error: saveError } = await supabaseAdmin
        .from('app_settings')
        .upsert({
          key: 'telegram_last_update_id',
          value: newLastUpdateId.toString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      
      if (saveError) {
        console.error("Error saving last update ID:", saveError);
      } else {
        console.log(`Updated last update ID to ${newLastUpdateId}`);
      }
    }
    
    return { 
      success: true, 
      updatesProcessed: data.result.length 
    };
  } catch (error) {
    console.error("Exception in handleTelegramUpdates:", error);
    return { 
      success: false, 
      error: error.message || 'Unknown error processing updates'
    };
  }
}
