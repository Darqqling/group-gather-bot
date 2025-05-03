
// Handlers for Telegram callback queries
import { updateCollectionStatus, getCollectionById, recordPayment } from "../utils/collectionUtils.ts";

/**
 * Handle callback queries from Telegram inline keyboards
 */
export async function handleCallbackQuery(
  callbackQuery: any, 
  sendTelegramMessage: Function,
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  if (!callbackQuery || !callbackQuery.data) {
    console.log("Invalid callback query format or missing data");
    return;
  }

  console.log(`Processing callback query: ${callbackQuery.data}`);
  
  const userId = callbackQuery.from.id.toString();
  const data = callbackQuery.data;
  
  try {
    // Process collection finish callbacks
    if (data.startsWith("finish_confirm_")) {
      const collectionId = data.replace("finish_confirm_", "");
      
      // Get collection details
      const result = await getCollectionById(supabaseAdmin, collectionId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const collection = result.collection;
      
      // Verify user owns this collection
      if (collection.creator_id !== userId) {
        await answerCallbackQuery(callbackQuery.id, "Вы не можете завершить этот сбор, так как не являетесь его создателем.");
        return;
      }
      
      // Update collection status
      const updateResult = await updateCollectionStatus(supabaseAdmin, collectionId, "finished");
      
      if (updateResult.success) {
        await answerCallbackQuery(callbackQuery.id, "Сбор успешно завершен");
        await sendTelegramMessage(
          callbackQuery.message.chat.id,
          `Сбор "${collection.title}" успешно завершён.`
        );
      } else {
        throw new Error(updateResult.error);
      }
    } 
    // Process collection finish selection (for multiple collections)
    else if (data.startsWith("finish_select_")) {
      const collectionId = data.replace("finish_select_", "");
      
      // Get collection details
      const result = await getCollectionById(supabaseAdmin, collectionId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const collection = result.collection;
      
      // Ask for confirmation
      await answerCallbackQuery(callbackQuery.id);
      await sendTelegramMessage(
        callbackQuery.message.chat.id,
        `Вы хотите завершить сбор "${collection.title}"?`,
        {
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                { text: "Да, завершить", callback_data: `finish_confirm_${collection.id}` },
                { text: "Нет", callback_data: "finish_cancel" }
              ]
            ]
          })
        }
      );
    } 
    // Cancel collection finish
    else if (data === "finish_cancel") {
      await answerCallbackQuery(callbackQuery.id, "Операция отменена");
      await sendTelegramMessage(
        callbackQuery.message.chat.id,
        "Операция завершения сбора отменена."
      );
    } 
    // Process collection cancel callbacks
    else if (data.startsWith("cancel_confirm_")) {
      const collectionId = data.replace("cancel_confirm_", "");
      
      // Get collection details
      const result = await getCollectionById(supabaseAdmin, collectionId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const collection = result.collection;
      
      // Verify user owns this collection
      if (collection.creator_id !== userId) {
        await answerCallbackQuery(callbackQuery.id, "Вы не можете отменить этот сбор, так как не являетесь его создателем.");
        return;
      }
      
      // Update collection status
      const updateResult = await updateCollectionStatus(supabaseAdmin, collectionId, "cancelled");
      
      if (updateResult.success) {
        await answerCallbackQuery(callbackQuery.id, "Сбор успешно отменен");
        await sendTelegramMessage(
          callbackQuery.message.chat.id,
          `Сбор "${collection.title}" был отменён.`
        );
      } else {
        throw new Error(updateResult.error);
      }
    } 
    // Process collection cancel selection
    else if (data.startsWith("cancel_select_")) {
      const collectionId = data.replace("cancel_select_", "");
      
      // Get collection details
      const result = await getCollectionById(supabaseAdmin, collectionId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const collection = result.collection;
      
      // Ask for confirmation
      await answerCallbackQuery(callbackQuery.id);
      await sendTelegramMessage(
        callbackQuery.message.chat.id,
        `Вы хотите отменить сбор "${collection.title}"?`,
        {
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                { text: "Да, отменить", callback_data: `cancel_confirm_${collection.id}` },
                { text: "Нет", callback_data: "cancel_cancel" }
              ]
            ]
          })
        }
      );
    } 
    // Cancel collection cancellation
    else if (data === "cancel_cancel") {
      await answerCallbackQuery(callbackQuery.id, "Операция отменена");
      await sendTelegramMessage(
        callbackQuery.message.chat.id,
        "Операция отмены сбора отменена."
      );
    }
    // Process payment callbacks
    else if (data.startsWith("paid_confirm_")) {
      const collectionId = data.replace("paid_confirm_", "");
      
      // Store collection ID in user state for amount input
      await supabaseAdmin
        .from("telegram_users")
        .update({ 
          current_state: "payment_amount",
          state_data: JSON.stringify({ collection_id: collectionId })
        })
        .eq("telegram_id", userId);
      
      await answerCallbackQuery(callbackQuery.id);
      await sendTelegramMessage(
        callbackQuery.message.chat.id,
        "Введите сумму вашего взноса"
      );
    }
    // Process payment selection
    else if (data.startsWith("paid_select_")) {
      const collectionId = data.replace("paid_select_", "");
      
      // Get collection details
      const result = await getCollectionById(supabaseAdmin, collectionId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const collection = result.collection;
      
      // Ask for confirmation
      await answerCallbackQuery(callbackQuery.id);
      await sendTelegramMessage(
        callbackQuery.message.chat.id,
        `Вы хотите внести платеж в сбор "${collection.title}"?`,
        {
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                { text: "Да", callback_data: `paid_confirm_${collection.id}` },
                { text: "Нет", callback_data: "paid_cancel" }
              ]
            ]
          })
        }
      );
    }
    // Cancel payment
    else if (data === "paid_cancel") {
      await answerCallbackQuery(callbackQuery.id, "Операция отменена");
      await sendTelegramMessage(
        callbackQuery.message.chat.id,
        "Операция внесения платежа отменена."
      );
    }
    else {
      await answerCallbackQuery(callbackQuery.id, "Неизвестная команда");
    }
  } catch (error) {
    console.error("Error handling callback query:", error);
    await answerCallbackQuery(callbackQuery.id, "Произошла ошибка при обработке запроса");
    await sendTelegramMessage(
      callbackQuery.message.chat.id,
      "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже."
    );
  }
}
