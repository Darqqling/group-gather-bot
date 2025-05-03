
// Command handlers and related utilities for the Telegram bot
import { getUserCollections, updateCollectionStatus } from "../utils/collectionUtils.ts";

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
      "Добро пожаловать! Доступные команды: /new, /finish, /cancel, /paid, /history, /help",
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
    await supabaseAdmin
      .from("telegram_users")
      .update({ 
        current_state: "creating_collection",
        state_data: JSON.stringify({ step: "title" })
      })
      .eq("telegram_id", message.from.id.toString());
    
    await sendTelegramMessage(
      message.chat.id,
      "Введите название сбора"
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
    const userId = message.from.id.toString();
    
    // Get user's active collections
    const result = await getUserCollections(supabaseAdmin, userId, "active");
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    const collections = result.collections || [];
    
    if (collections.length === 0) {
      await sendTelegramMessage(
        message.chat.id,
        "У вас нет активных сборов, которые можно завершить."
      );
      return;
    }
    
    if (collections.length === 1) {
      // Only one collection, ask for confirmation
      const collection = collections[0];
      
      await sendTelegramMessage(
        message.chat.id,
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
    } else {
      // Multiple collections, show list
      let message = "Выберите сбор для завершения:";
      const inlineKeyboard = collections.map((collection, index) => {
        return [{ text: `${index + 1}. ${collection.title}`, callback_data: `finish_select_${collection.id}` }];
      });
      
      await sendTelegramMessage(
        message.chat.id,
        message,
        {
          reply_markup: JSON.stringify({
            inline_keyboard: inlineKeyboard
          })
        }
      );
    }
  } catch (error) {
    console.error("Error handling finish command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при получении списка сборов. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Handle the /cancel command
 */
export async function handleCancelCommand(message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    const userId = message.from.id.toString();
    
    // Get user's active collections
    const result = await getUserCollections(supabaseAdmin, userId, "active");
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    const collections = result.collections || [];
    
    if (collections.length === 0) {
      await sendTelegramMessage(
        message.chat.id,
        "У вас нет активных сборов, которые можно отменить."
      );
      return;
    }
    
    if (collections.length === 1) {
      // Only one collection, ask for confirmation
      const collection = collections[0];
      
      await sendTelegramMessage(
        message.chat.id,
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
    } else {
      // Multiple collections, show list
      let message = "Выберите сбор для отмены:";
      const inlineKeyboard = collections.map((collection, index) => {
        return [{ text: `${index + 1}. ${collection.title}`, callback_data: `cancel_select_${collection.id}` }];
      });
      
      await sendTelegramMessage(
        message.chat.id,
        message,
        {
          reply_markup: JSON.stringify({
            inline_keyboard: inlineKeyboard
          })
        }
      );
    }
  } catch (error) {
    console.error("Error handling cancel command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при получении списка сборов. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Handle the /paid command
 */
export async function handlePaidCommand(message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // Get all active collections (not just user's own)
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
        "В данный момент нет активных сборов, в которые можно внести средства."
      );
      return;
    }
    
    if (collections.length === 1) {
      // Only one collection, ask for confirmation
      const collection = collections[0];
      
      await sendTelegramMessage(
        message.chat.id,
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
    } else {
      // Multiple collections, show list
      let message = "Выберите сбор для подтверждения оплаты:";
      const inlineKeyboard = collections.map((collection, index) => {
        return [{ text: `${index + 1}. ${collection.title}`, callback_data: `paid_select_${collection.id}` }];
      });
      
      await sendTelegramMessage(
        message.chat.id,
        message,
        {
          reply_markup: JSON.stringify({
            inline_keyboard: inlineKeyboard
          })
        }
      );
    }
  } catch (error) {
    console.error("Error handling paid command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при получении списка сборов. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Handle the /confirm command (for organizers to confirm payments)
 */
export async function handleConfirmCommand(message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    const userId = message.from.id.toString();
    
    // Get collections created by the user
    const result = await getUserCollections(supabaseAdmin, userId, "active");
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    const collections = result.collections || [];
    
    if (collections.length === 0) {
      await sendTelegramMessage(
        message.chat.id,
        "У вас нет активных сборов, для которых можно подтвердить платежи."
      );
      return;
    }
    
    // Show list of collections
    let messageText = "Выберите сбор для подтверждения платежей:";
    const inlineKeyboard = collections.map((collection, index) => {
      return [{ text: `${index + 1}. ${collection.title}`, callback_data: `confirm_select_${collection.id}` }];
    });
    
    await sendTelegramMessage(
      message.chat.id,
      messageText,
      {
        reply_markup: JSON.stringify({
          inline_keyboard: inlineKeyboard
        })
      }
    );
  } catch (error) {
    console.error("Error handling confirm command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при получении списка сборов. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Handle the /history command
 */
export async function handleHistoryCommand(message: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // Fetch user collections
    const result = await getUserCollections(supabaseAdmin, message.from.id.toString());
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    const collections = result.collections || [];
    
    if (!collections || collections.length === 0) {
      await sendTelegramMessage(
        message.chat.id,
        "У вас пока нет созданных сборов."
      );
      return;
    }
    
    let historyText = "Ваши сборы:\n";
    
    for (const [index, collection] of collections.entries()) {
      const status = collection.status === 'active' 
        ? 'Активен' 
        : collection.status === 'finished' 
          ? 'Завершён' 
          : 'Отменён';
      
      historyText += `${index + 1}. ${collection.title} (${status}) — `;
      
      if (collection.status === 'active') {
        historyText += `${collection.target_amount} руб. до ${new Date(collection.deadline).toLocaleDateString('ru-RU')}`;
      } else {
        historyText += `собрано ${collection.current_amount || 0} руб.`;
      }
      
      historyText += "\n";
    }
    
    await sendTelegramMessage(
      message.chat.id,
      historyText
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
 * Handle the /help command
 */
export async function handleHelpCommand(message: any, sendTelegramMessage: Function) {
  await sendTelegramMessage(
    message.chat.id,
    "Доступные команды: /start, /new, /finish, /cancel, /paid, /history, /help",
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
    case '/confirm':
      return handleConfirmCommand(message, sendTelegramMessage, supabaseAdmin);
    case '/history':
      return handleHistoryCommand(message, sendTelegramMessage, supabaseAdmin);
    case '/help':
      return handleHelpCommand(message, sendTelegramMessage);
    default:
      return sendTelegramMessage(
        message.chat.id,
        "Извините, я не распознал команду. Используйте /start, /new, /finish, /cancel, /paid, /history, /help.",
        {
          reply_markup: JSON.stringify({
            keyboard: [
              [{ text: '/new' }, { text: '/history' }],
              [{ text: '/finish' }, { text: '/cancel' }],
              [{ text: '/paid' }, { text: '/help' }],
              [{ text: '/start' }]
            ],
            resize_keyboard: true
          })
        }
      );
  }
}
