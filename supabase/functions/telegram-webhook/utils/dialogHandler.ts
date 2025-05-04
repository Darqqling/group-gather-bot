
/**
 * Обработчики диалогов для Telegram бота
 */

import { 
  DialogState, 
  CollectionCreationStep, 
  PaymentFlowStep,
  setDialogState, 
  resetDialogState, 
  CollectionCreationData,
  PaymentFlowData
} from "./dialogStateManager.ts";
import { createCollection, recordPayment, updateCollectionAmount } from "./collectionUtils.ts";

/**
 * Обработать ввод в режиме создания сбора
 */
export async function handleCollectionCreation(
  message: any,
  stateData: CollectionCreationData,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  try {
    const userId = message.from.id.toString();
    const text = message.text;
    const chatId = message.chat.id;
    
    console.log(`Collection creation step: ${stateData.step}, input: ${text}`);
    
    switch (stateData.step) {
      case CollectionCreationStep.TITLE:
        // Сохраняем название и запрашиваем описание
        console.log("Saving title and asking for description");
        const titleStateData: CollectionCreationData = {
          ...stateData,
          step: CollectionCreationStep.DESCRIPTION,
          title: text
        };
        
        await setDialogState(userId, DialogState.CREATING_COLLECTION, titleStateData, supabaseAdmin);
        
        return sendTelegramMessage(
          chatId,
          "Введите описание сбора:",
          {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: "Отменить создание", callback_data: "cancel_creation" }]
              ]
            })
          }
        );
        
      case CollectionCreationStep.DESCRIPTION:
        // Сохраняем описание и запрашиваем сумму
        console.log("Saving description and asking for amount");
        const descStateData: CollectionCreationData = {
          ...stateData,
          step: CollectionCreationStep.AMOUNT,
          description: text
        };
        
        await setDialogState(userId, DialogState.CREATING_COLLECTION, descStateData, supabaseAdmin);
        
        return sendTelegramMessage(
          chatId,
          "Введите целевую сумму сбора (только число):",
          {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: "Назад", callback_data: "creation_back_to_description" }],
                [{ text: "Отменить создание", callback_data: "cancel_creation" }]
              ]
            })
          }
        );
        
      case CollectionCreationStep.AMOUNT:
        // Проверяем, что сумма - число
        const amount = parseFloat(text);
        if (isNaN(amount) || amount <= 0) {
          return sendTelegramMessage(
            chatId,
            "Пожалуйста, введите корректную сумму (положительное число).",
            {
              reply_markup: JSON.stringify({
                inline_keyboard: [
                  [{ text: "Назад", callback_data: "creation_back_to_description" }],
                  [{ text: "Отменить создание", callback_data: "cancel_creation" }]
                ]
              })
            }
          );
        }
        
        // Сохраняем сумму и запрашиваем дедлайн
        console.log("Saving amount and asking for deadline");
        const amountStateData: CollectionCreationData = {
          ...stateData,
          step: CollectionCreationStep.DEADLINE,
          target_amount: amount
        };
        
        await setDialogState(userId, DialogState.CREATING_COLLECTION, amountStateData, supabaseAdmin);
        
        return sendTelegramMessage(
          chatId,
          "Введите дату завершения сбора (в формате ДД.ММ.ГГГГ):",
          {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: "Назад", callback_data: "creation_back_to_amount" }],
                [{ text: "Отменить создание", callback_data: "cancel_creation" }]
              ]
            })
          }
        );
        
      case CollectionCreationStep.DEADLINE:
        // Проверяем формат даты
        const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
        if (!datePattern.test(text)) {
          return sendTelegramMessage(
            chatId,
            "Пожалуйста, введите дату в формате ДД.ММ.ГГГГ",
            {
              reply_markup: JSON.stringify({
                inline_keyboard: [
                  [{ text: "Назад", callback_data: "creation_back_to_amount" }],
                  [{ text: "Отменить создание", callback_data: "cancel_creation" }]
                ]
              })
            }
          );
        }
        
        const [day, month, year] = text.split('.').map(Number);
        const deadline = new Date(year, month - 1, day); // В JS месяцы начинаются с 0
        const currentDate = new Date();
        
        // Сбрасываем время, оставляя только дату для корректного сравнения
        currentDate.setHours(0, 0, 0, 0);
        
        if (isNaN(deadline.getTime())) {
          return sendTelegramMessage(
            chatId,
            "Пожалуйста, введите корректную дату.",
            {
              reply_markup: JSON.stringify({
                inline_keyboard: [
                  [{ text: "Назад", callback_data: "creation_back_to_amount" }],
                  [{ text: "Отменить создание", callback_data: "cancel_creation" }]
                ]
              })
            }
          );
        }
        
        if (deadline <= currentDate) {
          return sendTelegramMessage(
            chatId,
            "Дата завершения должна быть в будущем. Пожалуйста, введите дату, которая позже сегодняшней.",
            {
              reply_markup: JSON.stringify({
                inline_keyboard: [
                  [{ text: "Назад", callback_data: "creation_back_to_amount" }],
                  [{ text: "Отменить создание", callback_data: "cancel_creation" }]
                ]
              })
            }
          );
        }
        
        // Создаем сбор
        const collection = {
          title: stateData.title!,
          description: stateData.description!,
          target_amount: stateData.target_amount!,
          deadline: deadline.toISOString(),
          creator_id: userId,
          status: "active",
          current_amount: 0
        };
        
        try {
          console.log("Attempting to create collection:", collection);
          const result = await createCollection(supabaseAdmin, collection);
          
          if (!result.success) {
            console.error("Error creating collection:", result.error);
            throw new Error(result.error || "Неизвестная ошибка при создании сбора");
          }
          
          // Сбрасываем состояние пользователя
          await resetDialogState(userId, supabaseAdmin);
          
          // Отправляем сообщение об успехе
          return sendTelegramMessage(
            chatId,
            `✅ Сбор "${stateData.title}" успешно создан!\n` +
            `Цель: ${stateData.target_amount} руб.\n` +
            `Дата завершения: ${text}\n\n` +
            `Используйте команду /history для просмотра ваших сборов.`
          );
        } catch (createError) {
          console.error("Error in createCollection:", createError);
          
          // Сбрасываем состояние пользователя
          await resetDialogState(userId, supabaseAdmin);
          
          return sendTelegramMessage(
            chatId,
            `❌ Не удалось создать сбор: ${createError.message || 'Произошла техническая ошибка'}\n` +
            `Пожалуйста, попробуйте ещё раз с помощью команды /new.`
          );
        }
        
      default:
        // Неизвестное состояние, сбрасываем
        console.error("Unknown collection creation step:", stateData.step);
        await resetDialogState(userId, supabaseAdmin);
        
        return sendTelegramMessage(
          chatId,
          "Произошла ошибка в процессе создания сбора. Пожалуйста, начните создание сбора заново с помощью команды /new."
        );
    }
  } catch (error) {
    console.error("Error in collection creation flow:", error);
    
    // Сбрасываем состояние пользователя
    await resetDialogState(message.from.id.toString(), supabaseAdmin);
    
    return sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при создании сбора. Пожалуйста, попробуйте еще раз с помощью команды /new."
    );
  }
}

/**
 * Обработать ввод в режиме платежа
 */
export async function handlePaymentFlow(
  message: any,
  stateData: PaymentFlowData,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  const text = message.text;
  const chatId = message.chat.id;
  
  switch (stateData.step) {
    case PaymentFlowStep.ENTER_AMOUNT:
      // Проверяем, что сумма - число
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        return sendTelegramMessage(
          chatId,
          "Пожалуйста, введите корректную сумму (положительное число).",
          {
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: "Отменить платеж", callback_data: "cancel_payment" }]
              ]
            })
          }
        );
      }
      
      try {
        // Записываем платеж
        const paymentResult = await recordPayment(
          supabaseAdmin,
          stateData.collection_id!,
          userId,
          amount
        );
        
        if (!paymentResult.success) {
          throw new Error(paymentResult.error || "Ошибка при записи платежа");
        }
        
        // Обновляем общую сумму сбора
        const updateResult = await updateCollectionAmount(
          supabaseAdmin,
          stateData.collection_id!,
          amount
        );
        
        if (!updateResult.success) {
          throw new Error(updateResult.error || "Ошибка при обновлении суммы сбора");
        }
        
        // Сбрасываем состояние пользователя
        await resetDialogState(userId, supabaseAdmin);
        
        // Отправляем сообщение об успехе
        return sendTelegramMessage(
          chatId,
          `✅ Ваш платеж на сумму ${amount} руб. успешно зарегистрирован!\n` +
          `Спасибо за участие в сборе.`
        );
      } catch (error) {
        console.error("Error recording payment:", error);
        
        // Сбрасываем состояние пользователя
        await resetDialogState(userId, supabaseAdmin);
        
        return sendTelegramMessage(
          chatId,
          `❌ Не удалось зарегистрировать платеж: ${error.message || 'Техническая ошибка'}\n` +
          "Пожалуйста, попробуйте еще раз с помощью команды /paid."
        );
      }
      
    default:
      // Неизвестное состояние, сбрасываем
      await resetDialogState(userId, supabaseAdmin);
      
      return sendTelegramMessage(
        chatId,
        "Произошла ошибка в процессе платежа. Пожалуйста, начните процесс платежа заново с помощью команды /paid."
      );
  }
}

/**
 * Обработать ввод в режиме администратора
 */
export async function handleAdminMode(
  message: any,
  stateData: any,
  supabaseAdmin: any,
  sendTelegramMessage: Function
) {
  const userId = message.from.id.toString();
  const text = message.text;
  const chatId = message.chat.id;
  
  // Сбрасываем состояние и предлагаем использовать команды
  await resetDialogState(userId, supabaseAdmin);
  
  return sendTelegramMessage(
    chatId,
    "Для работы с административными функциями используйте команду /admin.",
    {
      reply_markup: JSON.stringify({
        keyboard: [
          [{ text: '/admin' }],
          [{ text: '/start' }]
        ],
        resize_keyboard: true
      })
    }
  );
}
