
// Callback query handlers for the Telegram bot
import { updateCollectionStatus } from "../utils/collectionUtils.ts";
import { updateUserState, getUserState } from "../utils/databaseUtils.ts";

/**
 * Handle callback queries from inline keyboards
 */
export async function handleCallbackQuery(
  callbackQuery: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function,
  answerCallbackQuery: Function
) {
  if (!callbackQuery || !callbackQuery.data) {
    console.log("Invalid callback query format or missing data");
    return;
  }

  const data = callbackQuery.data;
  const userId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message.chat.id;
  
  console.log(`Processing callback query from ${userId}: ${data}`);
  
  try {
    // Handle finishing a collection
    if (data.startsWith('finish_select_')) {
      const collectionId = data.replace('finish_select_', '');
      
      // Update collection status to finished
      const result = await updateCollectionStatus(supabaseAdmin, collectionId, 'finished');
      
      if (result.success) {
        await answerCallbackQuery(callbackQuery.id, "Сбор завершен успешно!");
        
        return sendTelegramMessage(
          chatId,
          "Сбор успешно завершен. Больше взносы не принимаются."
        );
      } else {
        await answerCallbackQuery(callbackQuery.id, "Ошибка при завершении сбора", { show_alert: true });
        
        return sendTelegramMessage(
          chatId,
          "Произошла ошибка при завершении сбора. Пожалуйста, попробуйте позже."
        );
      }
    }
    
    // Handle cancelling a collection
    else if (data.startsWith('cancel_select_')) {
      const collectionId = data.replace('cancel_select_', '');
      
      // Update collection status to cancelled
      const result = await updateCollectionStatus(supabaseAdmin, collectionId, 'cancelled');
      
      if (result.success) {
        await answerCallbackQuery(callbackQuery.id, "Сбор отменен");
        
        return sendTelegramMessage(
          chatId,
          "Сбор успешно отменен. Больше взносы не принимаются."
        );
      } else {
        await answerCallbackQuery(callbackQuery.id, "Ошибка при отмене сбора", { show_alert: true });
        
        return sendTelegramMessage(
          chatId,
          "Произошла ошибка при отмене сбора. Пожалуйста, попробуйте позже."
        );
      }
    }
    
    // Handle payment to a collection
    else if (data.startsWith('paid_select_')) {
      const collectionId = data.replace('paid_select_', '');
      
      // Set user state to payment_amount with collection ID
      await updateUserState(userId, "payment_amount", { collection_id: collectionId }, supabaseAdmin);
      
      await answerCallbackQuery(callbackQuery.id, "Укажите сумму платежа");
      
      return sendTelegramMessage(
        chatId,
        "Введите сумму вашего взноса (только число):"
      );
    }
    
    // Unknown callback data
    else {
      console.log(`Unknown callback data: ${data}`);
      return answerCallbackQuery(callbackQuery.id, "Неизвестная команда");
    }
  } catch (error) {
    console.error("Error handling callback query:", error);
    
    await answerCallbackQuery(callbackQuery.id, "Произошла ошибка", { show_alert: true });
    
    return sendTelegramMessage(
      chatId,
      "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже."
    );
  }
}
