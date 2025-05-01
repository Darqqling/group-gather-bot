
// Callback query handlers for the Telegram bot

/**
 * List collections for a specific action (finish, cancel, pay)
 */
export async function listCollectionsForAction(chatId: number, userId: number, action: string, sendTelegramMessage: Function, supabaseAdmin: any) {
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

/**
 * Handle action on a collection (finish, cancel, pay)
 */
export async function handleCollectionAction(chatId: number, collectionId: string, action: string, sendTelegramMessage: Function) {
  // This function will handle specific actions on collections
  // Implementation depends on the action (finish, cancel, pay)
  const actionMessages = {
    'finish': "Сбор успешно завершен!",
    'cancel': "Сбор отменен.",
    'pay': "Пожалуйста, укажите сумму, которую вы хотите внести:"
  };
  
  await sendTelegramMessage(chatId, actionMessages[action] || "Действие выполнено.");
}

/**
 * Main handler for callback queries
 */
export async function handleCallbackQuery(
  callbackQuery: any, 
  sendTelegramMessage: Function, 
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  console.log("Received callback query:", callbackQuery);
  
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  try {
    if (data.startsWith('list_collections_to_')) {
      // Handle listing collections for various actions
      const action = data.replace('list_collections_to_', '');
      await listCollectionsForAction(chatId, callbackQuery.from.id, action, sendTelegramMessage, supabaseAdmin);
    } else if (data.startsWith('select_collection_')) {
      // Handle specific collection selection
      const [, action, collectionId] = data.split('_');
      await handleCollectionAction(chatId, collectionId, action, sendTelegramMessage);
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
