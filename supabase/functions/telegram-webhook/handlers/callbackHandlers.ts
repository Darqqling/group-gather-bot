
// Callback handlers for the Telegram bot
import { updateUserState, clearUserState } from "../utils/databaseUtils.ts";

/**
 * Handle callback queries from button presses in the bot interface
 */
export async function handleCallbackQuery(
  callbackQuery: any,
  sendTelegramMessage: Function,
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  try {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const callbackData = callbackQuery.data;
    
    console.log(`Processing callback from ${callbackQuery.from.id}: ${callbackData}`);
    
    // Handle different callback data
    if (callbackData.startsWith("finish_collection:")) {
      await handleFinishCollectionCallback(callbackData, chatId, callbackQuery, sendTelegramMessage, answerCallbackQuery, supabaseAdmin);
    } 
    else if (callbackData.startsWith("cancel_collection:")) {
      await handleCancelCollectionCallback(callbackData, chatId, callbackQuery, sendTelegramMessage, answerCallbackQuery, supabaseAdmin);
    }
    else if (callbackData.startsWith("select_cancel:")) {
      await handleSelectCancelCallback(callbackData, chatId, callbackQuery, sendTelegramMessage, answerCallbackQuery, supabaseAdmin);
    }
    else if (callbackData === "cancel_operation") {
      await answerCallbackQuery(callbackQuery.id, "Операция отменена");
      await sendTelegramMessage(chatId, "Операция отменена.");
    }
    else if (callbackData.startsWith("select_payment:")) {
      await handleSelectPaymentCallback(callbackData, chatId, callbackQuery, sendTelegramMessage, answerCallbackQuery, supabaseAdmin);
    }
    else if (callbackData.startsWith("confirm_payment:")) {
      await handleConfirmPaymentCallback(callbackData, chatId, callbackQuery, sendTelegramMessage, answerCallbackQuery, supabaseAdmin);
    }
    else if (callbackData.startsWith("admin_")) {
      await handleAdminCallback(callbackData, chatId, callbackQuery, sendTelegramMessage, answerCallbackQuery, supabaseAdmin);
    }
    else {
      await answerCallbackQuery(callbackQuery.id, "Неизвестное действие");
      console.log(`Unknown callback data: ${callbackData}`);
    }
  } catch (error) {
    console.error("Error handling callback query:", error);
    await answerCallbackQuery(callbackQuery.id, "Произошла ошибка");
  }
}

async function handleFinishCollectionCallback(
  callbackData: string,
  chatId: number,
  callbackQuery: any,
  sendTelegramMessage: Function,
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  try {
    const collectionId = callbackData.split(":")[1];
    
    // Update collection status
    const { data, error } = await supabaseAdmin
      .from("collections")
      .update({ 
        status: "finished",
        last_updated_at: new Date().toISOString()
      })
      .eq("id", collectionId)
      .eq("creator_id", callbackQuery.from.id.toString()) // Ensure user owns this collection
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    await answerCallbackQuery(callbackQuery.id, "Сбор успешно завершен");
    await sendTelegramMessage(chatId, `✅ Сбор "${data.title}" успешно завершен!`);
    
    // Notify all participants
    // This will be implemented in a separate task for notifications
  } catch (error) {
    console.error("Error handling finish collection callback:", error);
    await answerCallbackQuery(callbackQuery.id, "Произошла ошибка");
    await sendTelegramMessage(chatId, "Произошла ошибка при завершении сбора. Пожалуйста, попробуйте позже.");
  }
}

async function handleSelectCancelCallback(
  callbackData: string,
  chatId: number,
  callbackQuery: any,
  sendTelegramMessage: Function,
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  try {
    const collectionId = callbackData.split(":")[1];
    
    // Get collection info
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select("title")
      .eq("id", collectionId)
      .single();
    
    if (error) {
      throw error;
    }
    
    await answerCallbackQuery(callbackQuery.id);
    
    // Ask for confirmation
    await sendTelegramMessage(
      chatId,
      `Вы действительно хотите отменить сбор "${data.title}"?`,
      {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              { text: "Да, отменить", callback_data: `cancel_collection:${collectionId}` },
              { text: "Нет", callback_data: "cancel_operation" }
            ]
          ]
        })
      }
    );
  } catch (error) {
    console.error("Error handling select cancel callback:", error);
    await answerCallbackQuery(callbackQuery.id, "Произошла ошибка");
    await sendTelegramMessage(chatId, "Произошла ошибка. Пожалуйста, попробуйте позже.");
  }
}

async function handleCancelCollectionCallback(
  callbackData: string,
  chatId: number,
  callbackQuery: any,
  sendTelegramMessage: Function,
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  try {
    const collectionId = callbackData.split(":")[1];
    
    // Update collection status
    const { data, error } = await supabaseAdmin
      .from("collections")
      .update({ 
        status: "cancelled",
        last_updated_at: new Date().toISOString()
      })
      .eq("id", collectionId)
      .eq("creator_id", callbackQuery.from.id.toString()) // Ensure user owns this collection
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    await answerCallbackQuery(callbackQuery.id, "Сбор отменен");
    await sendTelegramMessage(chatId, `❌ Сбор "${data.title}" отменен.`);
    
    // Notify all participants
    // This will be implemented in a separate task for notifications
  } catch (error) {
    console.error("Error handling cancel collection callback:", error);
    await answerCallbackQuery(callbackQuery.id, "Произошла ошибка");
    await sendTelegramMessage(chatId, "Произошла ошибка при отмене сбора. Пожалуйста, попробуйте позже.");
  }
}

async function handleSelectPaymentCallback(
  callbackData: string,
  chatId: number,
  callbackQuery: any,
  sendTelegramMessage: Function,
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  try {
    const collectionId = callbackData.split(":")[1];
    
    // Get collection info
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Set user state for amount input
    await updateUserState(
      callbackQuery.from.id.toString(),
      "payment_amount",
      { collection_id: collectionId },
      supabaseAdmin
    );
    
    await answerCallbackQuery(callbackQuery.id);
    await sendTelegramMessage(
      chatId,
      `Вы выбрали сбор "${data.title}"\n\nЦель: ${data.target_amount} ₽\nСобрано: ${data.current_amount || 0} ₽\n\nПожалуйста, введите сумму оплаты:`
    );
  } catch (error) {
    console.error("Error handling select payment callback:", error);
    await answerCallbackQuery(callbackQuery.id, "Произошла ошибка");
    await sendTelegramMessage(chatId, "Произошла ошибка. Пожалуйста, попробуйте позже.");
  }
}

async function handleConfirmPaymentCallback(
  callbackData: string,
  chatId: number,
  callbackQuery: any,
  sendTelegramMessage: Function,
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  try {
    const parts = callbackData.split(":");
    const paymentId = parts[1];
    const action = parts[2]; // confirm or reject
    
    if (action === "confirm") {
      // Update payment status
      const { data: payment, error } = await supabaseAdmin
        .from("payments")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString()
        })
        .eq("id", paymentId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update collection amount
      const { error: updateError } = await supabaseAdmin.rpc(
        "update_collection_amount", 
        { 
          p_collection_id: payment.collection_id, 
          p_amount: payment.amount 
        }
      );
      
      if (updateError) {
        throw updateError;
      }
      
      await answerCallbackQuery(callbackQuery.id, "Платеж подтвержден");
      await sendTelegramMessage(chatId, `✅ Платеж на сумму ${payment.amount} ₽ подтвержден.`);
      
      // Notify the participant
      const { data: userData } = await supabaseAdmin
        .from("telegram_users")
        .select("telegram_id")
        .eq("id", payment.user_id)
        .single();
        
      if (userData) {
        await sendTelegramMessage(
          userData.telegram_id,
          `✅ Ваш платеж на сумму ${payment.amount} ₽ был подтвержден организатором.`
        );
      }
    } else if (action === "reject") {
      // Delete the payment
      const { data: payment, error } = await supabaseAdmin
        .from("payments")
        .delete()
        .eq("id", paymentId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      await answerCallbackQuery(callbackQuery.id, "Платеж отклонен");
      await sendTelegramMessage(chatId, `❌ Платеж на сумму ${payment.amount} ₽ отклонен.`);
      
      // Notify the participant
      const { data: userData } = await supabaseAdmin
        .from("telegram_users")
        .select("telegram_id")
        .eq("id", payment.user_id)
        .single();
        
      if (userData) {
        await sendTelegramMessage(
          userData.telegram_id,
          `❌ Ваш платеж на сумму ${payment.amount} ₽ был отклонен организатором.`
        );
      }
    }
  } catch (error) {
    console.error("Error handling confirm payment callback:", error);
    await answerCallbackQuery(callbackQuery.id, "Произошла ошибка");
    await sendTelegramMessage(chatId, "Произошла ошибка при обработке платежа. Пожалуйста, попробуйте позже.");
  }
}

async function handleAdminCallback(
  callbackData: string,
  chatId: number,
  callbackQuery: any,
  sendTelegramMessage: Function,
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  try {
    const action = callbackData.split("_")[1];
    
    // Check if user is an admin
    const isAdmin = await checkIfAdmin(callbackQuery.from.id.toString(), supabaseAdmin);
    
    if (!isAdmin) {
      await answerCallbackQuery(callbackQuery.id, "У вас нет прав для этого действия");
      await sendTelegramMessage(chatId, "У вас нет прав для использования этой команды.");
      return;
    }
    
    switch (action) {
      case "maintenance":
        await handleMaintenanceMode(chatId, callbackQuery, sendTelegramMessage, answerCallbackQuery, supabaseAdmin);
        break;
      case "stats":
        await handleAdminStats(chatId, callbackQuery, sendTelegramMessage, answerCallbackQuery, supabaseAdmin);
        break;
      default:
        await answerCallbackQuery(callbackQuery.id, "Неизвестное действие");
        console.log(`Unknown admin action: ${action}`);
    }
  } catch (error) {
    console.error("Error handling admin callback:", error);
    await answerCallbackQuery(callbackQuery.id, "Произошла ошибка");
    await sendTelegramMessage(chatId, "Произошла ошибка. Пожалуйста, попробуйте позже.");
  }
}

async function handleMaintenanceMode(
  chatId: number,
  callbackQuery: any,
  sendTelegramMessage: Function,
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  try {
    // Get current maintenance status
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value, description")
      .eq("key", "maintenance_mode")
      .single();
    
    const isEnabled = data?.value === "true" || data?.value === true;
    const message = data?.description || "Бот временно находится в режиме обслуживания. Пожалуйста, попробуйте позже.";
    
    // Show maintenance settings
    await answerCallbackQuery(callbackQuery.id);
    await sendTelegramMessage(
      chatId,
      `Текущий статус режима обслуживания: ${isEnabled ? "🟢 Включен" : "🔴 Выключен"}\n\nТекущее сообщение:\n${message}`,
      {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              { 
                text: isEnabled ? "🔴 Выключить" : "🟢 Включить", 
                callback_data: `admin_toggle_maintenance:${!isEnabled}`
              }
            ],
            [
              { text: "✏️ Изменить сообщение", callback_data: "admin_edit_maintenance_msg" }
            ],
            [
              { text: "« Назад", callback_data: "admin_back" }
            ]
          ]
        })
      }
    );
  } catch (error) {
    console.error("Error handling maintenance mode:", error);
    await sendTelegramMessage(chatId, "Произошла ошибка при получении настроек режима обслуживания.");
  }
}

async function handleAdminStats(
  chatId: number,
  callbackQuery: any,
  sendTelegramMessage: Function,
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  try {
    // Get statistics
    const [users, collections, payments] = await Promise.all([
      supabaseAdmin.from("telegram_users").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("collections").select("status"),
      supabaseAdmin.from("payments").select("amount, status")
    ]);
    
    const activeCollections = collections.data.filter(c => c.status === "active").length;
    const finishedCollections = collections.data.filter(c => c.status === "finished").length;
    const cancelledCollections = collections.data.filter(c => c.status === "cancelled").length;
    
    const pendingPayments = payments.data.filter(p => p.status === "pending").length;
    const confirmedPayments = payments.data.filter(p => p.status === "confirmed").length;
    
    const totalAmount = payments.data
      .filter(p => p.status === "confirmed")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const statsMessage = 
      "📊 *Статистика бота*\n\n" +
      `👥 Пользователей: ${users.count || 0}\n\n` +
      "🗂 *Сборы:*\n" +
      `▫️ Активных: ${activeCollections}\n` +
      `▫️ Завершенных: ${finishedCollections}\n` +
      `▫️ Отмененных: ${cancelledCollections}\n\n` +
      "💰 *Платежи:*\n" +
      `▫️ Ожидающих подтверждения: ${pendingPayments}\n` +
      `▫️ Подтвержденных: ${confirmedPayments}\n` +
      `▫️ Общая сумма: ${totalAmount} ₽`;
    
    await answerCallbackQuery(callbackQuery.id);
    await sendTelegramMessage(
      chatId,
      statsMessage,
      {
        parse_mode: "Markdown",
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              { text: "« Назад", callback_data: "admin_back" }
            ]
          ]
        })
      }
    );
  } catch (error) {
    console.error("Error handling admin stats:", error);
    await sendTelegramMessage(chatId, "Произошла ошибка при получении статистики.");
  }
}

// Utility to check if user is an admin (placeholder)
async function checkIfAdmin(telegramId: string, supabaseAdmin: any): Promise<boolean> {
  // This is a placeholder. In a real application, you would check against a list of admin IDs
  // or a flag in your database
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "admin_telegram_ids")
    .single();
    
  if (error || !data) {
    console.error("Error checking admin status:", error);
    return false;
  }
  
  try {
    const adminIds = JSON.parse(data.value);
    return Array.isArray(adminIds) && adminIds.includes(telegramId);
  } catch (e) {
    console.error("Error parsing admin IDs:", e);
    return false;
  }
}
