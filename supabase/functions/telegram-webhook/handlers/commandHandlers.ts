
// Command handlers and related utilities for the Telegram bot

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
        [{ text: '/paid' }, { text: '/confirm' }]
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
      "✓ /confirm - подтвердить взнос (для организаторов)\n" +
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
    await supabaseAdmin
      .from("telegram_users")
      .update({ 
        current_state: "creating_collection",
        state_data: JSON.stringify({ step: "title" })
      })
      .eq("telegram_id", message.from.id.toString());
    
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
export async function handleFinishCommand(message: any, sendTelegramMessage: Function) {
  await sendTelegramMessage(
    message.chat.id,
    "Выберите сбор, который хотите завершить:",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "Выбрать из списка", callback_data: "list_collections_to_finish" }]
        ]
      })
    }
  );
}

/**
 * Handle the /cancel command
 */
export async function handleCancelCommand(message: any, sendTelegramMessage: Function) {
  await sendTelegramMessage(
    message.chat.id,
    "Выберите сбор, который хотите отменить:",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "Выбрать из списка", callback_data: "list_collections_to_cancel" }]
        ]
      })
    }
  );
}

/**
 * Handle the /paid command
 */
export async function handlePaidCommand(message: any, sendTelegramMessage: Function) {
  await sendTelegramMessage(
    message.chat.id,
    "Выберите сбор, для которого хотите подтвердить оплату:",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "Выбрать из списка", callback_data: "list_collections_to_pay" }]
        ]
      })
    }
  );
}

/**
 * Handle the /confirm command (for organizers to confirm payments)
 */
export async function handleConfirmCommand(message: any, sendTelegramMessage: Function) {
  await sendTelegramMessage(
    message.chat.id,
    "Выберите сбор для подтверждения платежей участников:",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "Выбрать из списка", callback_data: "list_collections_to_confirm_payments" }]
        ]
      })
    }
  );
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
      return handleFinishCommand(message, sendTelegramMessage);
    case '/cancel':
      return handleCancelCommand(message, sendTelegramMessage);
    case '/paid':
      return handlePaidCommand(message, sendTelegramMessage);
    case '/confirm':
      return handleConfirmCommand(message, sendTelegramMessage);
    case '/history':
      return handleHistoryCommand(message, sendTelegramMessage, supabaseAdmin);
    default:
      return sendTelegramMessage(
        message.chat.id,
        "Извините, я не распознал команду. Используйте /start, /new, /finish, /cancel, /paid, /confirm, /history.",
        {
          reply_markup: JSON.stringify({
            keyboard: [
              [{ text: '/new' }, { text: '/history' }],
              [{ text: '/finish' }, { text: '/cancel' }],
              [{ text: '/paid' }, { text: '/confirm' }],
              [{ text: '/start' }]
            ],
            resize_keyboard: true
          })
        }
      );
  }
}
