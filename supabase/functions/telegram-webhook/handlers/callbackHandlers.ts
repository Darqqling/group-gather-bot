/**
 * Обработчики callback-запросов для Telegram бота
 */

import { 
  DialogState,
  CollectionCreationStep,
  PaymentFlowStep,
  setDialogState,
  resetDialogState,
  getDialogState
} from "../utils/dialogStateManager.ts";
import { 
  getCollection, 
  getUserCollections, 
  updateCollectionStatus,
  getActiveCollections
} from "../utils/collectionUtils.ts";
import { isUserAdmin } from "../utils/databaseUtils.ts";

/**
 * Главный обработчик callback-запросов
 */
export async function handleCallbackQuery(
  callbackQuery: any, 
  supabaseAdmin: any,
  sendTelegramMessage: Function,
  answerCallbackQuery: Function
) {
  try {
    const userId = callbackQuery.from.id.toString();
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    
    console.log(`Processing callback query: ${data} from user ${userId}`);
    
    // Обработка отмены создания сбора
    if (data === 'cancel_creation') {
      await resetDialogState(userId, supabaseAdmin);
      
      await answerCallbackQuery(callbackQuery.id, "Создание сбора отменено");
      
      await sendTelegramMessage(
        chatId,
        "Создание сбора отменено.",
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
      return;
    }
    
    // Обработка отмены платежа
    if (data === 'cancel_payment') {
      await resetDialogState(userId, supabaseAdmin);
      
      await answerCallbackQuery(callbackQuery.id, "Платеж отменен");
      
      await sendTelegramMessage(
        chatId,
        "Платеж отменен.",
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
      return;
    }
    
    // Обработка навигации между шагами создания сбора
    if (data === 'creation_back_to_description') {
      const dialogState = await getDialogState(userId, supabaseAdmin);
      
      if (dialogState.state === DialogState.CREATING_COLLECTION && dialogState.data) {
        console.log("Going back to description step");
        const newStateData = {
          ...dialogState.data,
          step: CollectionCreationStep.DESCRIPTION
        };
        
        await setDialogState(userId, DialogState.CREATING_COLLECTION, newStateData, supabaseAdmin);
        
        await answerCallbackQuery(callbackQuery.id, "Возврат к предыдущему шагу");
        
        await sendTelegramMessage(
          chatId,
          `Текущее описание: "${dialogState.data.description || ''}"\nВведите новое описание:`,
          {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: "Отменить создание", callback_data: "cancel_creation" }]
              ]
            })
          }
        );
      } else {
        await answerCallbackQuery(callbackQuery.id, "Невозможно вернуться: диалог не найден");
        await resetDialogState(userId, supabaseAdmin);
        await sendTelegramMessage(
          chatId, 
          "Произошла ошибка при навигации. Пожалуйста, начните создание сбора заново с команды /new"
        );
      }
      return;
    }
    
    if (data === 'creation_back_to_amount') {
      const dialogState = await getDialogState(userId, supabaseAdmin);
      
      if (dialogState.state === DialogState.CREATING_COLLECTION && dialogState.data) {
        console.log("Going back to amount step");
        const newStateData = {
          ...dialogState.data,
          step: CollectionCreationStep.AMOUNT
        };
        
        await setDialogState(userId, DialogState.CREATING_COLLECTION, newStateData, supabaseAdmin);
        
        await answerCallbackQuery(callbackQuery.id, "Возврат к предыдущему шагу");
        
        await sendTelegramMessage(
          chatId,
          `Текущая сумма: ${dialogState.data.target_amount || 0} руб.\nВведите новую сумму:`,
          {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: "Назад", callback_data: "creation_back_to_description" }],
                [{ text: "Отменить создание", callback_data: "cancel_creation" }]
              ]
            })
          }
        );
      } else {
        await answerCallbackQuery(callbackQuery.id, "Невозможно вернуться: диалог не найден");
        await resetDialogState(userId, supabaseAdmin);
        await sendTelegramMessage(
          chatId, 
          "Произошла ошибка при навигации. Пожалуйста, начните создание сбора заново с команды /new"
        );
      }
      return;
    }
    
    // Обработка выбора сбора для завершения
    if (data.startsWith('finish_select_')) {
      const collectionId = data.replace('finish_select_', '');
      
      try {
        const collection = await getCollection(supabaseAdmin, collectionId);
        
        if (!collection.success || !collection.collection) {
          throw new Error(collection.error || "Сбор не найден");
        }
        
        // Проверка, что пользователь является создателем сбора
        if (collection.collection.creator_id !== userId) {
          await answerCallbackQuery(callbackQuery.id, "Вы не можете завершить чужой сбор", { show_alert: true });
          return;
        }
        
        await answerCallbackQuery(callbackQuery.id);
        
        await sendTelegramMessage(
          chatId,
          `Вы действительно хотите завершить сбор "${collection.collection.title}"?`,
          {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [
                  { text: "Да, завершить", callback_data: `finish_confirm_${collectionId}` },
                  { text: "Нет, отменить", callback_data: "finish_cancel" }
                ]
              ]
            })
          }
        );
      } catch (error) {
        console.error("Error processing finish_select callback:", error);
        await answerCallbackQuery(callbackQuery.id, "Ошибка при выборе сбора", { show_alert: true });
        await sendTelegramMessage(chatId, `❌ Не удалось выбрать сбор: ${error.message || 'Техническая ошибка'}`);
      }
      return;
    }
    
    // Обработка подтверждения завершения сбора
    if (data.startsWith('finish_confirm_')) {
      const collectionId = data.replace('finish_confirm_', '');
      
      try {
        const result = await updateCollectionStatus(supabaseAdmin, collectionId, "finished");
        
        if (!result.success) {
          throw new Error(result.error || "Не удалось обновить статус сбора");
        }
        
        await answerCallbackQuery(callbackQuery.id, "Сбор успешно завершен");
        
        await sendTelegramMessage(
          chatId,
          "✅ Сбор успешно завершен. Участники получат уведомление о завершении сбора."
        );
      } catch (error) {
        console.error("Error processing finish_confirm callback:", error);
        await answerCallbackQuery(callbackQuery.id, "Ошибка при завершении сбора", { show_alert: true });
        await sendTelegramMessage(chatId, `❌ Не удалось завершить сбор: ${error.message || 'Техническая ошибка'}`);
      }
      return;
    }
    
    // Отмена завершения сбора
    if (data === 'finish_cancel') {
      await answerCallbackQuery(callbackQuery.id, "Завершение сбора отменено");
      await sendTelegramMessage(chatId, "Завершение сбора отменено.");
      return;
    }
    
    // Обработка выбора сбора для отмены
    if (data.startsWith('cancel_select_')) {
      const collectionId = data.replace('cancel_select_', '');
      
      try {
        const collection = await getCollection(supabaseAdmin, collectionId);
        
        if (!collection.success || !collection.collection) {
          throw new Error(collection.error || "Сбор не найден");
        }
        
        // Проверка, что пользователь является создателем сбора
        if (collection.collection.creator_id !== userId) {
          await answerCallbackQuery(callbackQuery.id, "Вы не можете отменить чужой сбор", { show_alert: true });
          return;
        }
        
        await answerCallbackQuery(callbackQuery.id);
        
        await sendTelegramMessage(
          chatId,
          `Вы действительно хотите отменить сбор "${collection.collection.title}"?`,
          {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [
                  { text: "Да, отменить", callback_data: `cancel_confirm_${collectionId}` },
                  { text: "Нет", callback_data: "cancel_cancel" }
                ]
              ]
            })
          }
        );
      } catch (error) {
        console.error("Error processing cancel_select callback:", error);
        await answerCallbackQuery(callbackQuery.id, "Ошибка при выборе сбора", { show_alert: true });
        await sendTelegramMessage(chatId, `❌ Не удалось выбрать сбор: ${error.message || 'Техническая ошибка'}`);
      }
      return;
    }
    
    // Обработка подтверждения отмены сбора
    if (data.startsWith('cancel_confirm_')) {
      const collectionId = data.replace('cancel_confirm_', '');
      
      try {
        const result = await updateCollectionStatus(supabaseAdmin, collectionId, "cancelled");
        
        if (!result.success) {
          throw new Error(result.error || "Не удалось обновить статус сбора");
        }
        
        await answerCallbackQuery(callbackQuery.id, "Сбор успешно отменен");
        
        await sendTelegramMessage(
          chatId,
          "✅ Сбор успешно отменен. Участники получат уведомление об отмене сбора."
        );
      } catch (error) {
        console.error("Error processing cancel_confirm callback:", error);
        await answerCallbackQuery(callbackQuery.id, "Ошибка при отмене сбора", { show_alert: true });
        await sendTelegramMessage(chatId, `❌ Не удалось отменить сбор: ${error.message || 'Техническая ошибка'}`);
      }
      return;
    }
    
    // Отмена отмены сбора
    if (data === 'cancel_cancel') {
      await answerCallbackQuery(callbackQuery.id, "Отмена сбора отменена");
      await sendTelegramMessage(chatId, "Отмена сбора отменена.");
      return;
    }
    
    // Обработка выбора сбора для платежа
    if (data.startsWith('paid_select_')) {
      const collectionId = data.replace('paid_select_', '');
      
      try {
        const collection = await getCollection(supabaseAdmin, collectionId);
        
        if (!collection.success || !collection.collection) {
          throw new Error(collection.error || "Сбор не найден");
        }
        
        // Проверяем, что сбор активен
        if (collection.collection.status !== "active") {
          await answerCallbackQuery(callbackQuery.id, "Сбор не является активным", { show_alert: true });
          return;
        }
        
        await setDialogState(userId, DialogState.PAYMENT_FLOW, {
          step: PaymentFlowStep.ENTER_AMOUNT,
          collection_id: collectionId
        }, supabaseAdmin);
        
        await answerCallbackQuery(callbackQuery.id);
        
        await sendTelegramMessage(
          chatId,
          `Вы выбрали сбор "${collection.collection.title}".\n` +
          `Цель: ${collection.collection.target_amount} руб.\n` +
          `Собрано: ${collection.collection.current_amount || 0} руб.\n\n` +
          `Пожалуйста, введите сумму платежа:`,
          {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: "Отменить платеж", callback_data: "cancel_payment" }]
              ]
            })
          }
        );
      } catch (error) {
        console.error("Error processing paid_select callback:", error);
        await answerCallbackQuery(callbackQuery.id, "Ошибка при выборе сбора", { show_alert: true });
        await sendTelegramMessage(chatId, `❌ Не удалось выбрать сбор: ${error.message || 'Техническая ошибка'}`);
      }
      return;
    }
    
    // Административные функции
    if (data.startsWith('admin_')) {
      const isAdmin = await isUserAdmin(userId, supabaseAdmin);
      
      if (!isAdmin) {
        await answerCallbackQuery(callbackQuery.id, "У вас нет доступа к этой функции", { show_alert: true });
        return;
      }
      
      // Обработка запросов администратора
      if (data === 'admin_all_collections') {
        try {
          // Получение всех сборов (без фильтра по пользователю)
          const { data: collections, error } = await supabaseAdmin
            .from("collections")
            .select("*")
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          if (!collections || collections.length === 0) {
            await answerCallbackQuery(callbackQuery.id, "Сборов не найдено");
            await sendTelegramMessage(chatId, "В системе пока нет сборов.");
            return;
          }
          
          // Группировка сборов по статусу для лучшей читаемости
          const activeCollections = collections.filter(c => c.status === "active");
          const finishedCollections = collections.filter(c => c.status === "finished");
          const cancelledCollections = collections.filter(c => c.status === "cancelled");
          
          let message = "📊 *Все сборы в системе:*\n\n";
          
          if (activeCollections.length > 0) {
            message += "🟢 *Активные сборы:*\n";
            activeCollections.forEach((c, i) => {
              message += `${i + 1}. "${c.title}" - ${c.current_amount || 0}/${c.target_amount} руб.\n`;
            });
            message += "\n";
          }
          
          if (finishedCollections.length > 0) {
            message += "✅ *Завершенные сборы:*\n";
            finishedCollections.forEach((c, i) => {
              message += `${i + 1}. "${c.title}" - ${c.current_amount || 0}/${c.target_amount} руб.\n`;
            });
            message += "\n";
          }
          
          if (cancelledCollections.length > 0) {
            message += "❌ *Отмененные сборы:*\n";
            cancelledCollections.forEach((c, i) => {
              message += `${i + 1}. "${c.title}" - ${c.current_amount || 0}/${c.target_amount} руб.\n`;
            });
          }
          
          await answerCallbackQuery(callbackQuery.id);
          
          await sendTelegramMessage(
            chatId,
            message,
            { parse_mode: "Markdown" }
          );
        } catch (error) {
          console.error("Error getting all collections:", error);
          await answerCallbackQuery(callbackQuery.id, "Ошибка при получении списка сборов", { show_alert: true });
          await sendTelegramMessage(chatId, `❌ Не удалось получить список сборов: ${error.message || 'Техническая ошибка'}`);
        }
        return;
      }
      
      if (data === 'admin_change_status') {
        try {
          // Получение всех сборов
          const { data: collections, error } = await supabaseAdmin
            .from("collections")
            .select("id, title, status")
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          if (!collections || collections.length === 0) {
            await answerCallbackQuery(callbackQuery.id, "Сборов не найдено");
            await sendTelegramMessage(chatId, "В системе пока нет сборов для изменения статуса.");
            return;
          }
          
          const inlineKeyboard = collections.map(collection => {
            const statusEmoji = collection.status === 'active' ? '🟢' : 
                              collection.status === 'finished' ? '✅' : '❌';
            
            return [{
              text: `${statusEmoji} ${collection.title} (${collection.status})`,
              callback_data: `admin_status_collection_${collection.id}`
            }];
          });
          
          await answerCallbackQuery(callbackQuery.id);
          
          await sendTelegramMessage(
            chatId,
            "Выберите сбор для изменения статуса:",
            {
              reply_markup: JSON.stringify({
                inline_keyboard: [
                  ...inlineKeyboard,
                  [{ text: "Отмена", callback_data: "admin_cancel" }]
                ]
              })
            }
          );
        } catch (error) {
          console.error("Error getting collections for status change:", error);
          await answerCallbackQuery(callbackQuery.id, "Ошибка при получении списка сборов", { show_alert: true });
          await sendTelegramMessage(chatId, `❌ Не удалось получить список сборов: ${error.message || 'Техническая ошибка'}`);
        }
        return;
      }
      
      if (data.startsWith('admin_status_collection_')) {
        const collectionId = data.replace('admin_status_collection_', '');
        
        try {
          const collection = await getCollection(supabaseAdmin, collectionId);
          
          if (!collection.success || !collection.collection) {
            throw new Error(collection.error || "Сбор не найден");
          }
          
          await answerCallbackQuery(callbackQuery.id);
          
          await sendTelegramMessage(
            chatId,
            `Выберите новый статус для сбора "${collection.collection.title}" (текущий: ${collection.collection.status}):`,
            {
              reply_markup: JSON.stringify({
                inline_keyboard: [
                  [{ text: "Активный", callback_data: `admin_set_status_${collectionId}_active` }],
                  [{ text: "Завершен", callback_data: `admin_set_status_${collectionId}_finished` }],
                  [{ text: "От��енен", callback_data: `admin_set_status_${collectionId}_cancelled` }],
                  [{ text: "Назад", callback_data: "admin_change_status" }]
                ]
              })
            }
          );
        } catch (error) {
          console.error("Error getting collection for status change:", error);
          await answerCallbackQuery(callbackQuery.id, "Ошибка при получении данных сбора", { show_alert: true });
          await sendTelegramMessage(chatId, `❌ Не удалось получить данные сбора: ${error.message || 'Техническая ошибка'}`);
        }
        return;
      }
      
      if (data.startsWith('admin_set_status_')) {
        const [_, __, collectionId, newStatus] = data.split('_');
        
        try {
          const result = await updateCollectionStatus(supabaseAdmin, collectionId, newStatus);
          
          if (!result.success) {
            throw new Error(result.error || "Не удалось обновить статус сбора");
          }
          
          await answerCallbackQuery(callbackQuery.id, `Статус сбора изменен на "${newStatus}"`);
          
          await sendTelegramMessage(
            chatId,
            `✅ Статус сбора успешно изменен на "${newStatus}".`,
            {
              reply_markup: JSON.stringify({
                inline_keyboard: [
                  [{ text: "К списку сборов", callback_data: "admin_change_status" }],
                  [{ text: "В меню администратора", callback_data: "admin_menu" }]
                ]
              })
            }
          );
        } catch (error) {
          console.error("Error changing collection status:", error);
          await answerCallbackQuery(callbackQuery.id, "Ошибка при изменении статуса", { show_alert: true });
          await sendTelegramMessage(chatId, `❌ Не удалось изменить статус сбора: ${error.message || 'Техническая ошибка'}`);
        }
        return;
      }
      
      if (data === 'admin_maintenance_on' || data === 'admin_maintenance_off') {
        try {
          const maintenanceMode = data === 'admin_maintenance_on';
          
          // Обновляем настройку режима обслуживания
          const { error } = await supabaseAdmin
            .from('app_settings')
            .upsert({
              key: 'maintenance_mode',
              value: maintenanceMode ? 'true' : 'false',
              description: 'Maintenance mode'
            }, { onConflict: 'key' });
          
          if (error) throw error;
          
          await answerCallbackQuery(callbackQuery.id);
          
          await sendTelegramMessage(
            chatId,
            `✅ Режим обслуживания ${maintenanceMode ? 'включен' : 'выключен'}.`,
            {
              reply_markup: JSON.stringify({
                inline_keyboard: [
                  [{ text: "В меню администратора", callback_data: "admin_menu" }]
                ]
              })
            }
          );
        } catch (error) {
          console.error("Error changing maintenance mode:", error);
          await answerCallbackQuery(callbackQuery.id, "Ошибка при изменении режима обслуживания", { show_alert: true });
          await sendTelegramMessage(
            chatId,
            `❌ Не удалось изменить режим обслуживания: ${error.message || 'Техническая ошибка'}`
          );
        }
        return;
      }
      
      if (data === 'admin_menu') {
        // Создаем клавиатуру с административными командами
        const adminKeyboard = {
          inline_keyboard: [
            [
              { text: "Все сборы", callback_data: "admin_all_collections" },
              { text: "Изменить статус", callback_data: "admin_change_status" }
            ],
            [
              { text: "Техобслуживание ВКЛ", callback_data: "admin_maintenance_on" },
              { text: "Техобслуживание ВЫКЛ", callback_data: "admin_maintenance_off" }
            ]
          ]
        };
        
        await answerCallbackQuery(callbackQuery.id);
        
        await sendTelegramMessage(
          chatId,
          "👑 *Режим администратора*\n\nВыберите действие:",
          {
            parse_mode: "Markdown",
            reply_markup: JSON.stringify(adminKeyboard)
          }
        );
        return;
      }
      
      if (data === 'admin_cancel') {
        await answerCallbackQuery(callbackQuery.id, "Операция отменена");
        await sendTelegramMessage(chatId, "Операция отменена.");
        return;
      }
    }
    
    // Для неизвестных данных callback
    await answerCallbackQuery(callbackQuery.id, "Неизвестный запрос");
    console.warn("Unknown callback data:", data);
    
  } catch (error) {
    console.error("Error handling callback query:", error);
    
    try {
      await answerCallbackQuery(callbackQuery.id, "Произошла ошибка", { show_alert: true });
      await sendTelegramMessage(callbackQuery.message.chat.id, "❌ Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.");
    } catch (sendError) {
      console.error("Error sending error message:", sendError);
    }
  }
}
