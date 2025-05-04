/**
 * Обработчики команд для Telegram бота
 */

import { 
  getUserCollections, 
  getActiveCollections, 
  createCollection 
} from "./collectionUtils.ts";
import { 
  DialogState, 
  CollectionCreationStep, 
  setDialogState, 
  resetDialogState,
  CollectionCreationData,
  PaymentFlowData,
  PaymentFlowStep
} from "./dialogStateManager.ts";
import { isUserAdmin } from "./databaseUtils.ts";

/**
 * Обработать команду /start
 */
export async function handleStartCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  const userName = message.from.first_name || "пользователь";
  
  // Сброс состояния пользователя
  await resetDialogState(userId, supabaseAdmin);
  
  // Формирование клавиатуры с основными командами
  const keyboard = {
    keyboard: [
      [{ text: '/new' }, { text: '/history' }],
      [{ text: '/finish' }, { text: '/cancel' }],
      [{ text: '/paid' }, { text: '/help' }]
    ],
    resize_keyboard: true
  };
  
  // Проверка, является ли пользователь администратором
  const isAdmin = await isUserAdmin(userId, supabaseAdmin);
  
  // Добавление кнопки для администраторов
  if (isAdmin) {
    keyboard.keyboard.push([{ text: '/admin' }]);
  }
  
  const welcomeMessage = 
    `Добро пожаловать, ${userName}!\n\n` +
    "Я бот для организации и ведения денежных сборов. Вот что я умею:\n\n" +
    "/new - Создать новый сбор\n" +
    "/finish - Завершить активный сбор\n" +
    "/cancel - Отменить активный сбор\n" +
    "/paid - Отправить информацию о платеже\n" +
    "/history - Посмотреть историю сборов\n" +
    "/help - Показать это сообщение\n";
  
  const adminSuffix = isAdmin ? "\n👑 У вас есть права администратора. Используйте /admin для доступа к дополнительным функциям." : "";
  
  return sendTelegramMessage(
    message.chat.id,
    welcomeMessage + adminSuffix,
    {
      parse_mode: "Markdown",
      reply_markup: JSON.stringify(keyboard)
    }
  );
}

/**
 * Обработать команду /help
 */
export async function handleHelpCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  return handleStartCommand(message, supabaseAdmin, sendTelegramMessage);
}

/**
 * Обработать команду /new
 */
export async function handleNewCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  
  // Устанавливаем состояние создания коллекции
  const initialState: CollectionCreationData = {
    step: CollectionCreationStep.TITLE
  };
  
  await setDialogState(userId, DialogState.CREATING_COLLECTION, initialState, supabaseAdmin);
  
  return sendTelegramMessage(
    message.chat.id,
    "Начинаем создание нового сбора. Пожалуйста, введите название сбора:"
  );
}

/**
 * Обработать команду /finish
 */
export async function handleFinishCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  
  // Получаем активные сборы пользователя
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
  
  // Создаем инлайн клавиатуру со списком сборов
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
 * Обработать команду /cancel
 */
export async function handleCancelCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  
  // Получаем активные сборы пользователя
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
  
  // Создаем инлайн клавиатуру со списком сборов
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
 * Обработать команду /paid
 */
export async function handlePaidCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  
  // Получаем активные сборы
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
  
  // Создаем инлайн клавиатуру со списком сборов
  const inlineKeyboard = result.collections.map(collection => ([{
    text: `${collection.title} (${collection.current_amount || 0}/${collection.target_amount} руб.)`,
    callback_data: `paid_select_${collection.id}`
  }]));
  
  // Устанавливаем состояние платежа
  const paymentData: PaymentFlowData = {
    step: PaymentFlowStep.SELECT_COLLECTION
  };
  
  await setDialogState(userId, DialogState.PAYMENT_FLOW, paymentData, supabaseAdmin);
  
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
 * Обработать команду /history
 */
export async function handleHistoryCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  try {
    console.log(`Handling history command for user ${message.from.id}`);
    
    // Fetch user collections with improved error handling
    const result = await getUserCollections(supabaseAdmin, message.from.id.toString());
    
    if (!result.success) {
      console.error("Error fetching user collections:", result.error);
      await sendTelegramMessage(
        message.chat.id,
        `Не удалось получить историю сборов: ${result.error}. Пожалуйста, попробуйте позже.`
      );
      return;
    }
    
    const collections = result.collections || [];
    
    if (collections.length === 0) {
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
    console.log("Successfully sent history to user");
  } catch (error) {
    console.error("Exception handling history command:", error);
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при получении истории сборов. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Обработать команду /admin
 */
export async function handleAdminCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  
  // Проверяем, является ли пользователь администратором
  const isAdmin = await isUserAdmin(userId, supabaseAdmin);
  
  if (!isAdmin) {
    return sendTelegramMessage(
      message.chat.id,
      "У вас нет доступа к административным функциям."
    );
  }
  
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
  
  // Устанавливаем состояние админа
  await setDialogState(userId, DialogState.ADMIN_MODE, { action: null }, supabaseAdmin);
  
  return sendTelegramMessage(
    message.chat.id,
    "👑 *Режим администратора*\n\nВыберите действие:",
    {
      parse_mode: "Markdown",
      reply_markup: JSON.stringify(adminKeyboard)
    }
  );
}

/**
 * Обработчик всех команд
 */
export function handleCommand(
  message: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  try {
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
      
      case '/admin':
        return handleAdminCommand(message, supabaseAdmin, sendTelegramMessage);
      
      default:
        // Неизвестная команда
        return sendTelegramMessage(
          message.chat.id,
          "Извините, я не распознал команду. Используйте одну из следующих команд: /start - начало работы, /new - создать новый сбор, /finish - завершить сбор, /cancel - отменить сбор, /paid - внести платеж, /history - история сборов, /help - справка.",
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
  } catch (error) {
    console.error(`Error handling command ${command}:`, error);
    return sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при обработке команды. Пожалуйста, попробуйте позже или обратитесь к администратору."
    );
  }
}
