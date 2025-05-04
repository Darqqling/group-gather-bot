
// Message handlers for the Telegram bot
import { saveUser, getUserState } from "../utils/databaseUtils.ts";
import { handleCommand } from "../utils/commandHandler.ts";
import { 
  DialogState, 
  resetDialogState 
} from "../utils/dialogStateManager.ts";
import { 
  handleCollectionCreation,
  handlePaymentFlow,
  handleAdminMode
} from "../utils/dialogHandler.ts";

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
