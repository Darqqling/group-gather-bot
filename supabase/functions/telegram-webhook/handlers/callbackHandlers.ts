
// Обработчики callback-запросов для Telegram бота
import {
  updateCollectionStatus,
  getCollectionById,
  getCollectionPayments
} from "../utils/collectionUtils.ts";
import {
  DialogState,
  PaymentFlowStep,
  PaymentFlowData,
  setDialogState,
  resetDialogState
} from "../utils/dialogStateManager.ts";
import { isUserAdmin } from "../utils/databaseUtils.ts";

/**
 * Обработать входящие callback запросы
 */
export async function handleCallbackQuery(
  callbackQuery: any,
  supabaseAdmin: any,
  sendMessage: Function,
  answerCallbackQuery: Function
) {
  if (!callbackQuery || !callbackQuery.data) {
    console.log("Invalid callback query format");
    return;
  }

  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;
  const userId = callbackQuery.from.id.toString();
  const data = callbackQuery.data;
  
  console.log(`Processing callback query: ${data} from user ${userId}`);
  
  try {
    // Завершение сбора
    if (data.startsWith('finish_select_')) {
      const collectionId = data.replace('finish_select_', '');
      return handleFinishSelection(collectionId, userId, chatId, messageId, callbackQuery.id, supabaseAdmin, sendMessage, answerCallbackQuery);
    }
    
    // Отмена сбора
    if (data.startsWith('cancel_select_')) {
      const collectionId = data.replace('cancel_select_', '');
      return handleCancelSelection(collectionId, userId, chatId, messageId, callbackQuery.id, supabaseAdmin, sendMessage, answerCallbackQuery);
    }
    
    // Выбор сбора для платежа
    if (data.startsWith('paid_select_')) {
      const collectionId = data.replace('paid_select_', '');
      return handlePaidSelection(collectionId, userId, chatId, messageId, callbackQuery.id, supabaseAdmin, sendMessage, answerCallbackQuery);
    }
    
    // Админские действия
    if (data.startsWith('admin_')) {
      return handleAdminAction(data, userId, chatId, messageId, callbackQuery.id, supabaseAdmin, sendMessage, answerCallbackQuery);
    }
    
    // Подтверждение действий
    if (data.startsWith('confirm_')) {
      return handleConfirmation(data, userId, chatId, messageId, callbackQuery.id, supabaseAdmin, sendMessage, answerCallbackQuery);
    }
    
    // Отмена действий
    if (data === 'cancel_action') {
      await resetDialogState(userId, supabaseAdmin);
      
      // Редактируем сообщение, убирая кнопки
      await sendMessage(
        chatId,
        "Действие отменено.",
        {
          message_id: messageId,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify({
            inline_keyboard: []
          })
        }
      );
      
      return answerCallbackQuery(callbackQuery.id);
    }
    
    // Неизвестный callback
    console.log(`Unknown callback data: ${data}`);
    return answerCallbackQuery(callbackQuery.id, "Неизвестное действие");
    
  } catch (error) {
    console.error("Error processing callback query:", error);
    
    // Сбрасываем состояние пользователя
    await resetDialogState(userId, supabaseAdmin);
    
    await answerCallbackQuery(callbackQuery.id, "Произошла ошибка при обработке действия");
    
    return sendMessage(
      chatId,
      "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз."
    );
  }
}

/**
 * Обработать выбор сбора для завершения
 */
async function handleFinishSelection(
  collectionId: string,
  userId: string,
  chatId: number,
  messageId: number,
  callbackQueryId: string,
  supabaseAdmin: any,
  sendMessage: Function,
  answerCallbackQuery: Function
) {
  // Получаем информацию о сборе
  const collection = await getCollectionById(collectionId, supabaseAdmin);
  
  if (!collection) {
    await answerCallbackQuery(callbackQueryId, "Сбор не найден");
    return sendMessage(chatId, "Выбранный сбор не найден.");
  }
  
  // Проверяем, что пользователь является создателем сбора или админом
  const isCreator = collection.creator_id === userId;
  const isAdmin = await isUserAdmin(userId, supabaseAdmin);
  
  if (!isCreator && !isAdmin) {
    await answerCallbackQuery(callbackQueryId, "Нет доступа");
    return sendMessage(chatId, "У вас нет прав для завершения этого сбора.");
  }
  
  // Проверяем, что сбор активен
  if (collection.status !== "active") {
    await answerCallbackQuery(callbackQueryId, "Сбор уже завершен");
    return sendMessage(chatId, "Этот сбор уже завершен или отменен.");
  }
  
  // Предлагаем подтверждение
  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ Да, завершить", callback_data: `confirm_finish_${collectionId}` },
        { text: "❌ Отмена", callback_data: "cancel_action" }
      ]
    ]
  };
  
  // Отвечаем на callback query
  await answerCallbackQuery(callbackQueryId);
  
  // Редактируем сообщение с подтверждением
  return sendMessage(
    chatId,
    `Вы уверены, что хотите завершить сбор "${collection.title}"?\n\n` +
    `Текущая сумма: ${collection.current_amount || 0}/${collection.target_amount} руб.`,
    {
      message_id: messageId,
      reply_markup: JSON.stringify(keyboard)
    }
  );
}

/**
 * Обработать выбор сбора для отмены
 */
async function handleCancelSelection(
  collectionId: string,
  userId: string,
  chatId: number,
  messageId: number,
  callbackQueryId: string,
  supabaseAdmin: any,
  sendMessage: Function,
  answerCallbackQuery: Function
) {
  // Получаем информацию о сборе
  const collection = await getCollectionById(collectionId, supabaseAdmin);
  
  if (!collection) {
    await answerCallbackQuery(callbackQueryId, "Сбор не найден");
    return sendMessage(chatId, "Выбранный сбор не найден.");
  }
  
  // Проверяем, что пользователь является создателем сбора или админом
  const isCreator = collection.creator_id === userId;
  const isAdmin = await isUserAdmin(userId, supabaseAdmin);
  
  if (!isCreator && !isAdmin) {
    await answerCallbackQuery(callbackQueryId, "Нет доступа");
    return sendMessage(chatId, "У вас нет прав для отмены этого сбора.");
  }
  
  // Проверяем, что сбор активен
  if (collection.status !== "active") {
    await answerCallbackQuery(callbackQueryId, "Сбор уже завершен");
    return sendMessage(chatId, "Этот сбор уже завершен или отменен.");
  }
  
  // Предлагаем подтверждение
  const keyboard = {
    inline_keyboard: [
      [
        { text: "❌ Да, отменить", callback_data: `confirm_cancel_${collectionId}` },
        { text: "↩️ Отмена", callback_data: "cancel_action" }
      ]
    ]
  };
  
  // Отвечаем на callback query
  await answerCallbackQuery(callbackQueryId);
  
  // Редактируем сообщение с подтверждением
  return sendMessage(
    chatId,
    `Вы уверены, что хотите отменить сбор "${collection.title}"?\n\n` +
    `Текущая сумма: ${collection.current_amount || 0}/${collection.target_amount} руб.`,
    {
      message_id: messageId,
      reply_markup: JSON.stringify(keyboard)
    }
  );
}

/**
 * Обработать выбор сбора для платежа
 */
async function handlePaidSelection(
  collectionId: string,
  userId: string,
  chatId: number,
  messageId: number,
  callbackQueryId: string,
  supabaseAdmin: any,
  sendMessage: Function,
  answerCallbackQuery: Function
) {
  // Получаем информацию о сборе
  const collection = await getCollectionById(collectionId, supabaseAdmin);
  
  if (!collection) {
    await answerCallbackQuery(callbackQueryId, "Сбор не найден");
    return sendMessage(chatId, "Выбранный сбор не найден.");
  }
  
  // Проверяем, что сбор активен
  if (collection.status !== "active") {
    await answerCallbackQuery(callbackQueryId, "Сбор не активен");
    return sendMessage(chatId, "Этот сбор уже завершен или отменен.");
  }
  
  // Устанавливаем состояние для ввода суммы платежа
  const paymentData: PaymentFlowData = {
    step: PaymentFlowStep.ENTER_AMOUNT,
    collection_id: collectionId
  };
  
  await setDialogState(userId, DialogState.PAYMENT_FLOW, paymentData, supabaseAdmin);
  
  // Отвечаем на callback query
  await answerCallbackQuery(callbackQueryId);
  
  // Отправляем сообщение с запросом суммы
  return sendMessage(
    chatId,
    `Вы выбрали сбор "${collection.title}".\n\n` +
    `Текущая сумма: ${collection.current_amount || 0}/${collection.target_amount} руб.\n\n` +
    "Пожалуйста, введите сумму вашего взноса (только число):"
  );
}

/**
 * Обработать админские действия
 */
async function handleAdminAction(
  action: string,
  userId: string,
  chatId: number,
  messageId: number,
  callbackQueryId: string,
  supabaseAdmin: any,
  sendMessage: Function,
  answerCallbackQuery: Function
) {
  // Проверяем, является ли пользователь админом
  const isAdmin = await isUserAdmin(userId, supabaseAdmin);
  
  if (!isAdmin) {
    await answerCallbackQuery(callbackQueryId, "Нет доступа");
    return sendMessage(chatId, "У вас нет прав для выполнения этого действия.");
  }
  
  // Обрабатываем различные админские действия
  if (action === 'admin_all_collections') {
    return await handleAdminAllCollections(userId, chatId, messageId, callbackQueryId, supabaseAdmin, sendMessage, answerCallbackQuery);
  }
  
  if (action === 'admin_change_status') {
    return await handleAdminChangeStatus(userId, chatId, messageId, callbackQueryId, supabaseAdmin, sendMessage, answerCallbackQuery);
  }
  
  if (action === 'admin_maintenance_on') {
    return await handleMaintenanceMode(true, userId, chatId, messageId, callbackQueryId, supabaseAdmin, sendMessage, answerCallbackQuery);
  }
  
  if (action === 'admin_maintenance_off') {
    return await handleMaintenanceMode(false, userId, chatId, messageId, callbackQueryId, supabaseAdmin, sendMessage, answerCallbackQuery);
  }
  
  // Неизвестное действие
  await answerCallbackQuery(callbackQueryId, "Неизвестное действие");
  
  return sendMessage(
    chatId,
    "Неизвестное действие. Пожалуйста, используйте команду /admin для доступа к административным функциям."
  );
}

/**
 * Показать все сборы (админ)
 */
async function handleAdminAllCollections(
  userId: string,
  chatId: number,
  messageId: number,
  callbackQueryId: string,
  supabaseAdmin: any,
  sendMessage: Function,
  answerCallbackQuery: Function
) {
  try {
    // Получаем все сборы
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select(`
        id, 
        title, 
        creator_id, 
        target_amount, 
        current_amount, 
        status, 
        deadline,
        telegram_users!collections_creator_id_fkey (
          telegram_id,
          first_name,
          last_name,
          username
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10); // Ограничиваем 10 последними сборами
    
    if (error) {
      console.error("Error fetching collections:", error);
      await answerCallbackQuery(callbackQueryId, "Ошибка получения данных");
      return sendMessage(chatId, "Произошла ошибка при получении списка сборов.");
    }
    
    if (!data || data.length === 0) {
      await answerCallbackQuery(callbackQueryId);
      return sendMessage(chatId, "Нет доступных сборов.");
    }
    
    // Форматируем список сборов для отображения
    const collectionsText = data.map((collection, index) => {
      const status = {
        active: "🟢 Активен",
        finished: "✅ Завершен",
        cancelled: "❌ Отменен"
      }[collection.status] || collection.status;
      
      const deadline = new Date(collection.deadline).toLocaleDateString('ru-RU');
      const creator = collection.telegram_users || {};
      const creatorName = creator.first_name || creator.username || "Неизвестный";
      
      return `${index + 1}. *${collection.title}*\n` +
        `Статус: ${status}\n` +
        `Сумма: ${collection.current_amount || 0}/${collection.target_amount} руб.\n` +
        `Дедлайн: ${deadline}\n` +
        `Организатор: ${creatorName}\n`;
    }).join("\n");
    
    // Создаем клавиатуру для возврата к админ-панели
    const keyboard = {
      inline_keyboard: [
        [{ text: "◀️ Назад к админ-панели", callback_data: "admin_back" }]
      ]
    };
    
    await answerCallbackQuery(callbackQueryId);
    
    return sendMessage(
      chatId,
      `*Все сборы (последние 10):*\n\n${collectionsText}`,
      {
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: JSON.stringify(keyboard)
      }
    );
    
  } catch (error) {
    console.error("Error handling admin_all_collections:", error);
    await answerCallbackQuery(callbackQueryId, "Произошла ошибка");
    
    return sendMessage(
      chatId,
      "Произошла ошибка при получении списка сборов."
    );
  }
}

/**
 * Изменение статуса сбора (админ)
 */
async function handleAdminChangeStatus(
  userId: string,
  chatId: number,
  messageId: number,
  callbackQueryId: string,
  supabaseAdmin: any,
  sendMessage: Function,
  answerCallbackQuery: Function
) {
  try {
    // Получаем все сборы
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select(`
        id, 
        title, 
        current_amount, 
        target_amount,
        status
      `)
      .order("created_at", { ascending: false })
      .limit(10); // Ограничиваем 10 последними сборами
    
    if (error) {
      console.error("Error fetching collections:", error);
      await answerCallbackQuery(callbackQueryId, "Ошибка получения данных");
      return sendMessage(chatId, "Произошла ошибка при получении списка сборов.");
    }
    
    if (!data || data.length === 0) {
      await answerCallbackQuery(callbackQueryId);
      return sendMessage(chatId, "Нет доступных сборов для изменения статуса.");
    }
    
    // Создаем инлайн клавиатуру со списком сборов
    const inlineKeyboard = data.map(collection => {
      const statusEmoji = {
        active: "🟢",
        finished: "✅",
        cancelled: "❌"
      }[collection.status] || "❓";
      
      return [{
        text: `${statusEmoji} ${collection.title} (${collection.current_amount || 0}/${collection.target_amount} руб)`,
        callback_data: `admin_change_status_${collection.id}`
      }];
    });
    
    // Добавляем кнопку возврата
    inlineKeyboard.push([{ text: "◀️ Назад к админ-панели", callback_data: "admin_back" }]);
    
    await answerCallbackQuery(callbackQueryId);
    
    return sendMessage(
      chatId,
      "Выберите сбор для изменения статуса:",
      {
        message_id: messageId,
        reply_markup: JSON.stringify({ inline_keyboard: inlineKeyboard })
      }
    );
    
  } catch (error) {
    console.error("Error handling admin_change_status:", error);
    await answerCallbackQuery(callbackQueryId, "Произошла ошибка");
    
    return sendMessage(
      chatId,
      "Произошла ошибка при получении списка сборов."
    );
  }
}

/**
 * Управление режимом техобслуживания
 */
async function handleMaintenanceMode(
  enable: boolean,
  userId: string,
  chatId: number,
  messageId: number,
  callbackQueryId: string,
  supabaseAdmin: any,
  sendMessage: Function,
  answerCallbackQuery: Function
) {
  try {
    // Обновляем настройку maintenance_mode
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({
        key: "maintenance_mode",
        value: enable ? "true" : "false",
        description: "Включен ли режим технического обслуживания",
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    
    if (error) {
      console.error("Error updating maintenance mode:", error);
      await answerCallbackQuery(callbackQueryId, "Ошибка обновления настройки");
      return sendMessage(chatId, "Произошла ошибка при изменении режима техобслуживания.");
    }
    
    await answerCallbackQuery(callbackQueryId, enable ? "Режим техобслуживания включен" : "Режим техобслуживания выключен");
    
    // Обновляем сообщение для техобслуживания
    if (enable) {
      // Создаем клавиатуру для ввода сообщения техобслуживания
      const keyboard = {
        inline_keyboard: [
          [{ text: "Использовать стандартное сообщение", callback_data: "admin_maintenance_default_msg" }],
          [{ text: "◀️ Назад к админ-панели", callback_data: "admin_back" }]
        ]
      };
      
      return sendMessage(
        chatId,
        "✅ Режим технического обслуживания *включен*.\n\n" +
        "Вы можете использовать стандартное сообщение или ввести свое, отправив текст следующим сообщением.",
        {
          message_id: messageId,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify(keyboard)
        }
      );
    } else {
      // Создаем клавиатуру для возврата к админке
      const keyboard = {
        inline_keyboard: [
          [{ text: "◀️ Назад к админ-панели", callback_data: "admin_back" }]
        ]
      };
      
      return sendMessage(
        chatId,
        "✅ Режим технического обслуживания *отключен*.\n\nБот снова доступен для всех пользователей.",
        {
          message_id: messageId,
          parse_mode: "Markdown",
          reply_markup: JSON.stringify(keyboard)
        }
      );
    }
    
  } catch (error) {
    console.error("Error handling maintenance mode:", error);
    await answerCallbackQuery(callbackQueryId, "Произошла ошибка");
    
    return sendMessage(
      chatId,
      "Произошла ошибка при изменении режима техобслуживания."
    );
  }
}

/**
 * Обработать подтверждения действий
 */
async function handleConfirmation(
  data: string,
  userId: string,
  chatId: number,
  messageId: number,
  callbackQueryId: string,
  supabaseAdmin: any,
  sendMessage: Function,
  answerCallbackQuery: Function
) {
  // Подтверждение завершения сбора
  if (data.startsWith('confirm_finish_')) {
    const collectionId = data.replace('confirm_finish_', '');
    
    // Обновляем статус сбора
    const result = await updateCollectionStatus(supabaseAdmin, collectionId, "finished");
    
    if (!result.success) {
      await answerCallbackQuery(callbackQueryId, "Ошибка обновления статуса");
      return sendMessage(chatId, `Ошибка завершения сбора: ${result.error}`);
    }
    
    await answerCallbackQuery(callbackQueryId, "Сбор успешно завершен");
    
    // Получаем информацию о платежах
    const payments = await getCollectionPayments(collectionId, supabaseAdmin);
    const participantsCount = payments ? payments.length : 0;
    
    // Получаем информацию о сборе
    const collection = await getCollectionById(collectionId, supabaseAdmin);
    
    // Редактируем сообщение
    return sendMessage(
      chatId,
      `✅ Сбор "${collection?.title}" успешно завершен.\n\n` +
      `Итоговая сумма: ${collection?.current_amount || 0}/${collection?.target_amount} руб.\n` +
      `Количество участников: ${participantsCount}`,
      {
        message_id: messageId,
        reply_markup: JSON.stringify({ inline_keyboard: [] })
      }
    );
  }
  
  // Подтверждение отмены сбора
  if (data.startsWith('confirm_cancel_')) {
    const collectionId = data.replace('confirm_cancel_', '');
    
    // Обновляем статус сбора
    const result = await updateCollectionStatus(supabaseAdmin, collectionId, "cancelled");
    
    if (!result.success) {
      await answerCallbackQuery(callbackQueryId, "Ошибка обновления статуса");
      return sendMessage(chatId, `Ошибка отмены сбора: ${result.error}`);
    }
    
    await answerCallbackQuery(callbackQueryId, "Сбор успешно отменен");
    
    // Получаем информацию о сборе
    const collection = await getCollectionById(collectionId, supabaseAdmin);
    
    // Редактируем сообщение
    return sendMessage(
      chatId,
      `❌ Сбор "${collection?.title}" успешно отменен.`,
      {
        message_id: messageId,
        reply_markup: JSON.stringify({ inline_keyboard: [] })
      }
    );
  }
  
  // Неизвестное подтверждение
  await answerCallbackQuery(callbackQueryId, "Неизвестное действие");
  
  return sendMessage(
    chatId,
    "Неизвестное действие. Пожалуйста, попробуйте еще раз.",
    {
      message_id: messageId,
      reply_markup: JSON.stringify({ inline_keyboard: [] })
    }
  );
}
