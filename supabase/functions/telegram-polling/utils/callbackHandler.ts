
/**
 * Обработчик callback-запросов для Telegram бота
 */

import { 
  getCollectionContext, 
  setCollectionContext, 
  clearCollectionContext 
} from "./dialogStateManager.ts";
import { getCollection } from "./collectionUtils.ts";
import { handleCommand } from "./commandHandler.ts";

/**
 * Обработать callback-запрос
 */
export async function handleCallbackQuery(
  callbackQuery: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  try {
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id.toString();
    const chatId = callbackQuery.message.chat.id;
    
    console.log(`Processing callback query from ${userId}: ${data}`);
    
    // Обработка callback для выбора контекста
    if (data.startsWith('select_context_')) {
      return handleContextSelection(callbackQuery, supabaseAdmin, sendTelegramMessage);
    }
    
    // Здесь обработка других типов callback-запросов
    
    // По умолчанию просто отправляем ответ, что запрос получен
    return sendTelegramMessage(
      chatId,
      `Получен callback-запрос: ${data}`
    );
  } catch (error) {
    console.error("Error handling callback query:", error);
    return sendTelegramMessage(
      callbackQuery.message.chat.id,
      "Произошла ошибка при обработке запроса."
    );
  }
}

/**
 * Обработка callback-запроса для выбора контекста
 */
export async function handleContextSelection(
  callbackQuery: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const data = callbackQuery.data; // Формат: select_context_[collectionId]_for_[command]
  const parts = data.split('_');
  
  if (parts.length < 5) {
    return sendTelegramMessage(
      callbackQuery.message.chat.id,
      "Неверный формат запроса. Пожалуйста, попробуйте снова."
    );
  }
  
  const collectionId = parts[2];
  const command = '/' + parts[4]; // Восстанавливаем команду с префиксом /
  
  // Получаем информацию о сборе
  const collectionResult = await getCollection(supabaseAdmin, collectionId);
  
  if (!collectionResult.success || !collectionResult.collection) {
    return sendTelegramMessage(
      callbackQuery.message.chat.id,
      "Не удалось найти выбранный сбор. Возможно, он был удален."
    );
  }
  
  const collection = collectionResult.collection;
  
  // Устанавливаем контекст сбора для пользователя
  await setCollectionContext(
    callbackQuery.from.id.toString(),
    {
      collectionId: collection.id,
      status: collection.status,
      title: collection.title
    },
    supabaseAdmin
  );
  
  // Отвечаем на callback-запрос (убираем кнопки из сообщения)
  try {
    await sendTelegramMessage(
      callbackQuery.message.chat.id,
      `Выбран сбор "${collection.title}". Выполняю команду ${command}...`,
      { 
        reply_markup: JSON.stringify({ inline_keyboard: [] }),
        message_id: callbackQuery.message.message_id,
        edit: true 
      }
    );
  } catch (error) {
    console.error("Error updating message:", error);
  }
  
  // Создаем имитацию сообщения для обработки команды
  const simulatedMessage = {
    message_id: callbackQuery.message.message_id,
    from: callbackQuery.from,
    chat: callbackQuery.message.chat,
    date: Math.floor(Date.now() / 1000),
    text: command
  };
  
  // Обрабатываем команду с установленным контекстом
  return handleCommand(simulatedMessage, supabaseAdmin, sendTelegramMessage);
}
