import { sendTelegramMessage, answerCallbackQuery } from "../utils/telegramApi.ts";

/**
 * Handle callback queries from Telegram
 */
export async function handleCallbackQuery(callbackQuery: any, sendTelegramMessage: Function, answerCallbackQuery: Function, supabaseAdmin: any) {
  if (!callbackQuery || !callbackQuery.data) {
    console.log("Invalid callback query format or missing data");
    return;
  }

  console.log(`Processing callback query from ${callbackQuery.from.first_name} (${callbackQuery.from.id}): ${callbackQuery.data}`);

  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;

  try {
    switch (data) {
      case "list_collections_to_finish":
        await handleListCollections(chatId, messageId, 'finish', sendTelegramMessage, answerCallbackQuery, supabaseAdmin, callbackQuery.from.id.toString());
        break;
      case "list_collections_to_cancel":
        await handleListCollections(chatId, messageId, 'cancel', sendTelegramMessage, answerCallbackQuery, supabaseAdmin, callbackQuery.from.id.toString());
        break;
      case "list_collections_to_pay":
        await handleListCollections(chatId, messageId, 'pay', sendTelegramMessage, answerCallbackQuery, supabaseAdmin, callbackQuery.from.id.toString());
        break;
      default:
        if (data.startsWith("finish_collection_")) {
          const collectionId = data.split("_")[2];
          await handleFinishCollection(chatId, messageId, collectionId, sendTelegramMessage, answerCallbackQuery, supabaseAdmin);
        } else if (data.startsWith("cancel_collection_")) {
          const collectionId = data.split("_")[2];
          await handleCancelCollection(chatId, messageId, collectionId, sendTelegramMessage, answerCallbackQuery, supabaseAdmin);
        } else if (data.startsWith("pay_collection_")) {
          const collectionId = data.split("_")[2];
          await handlePayCollection(chatId, messageId, collectionId, sendTelegramMessage, answerCallbackQuery, supabaseAdmin, callbackQuery.from.id.toString());
        } else {
          console.log("Unknown callback query data:", data);
          await answerCallbackQuery(callbackQuery.id, "Неизвестный запрос.");
        }
        break;
    }
  } catch (error) {
    console.error("Error handling callback query:", error);
    await sendTelegramMessage(chatId, "Произошла ошибка при обработке запроса.");
    await answerCallbackQuery(callbackQuery.id, "Произошла ошибка.");
  }
}

/**
 * Handle listing collections for finish/cancel/pay actions
 */
async function handleListCollections(chatId: string, messageId: number, action: string, sendTelegramMessage: Function, answerCallbackQuery: Function, supabaseAdmin: any, userId: string) {
  try {
    // Fetch user collections
    const { data: collections, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("creator_id", userId)
      .eq("status", 'active')
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (!collections || collections.length === 0) {
      await sendTelegramMessage(
        chatId,
        "У вас нет активных сборов."
      );
      return;
    }

    let inline_keyboard = [];

    for (const collection of collections) {
      inline_keyboard.push([{
        text: collection.title,
        callback_data: `${action}_collection_${collection.id}`
      }]);
    }

    // Add cancel button
    inline_keyboard.push([{ text: "❌ Отмена", callback_data: "cancel" }]);

    await sendTelegramMessage(
      chatId,
      `Выберите сбор, который хотите ${action === 'finish' ? 'завершить' : action === 'cancel' ? 'отменить' : 'подтвердить оплату'}:`,
      {
        reply_markup: JSON.stringify({
          inline_keyboard
        })
      }
    );

    await answerCallbackQuery(
      { callback_query_id: messageId },
      "Список сборов получен."
    );
  } catch (error) {
    console.error("Error handling list collections:", error);
    await sendTelegramMessage(
      chatId,
      "Произошла ошибка при получении списка сборов. Пожалуйста, попробуйте позже."
    );
    await answerCallbackQuery(
      { callback_query_id: messageId },
      "Произошла ошибка."
    );
  }
}

/**
 * Handle finishing a collection
 */
async function handleFinishCollection(chatId: string, messageId: number, collectionId: string, sendTelegramMessage: Function, answerCallbackQuery: Function, supabaseAdmin: any) {
  try {
    // Update collection status to finished
    const { error } = await supabaseAdmin
      .from("collections")
      .update({ status: 'finished' })
      .eq("id", collectionId);

    if (error) {
      throw error;
    }

    await sendTelegramMessage(
      chatId,
      "Сбор успешно завершен."
    );

    // Edit the original message to remove the keyboard
    await sendTelegramMessage(
      chatId,
      "Сбор успешно завершен.",
      {
        reply_markup: JSON.stringify({
          remove_keyboard: true
        })
      }
    );

    await answerCallbackQuery(
      { callback_query_id: messageId },
      "Сбор успешно завершен."
    );
  } catch (error) {
    console.error("Error handling finish collection:", error);
    await sendTelegramMessage(
      chatId,
      "Произошла ошибка при завершении сбора. Пожалуйста, попробуйте позже."
    );
    await answerCallbackQuery(
      { callback_query_id: messageId },
      "Произошла ошибка."
    );
  }
}

/**
 * Handle cancelling a collection
 */
async function handleCancelCollection(chatId: string, messageId: number, collectionId: string, sendTelegramMessage: Function, answerCallbackQuery: Function, supabaseAdmin: any) {
  try {
    // Update collection status to cancelled
    const { error } = await supabaseAdmin
      .from("collections")
      .update({ status: 'cancelled' })
      .eq("id", collectionId);

    if (error) {
      throw error;
    }

   // Edit the original message to remove the keyboard
    await sendTelegramMessage(
      chatId,
      "Сбор отменен.",
      {
        reply_markup: JSON.stringify({
          remove_keyboard: true
        })
      }
    );

    await answerCallbackQuery(
      { callback_query_id: messageId },
      "Сбор успешно отменен."
    );
  } catch (error) {
    console.error("Error handling cancel collection:", error);
    await sendTelegramMessage(
      chatId,
      "Произошла ошибка при отмене сбора. Пожалуйста, попробуйте позже."
    );
    await answerCallbackQuery(
      { callback_query_id: messageId },
      "Произошла ошибка."
    );
  }
}

/**
 * Handle paying for a collection
 */
async function handlePayCollection(chatId: string, messageId: number, collectionId: string, sendTelegramMessage: Function, answerCallbackQuery: Function, supabaseAdmin: any, userId: string) {
  try {
    // Ask the user to enter the amount they want to pay
    await sendTelegramMessage(
      chatId,
      "Введите сумму, которую вы хотите внести:"
    );

    // Update user state in database to indicate they're entering payment amount
    await supabaseAdmin
      .from("telegram_users")
      .update({
        current_state: "entering_payment_amount",
        state_data: JSON.stringify({ collection_id: collectionId })
      })
      .eq("telegram_id", userId);

    await answerCallbackQuery(
      { callback_query_id: messageId },
      "Ожидаю сумму оплаты."
    );
  } catch (error) {
    console.error("Error handling pay collection:", error);
    await sendTelegramMessage(
      chatId,
      "Произошла ошибка при подтверждении оплаты. Пожалуйста, попробуйте позже."
    );
    await answerCallbackQuery(
      { callback_query_id: messageId },
      "Произошла ошибка."
    );
  }
}
