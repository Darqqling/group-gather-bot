
// Message handlers for the Telegram bot
import { updateCollectionState, createCollection, getUserCollections, getActiveCollections, recordPayment, updateCollectionAmount } from "../utils/collectionUtils.ts";
import { updateUserState, getUserState, saveUser } from "../utils/databaseUtils.ts";

/**
 * Handle incoming messages from Telegram
 */
export async function handleMessage(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  if (!message || !message.from) {
    console.log("Invalid message format or missing from field");
    return;
  }

  console.log(`Processing message from ${message.from.first_name} (${message.from.id}): ${message.text || "no text"}`);
  
  const userId = message.from.id.toString();
  
  // Save or update user in our database
  await saveUser(message.from, supabaseAdmin);
  
  // Check user state to see if they're in the middle of a flow
  const userState = await getUserState(userId, supabaseAdmin);
  
  // Process commands
  if (message.text && message.text.startsWith('/')) {
    return handleCommand(message, supabaseAdmin, sendTelegramMessage);
  }
  
  // Process user that's in the middle of a flow
  if (userState && userState.state) {
    console.log(`User ${userId} is in state ${userState.state} with data:`, userState.data);
    
    switch (userState.state) {
      case "creating_collection":
        return handleCollectionCreation(message, userState.data, supabaseAdmin, sendTelegramMessage);
      
      case "payment_amount":
        return handlePaymentAmount(message, userState.data, supabaseAdmin, sendTelegramMessage);
      
      default:
        // Reset state if unknown
        await updateUserState(userId, null, null, supabaseAdmin);
    }
  }

  // Default response for unrecognized messages
  return sendTelegramMessage(
    message.chat.id,
    "Извините, я не распознал команду. Используйте /start для просмотра доступных команд.",
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
 * Handle bot commands
 */
async function handleCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const command = message.text.split(' ')[0].toLowerCase();
  const userId = message.from.id.toString();
  
  console.log(`Processing command: ${command} from user ${userId}`);
  
  switch(command) {
    case '/start':
      return handleStartCommand(message, supabaseAdmin, sendTelegramMessage);
    
    case '/help':
      return handleHelpCommand(message, supabaseAdmin, sendTelegramMessage);
    
    case '/new':
      return handleNewCommand(message, supabaseAdmin, sendTelegramMessage);
    
    case '/finish':
      return handleFinishCommand(message, supabaseAdmin, sendTelegramMessage);
    
    case '/cancel':
      return handleCancelCommand(message, supabaseAdmin, sendTelegramMessage);
    
    case '/paid':
      return handlePaidCommand(message, supabaseAdmin, sendTelegramMessage);
    
    case '/history':
      return handleHistoryCommand(message, supabaseAdmin, sendTelegramMessage);
    
    default:
      // Unknown command response
      return sendTelegramMessage(
        message.chat.id,
        "Извините, я не распознал команду. Используйте /start для просмотра доступных команд.",
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
}

/**
 * Handle /start command
 */
async function handleStartCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const welcomeMessage = 
    `Добро пожаловать, ${message.from.first_name}!\n\n` +
    "Я бот для организации и ведения денежных сборов. Вот что я умею:\n\n" +
    "/new - Создать новый сбор\n" +
    "/finish - Завершить активный сбор\n" +
    "/cancel - Отменить активный сбор\n" +
    "/paid - Отправить информацию о платеже\n" +
    "/history - Посмотреть историю сборов\n" +
    "/help - Показать это сообщение\n\n" +
    "Чтобы начать, выберите одну из команд или нажмите на соответствующую кнопку.";
    
  // Reset user state
  await updateUserState(message.from.id.toString(), null, null, supabaseAdmin);
  
  return sendTelegramMessage(
    message.chat.id,
    welcomeMessage,
    {
      parse_mode: "Markdown",
      reply_markup: JSON.stringify({
        keyboard: [
          [{ text: '/new' }, { text: '/history' }],
          [{ text: '/finish' }, { text: '/cancel' }],
          [{ text: '/paid' }, { text: '/help' }]
        ],
        resize_keyboard: true
      })
    }
  );
}

/**
 * Handle /help command
 */
async function handleHelpCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  // Same as start for now
  return handleStartCommand(message, supabaseAdmin, sendTelegramMessage);
}

/**
 * Handle /new command
 */
async function handleNewCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  
  // Start collection creation process
  await updateCollectionState(supabaseAdmin, userId, { step: "title" });
  
  return sendTelegramMessage(
    message.chat.id,
    "Начинаем создание нового сбора. Пожалуйста, введите название сбора:"
  );
}

/**
 * Handle collection creation flow
 */
async function handleCollectionCreation(
  message: any,
  stateData: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  try {
    const userId = message.from.id.toString();
    const text = message.text;
    
    console.log(`Collection creation step: ${stateData.step}, input: ${text}`);
    
    switch (stateData.step) {
      case "title":
        // Save the title and ask for description
        await updateCollectionState(supabaseAdmin, userId, {
          step: "description",
          title: text
        });
        
        return sendTelegramMessage(
          message.chat.id,
          "Введите описание сбора:"
        );
        
      case "description":
        // Save the description and ask for target amount
        await updateCollectionState(supabaseAdmin, userId, {
          ...stateData,
          step: "amount",
          description: text
        });
        
        return sendTelegramMessage(
          message.chat.id,
          "Введите целевую сумму сбора (только число):"
        );
        
      case "amount":
        // Validate amount is a number
        const amount = parseFloat(text);
        if (isNaN(amount) || amount <= 0) {
          return sendTelegramMessage(
            message.chat.id,
            "Пожалуйста, введите корректную сумму (положительное число)."
          );
        }
        
        // Save the amount and ask for deadline
        await updateCollectionState(supabaseAdmin, userId, {
          ...stateData,
          step: "deadline",
          target_amount: amount
        });
        
        return sendTelegramMessage(
          message.chat.id,
          "Введите дату завершения сбора (в формате ДД.ММ.ГГГГ):"
        );
        
      case "deadline":
        // Validate and parse the date
        const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
        if (!datePattern.test(text)) {
          return sendTelegramMessage(
            message.chat.id,
            "Пожалуйста, введите дату в формате ДД.ММ.ГГГГ"
          );
        }
        
        const [day, month, year] = text.split('.').map(Number);
        const deadline = new Date(year, month - 1, day); // month is 0-indexed in JS
        
        if (isNaN(deadline.getTime()) || deadline <= new Date()) {
          return sendTelegramMessage(
            message.chat.id,
            "Пожалуйста, введите корректную дату в будущем."
          );
        }
        
        // Create the collection
        const collection = {
          title: stateData.title,
          description: stateData.description,
          target_amount: stateData.target_amount,
          deadline: deadline.toISOString(),
          creator_id: userId,
          status: "active",
          current_amount: 0
        };
        
        const result = await createCollection(supabaseAdmin, collection);
        
        if (result.success) {
          // Reset user state
          await updateUserState(userId, null, null, supabaseAdmin);
          
          // Send success message
          return sendTelegramMessage(
            message.chat.id,
            `Сбор "${stateData.title}" успешно создан!\n` +
            `Цель: ${stateData.target_amount} руб.\n` +
            `Дата завершения: ${text}`
          );
        } else {
          throw new Error(result.error);
        }
        
      default:
        // Invalid state, reset
        await updateUserState(userId, null, null, supabaseAdmin);
        
        return sendTelegramMessage(
          message.chat.id,
          "Произошла ошибка. Пожалуйста, начните создание сбора заново с помощью команды /new."
        );
    }
  } catch (error) {
    console.error("Error in collection creation flow:", error);
    
    // Reset user state
    await updateUserState(message.from.id.toString(), null, null, supabaseAdmin);
    
    return sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при создании сбора. Пожалуйста, попробуйте еще раз с помощью команды /new."
    );
  }
}

/**
 * Handle /finish command
 */
async function handleFinishCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  
  // Get active collections for this user
  const result = await getUserCollections(supabaseAdmin, userId, "active");
  
  if (!result.success) {
    return sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при получении списка сборов. Пожалуйста, попробуйте позже."
    );
  }
  
  if (!result.collections || result.collections.length === 0) {
    return sendTelegramMessage(
      message.chat.id,
      "У вас нет активных сборов, которые можно завершить."
    );
  }
  
  // Create inline keyboard with collections
  const inlineKeyboard = result.collections.map(collection => ([{
    text: `${collection.title} (${collection.current_amount || 0}/${collection.target_amount} руб.)`,
    callback_data: `finish_select_${collection.id}`
  }]));
  
  return sendTelegramMessage(
    message.chat.id,
    "Выберите сбор, который хотите завершить:",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: inlineKeyboard
      })
    }
  );
}

/**
 * Handle /cancel command
 */
async function handleCancelCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  
  // Get active collections for this user
  const result = await getUserCollections(supabaseAdmin, userId, "active");
  
  if (!result.success) {
    return sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при получении списка сборов. Пожалуйста, попробуйте позже."
    );
  }
  
  if (!result.collections || result.collections.length === 0) {
    return sendTelegramMessage(
      message.chat.id,
      "У вас нет активных сборов, которые можно отменить."
    );
  }
  
  // Create inline keyboard with collections
  const inlineKeyboard = result.collections.map(collection => ([{
    text: `${collection.title} (${collection.current_amount || 0}/${collection.target_amount} руб.)`,
    callback_data: `cancel_select_${collection.id}`
  }]));
  
  return sendTelegramMessage(
    message.chat.id,
    "Выберите сбор, который хотите отменить:",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: inlineKeyboard
      })
    }
  );
}

/**
 * Handle /paid command
 */
async function handlePaidCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  // Get active collections
  const result = await getActiveCollections(supabaseAdmin);
  
  if (!result.success) {
    return sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при получении списка сборов. Пожалуйста, попробуйте позже."
    );
  }
  
  if (!result.collections || result.collections.length === 0) {
    return sendTelegramMessage(
      message.chat.id,
      "В данный момент нет активных сборов, в которые можно внести платеж."
    );
  }
  
  // Create inline keyboard with collections
  const inlineKeyboard = result.collections.map(collection => ([{
    text: `${collection.title} (${collection.current_amount || 0}/${collection.target_amount} руб.)`,
    callback_data: `paid_select_${collection.id}`
  }]));
  
  return sendTelegramMessage(
    message.chat.id,
    "Выберите сбор, в который хотите внести платеж:",
    {
      reply_markup: JSON.stringify({
        inline_keyboard: inlineKeyboard
      })
    }
  );
}

/**
 * Handle payment amount input
 */
async function handlePaymentAmount(
  message: any,
  stateData: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  const text = message.text;
  
  // Validate amount
  const amount = parseFloat(text);
  if (isNaN(amount) || amount <= 0) {
    return sendTelegramMessage(
      message.chat.id,
      "Пожалуйста, введите корректную сумму (положительное число)."
    );
  }
  
  try {
    // Record payment
    const paymentResult = await recordPayment(
      supabaseAdmin,
      stateData.collection_id,
      userId,
      amount
    );
    
    if (!paymentResult.success) {
      throw new Error(paymentResult.error);
    }
    
    // Update collection amount
    const updateResult = await updateCollectionAmount(
      supabaseAdmin,
      stateData.collection_id,
      amount
    );
    
    if (!updateResult.success) {
      throw new Error(updateResult.error);
    }
    
    // Reset user state
    await updateUserState(userId, null, null, supabaseAdmin);
    
    // Send success message
    return sendTelegramMessage(
      message.chat.id,
      `Ваш платеж на сумму ${amount} руб. успешно зарегистрирован!\n` +
      `Спасибо за участие в сборе.`
    );
  } catch (error) {
    console.error("Error recording payment:", error);
    
    // Reset user state
    await updateUserState(userId, null, null, supabaseAdmin);
    
    return sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при регистрации платежа. Пожалуйста, попробуйте еще раз с помощью команды /paid."
    );
  }
}

/**
 * Handle /history command
 */
async function handleHistoryCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  
  // Get all collections for this user
  const result = await getUserCollections(supabaseAdmin, userId);
  
  if (!result.success) {
    return sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при получении истории сборов. Пожалуйста, попробуйте позже."
    );
  }
  
  if (!result.collections || result.collections.length === 0) {
    return sendTelegramMessage(
      message.chat.id,
      "У вас еще нет созданных сборов."
    );
  }
  
  // Format collections for display
  const collectionsText = result.collections.map((collection, index) => {
    const status = {
      active: "🟢 Активен",
      finished: "✅ Завершен",
      cancelled: "❌ Отменен"
    }[collection.status] || collection.status;
    
    const deadline = new Date(collection.deadline).toLocaleDateString('ru-RU');
    
    return `${index + 1}. *${collection.title}*\n` +
      `Статус: ${status}\n` +
      `Сумма: ${collection.current_amount || 0}/${collection.target_amount} руб.\n` +
      `Дедлайн: ${deadline}\n`;
  }).join("\n");
  
  return sendTelegramMessage(
    message.chat.id,
    `*Ваши сборы:*\n\n${collectionsText}`,
    { parse_mode: "Markdown" }
  );
}
