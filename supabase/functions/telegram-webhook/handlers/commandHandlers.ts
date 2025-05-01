// Command handlers and related utilities for the Telegram bot
import { updateUserState, clearUserState, getUserInfo } from "../utils/databaseUtils.ts";

/**
 * Handle the /start command
 */
export async function handleStartCommand(message: any, sendTelegramMessage: Function) {
  console.log(`Sending start command response to ${message.chat.id}`);
  
  try {
    // Add keyboard markup for better UX
    const replyMarkup = {
      keyboard: [
        [{ text: '/new' }, { text: '/history' }],
        [{ text: '/finish' }, { text: '/cancel' }],
        [{ text: '/paid' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    };
    
    await sendTelegramMessage(
      message.chat.id,
      "Добро пожаловать! Я бот для организации сборов средств. Используйте следующие команды:\n\n" +
      "📝 /new - создать новый сбор\n" +
      "✅ /finish - завершить активный сбор\n" +
      "❌ /cancel - отменить активный сбор\n" +
      "💰 /paid - подтвердить оплату\n" +
      "📊 /history - история ваших сборов",
      { reply_markup: JSON.stringify(replyMarkup) }
    );
  } catch (error) {
    console.error("Error handling start command:", error);
  }
}

/**
 * Handle the /new command
 */
export async function handleNewCommand(message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // Update user state in database to indicate they're creating a new collection
    const success = await updateUserState(
      message.from.id.toString(), 
      "creating_collection", 
      { step: "title" },
      supabaseAdmin
    );
    
    if (!success) {
      throw new Error("Failed to update user state");
    }
    
    await sendTelegramMessage(
      message.chat.id,
      "Для создания нового сбора введите название:"
    );
  } catch (error) {
    console.error("Error handling new command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при создании нового сбора. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Handle the /finish command
 */
export async function handleFinishCommand(message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // Get user's collections
    const { data: collections, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("creator_id", message.from.id.toString())
      .eq("status", "active");
    
    if (error) {
      throw error;
    }
    
    if (!collections || collections.length === 0) {
      await sendTelegramMessage(
        message.chat.id,
        "У вас нет активных сборов, которые можно завершить."
      );
      return;
    }
    
    // If there's only one active collection, finish it directly
    if (collections.length === 1) {
      const collection = collections[0];
      await finishCollection(collection.id, message, sendTelegramMessage, supabaseAdmin);
      return;
    }
    
    // Otherwise, let the user choose which collection to finish
    const keyboard = collections.map(collection => [
      { text: collection.title, callback_data: `finish_collection:${collection.id}` }
    ]);
    
    await sendTelegramMessage(
      message.chat.id,
      "Выберите сбор, который хотите завершить:",
      {
        reply_markup: JSON.stringify({
          inline_keyboard: keyboard
        })
      }
    );
  } catch (error) {
    console.error("Error handling finish command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при обработке команды. Пожалуйста, попробуйте позже."
    );
  }
}

async function finishCollection(collectionId: string, message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // Update collection status
    const { data: collection, error } = await supabaseAdmin
      .from("collections")
      .update({ 
        status: "finished",
        last_updated_at: new Date().toISOString()
      })
      .eq("id", collectionId)
      .eq("creator_id", message.from.id.toString()) // Ensure user owns this collection
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    await sendTelegramMessage(
      message.chat.id,
      `✅ Сбор "${collection.title}" успешно завершен!`
    );
    
    // Notify all participants
    // This will be implemented in a separate task for notifications
  } catch (error) {
    console.error("Error finishing collection:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при завершении сбора. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Handle the /cancel command
 */
export async function handleCancelCommand(message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // Get user's collections
    const { data: collections, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("creator_id", message.from.id.toString())
      .eq("status", "active");
    
    if (error) {
      throw error;
    }
    
    if (!collections || collections.length === 0) {
      await sendTelegramMessage(
        message.chat.id,
        "У вас нет активных сборов, которые можно отменить."
      );
      return;
    }
    
    // If there's only one active collection, ask for confirmation
    if (collections.length === 1) {
      const collection = collections[0];
      
      await sendTelegramMessage(
        message.chat.id,
        `Вы действительно хотите отменить сбор "${collection.title}"?`,
        {
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [
                { text: "Да, отменить", callback_data: `cancel_collection:${collection.id}` },
                { text: "Нет", callback_data: "cancel_operation" }
              ]
            ]
          })
        }
      );
      return;
    }
    
    // Otherwise, let the user choose which collection to cancel
    const keyboard = collections.map(collection => [
      { text: collection.title, callback_data: `select_cancel:${collection.id}` }
    ]);
    
    await sendTelegramMessage(
      message.chat.id,
      "Выберите сбор, который хотите отменить:",
      {
        reply_markup: JSON.stringify({
          inline_keyboard: keyboard
        })
      }
    );
  } catch (error) {
    console.error("Error handling cancel command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при обработке команды. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Handle the /paid command
 */
export async function handlePaidCommand(message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // Get active collections that the user can contribute to
    const { data: collections, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("status", "active");
    
    if (error) {
      throw error;
    }
    
    if (!collections || collections.length === 0) {
      await sendTelegramMessage(
        message.chat.id,
        "В данный момент нет активных сборов, к которым вы можете присоединиться."
      );
      return;
    }
    
    // Let the user choose a collection to pay for
    const keyboard = collections.map(collection => [
      { text: collection.title, callback_data: `select_payment:${collection.id}` }
    ]);
    
    await sendTelegramMessage(
      message.chat.id,
      "Выберите сбор, для которого хотите подтвердить оплату:",
      {
        reply_markup: JSON.stringify({
          inline_keyboard: keyboard
        })
      }
    );
  } catch (error) {
    console.error("Error handling paid command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при обработке команды. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Handle the /history command
 */
export async function handleHistoryCommand(message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // Fetch user collections
    const { data: collections, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("creator_id", message.from.id.toString())
      .order("created_at", { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!collections || collections.length === 0) {
      await sendTelegramMessage(
        message.chat.id,
        "У вас пока нет созданных сборов."
      );
      return;
    }
    
    let historyText = "📊 *История ваших сборов:*\n\n";
    
    for (const collection of collections) {
      const status = collection.status === 'active' 
        ? '🟢 Активен' 
        : collection.status === 'finished' 
          ? '✅ Завершен' 
          : '❌ Отменен';
      
      historyText += `*${collection.title}*\n`;
      historyText += `Статус: ${status}\n`;
      historyText += `Цель: ${collection.target_amount} ₽\n`;
      historyText += `Собрано: ${collection.current_amount || 0} ₽\n`;
      historyText += `Дедлайн: ${new Date(collection.deadline).toLocaleDateString()}\n\n`;
    }
    
    await sendTelegramMessage(
      message.chat.id,
      historyText,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error handling history command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при получении истории сборов. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Handle the /admin command (restricted to admin users)
 */
export async function handleAdminCommand(message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // Check if user is an admin (you would need an admins list or flag in db)
    const isAdmin = await checkIfAdmin(message.from.id.toString(), supabaseAdmin);
    
    if (!isAdmin) {
      await sendTelegramMessage(
        message.chat.id,
        "У вас нет прав для использования этой команды."
      );
      return;
    }
    
    // Present admin menu
    await sendTelegramMessage(
      message.chat.id,
      "Панель администратора:",
      {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: "Режим обслуживания", callback_data: "admin_maintenance" }],
            [{ text: "Статистика", callback_data: "admin_stats" }]
          ]
        })
      }
    );
  } catch (error) {
    console.error("Error handling admin command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при обработке команды. Пожалуйста, попробуйте позже."
    );
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

/**
 * Handle commands router
 */
export function handleCommand(message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  const command = message.text.split(' ')[0].toLowerCase();
  console.log(`Processing command: ${command}`);
  
  switch (command) {
    case '/start':
      return handleStartCommand(message, sendTelegramMessage);
    case '/new':
      return handleNewCommand(message, sendTelegramMessage, supabaseAdmin);
    case '/finish':
      return handleFinishCommand(message, sendTelegramMessage, supabaseAdmin);
    case '/cancel':
      return handleCancelCommand(message, sendTelegramMessage, supabaseAdmin);
    case '/paid':
      return handlePaidCommand(message, sendTelegramMessage, supabaseAdmin);
    case '/history':
      return handleHistoryCommand(message, sendTelegramMessage, supabaseAdmin);
    case '/admin':
      return handleAdminCommand(message, sendTelegramMessage, supabaseAdmin);
    default:
      return sendTelegramMessage(
        message.chat.id,
        "Извините, я не распознал команду. Используйте /start, /new, /finish, /cancel, /paid, /history."
      );
  }
}
