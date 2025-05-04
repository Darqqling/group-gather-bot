
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
    
    console.log(`Collection creation step: ${stateData.step}, input: ${text}`);
    
    switch (stateData.step) {
      case CollectionCreationStep.TITLE:
        // Сохраняем название и запрашиваем описание
        const titleStateData: CollectionCreationData = {
          ...stateData,
          step: CollectionCreationStep.DESCRIPTION,
          title: text
        };
        
        await setDialogState(userId, DialogState.CREATING_COLLECTION, titleStateData, supabaseAdmin);
        
        return sendTelegramMessage(
          message.chat.id,
          "Введите описание сбора:"
        );
        
      case CollectionCreationStep.DESCRIPTION:
        // Сохраняем описание и запрашиваем сумму
        const descStateData: CollectionCreationData = {
          ...stateData,
          step: CollectionCreationStep.AMOUNT,
          description: text
        };
        
        await setDialogState(userId, DialogState.CREATING_COLLECTION, descStateData, supabaseAdmin);
        
        return sendTelegramMessage(
          message.chat.id,
          "Введите целевую сумму сбора (только число):"
        );
        
      case CollectionCreationStep.AMOUNT:
        // Проверяем, что сумма - число
        const amount = parseFloat(text);
        if (isNaN(amount) || amount <= 0) {
          return sendTelegramMessage(
            message.chat.id,
            "Пожалуйста, введите корректную сумму (положительное число)."
          );
        }
        
        // Сохраняем сумму и запрашиваем дедлайн
        const amountStateData: CollectionCreationData = {
          ...stateData,
          step: CollectionCreationStep.DEADLINE,
          target_amount: amount
        };
        
        await setDialogState(userId, DialogState.CREATING_COLLECTION, amountStateData, supabaseAdmin);
        
        return sendTelegramMessage(
          message.chat.id,
          "Введите дату завершения сбора (в формате ДД.ММ.ГГГГ):"
        );
        
      case CollectionCreationStep.DEADLINE:
        // Проверяем формат даты
        const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
        if (!datePattern.test(text)) {
          return sendTelegramMessage(
            message.chat.id,
            "Пожалуйста, введите дату в формате ДД.ММ.ГГГГ"
          );
        }
        
        const [day, month, year] = text.split('.').map(Number);
        const deadline = new Date(year, month - 1, day); // В JS месяцы начинаются с 0
        
        if (isNaN(deadline.getTime()) || deadline <= new Date()) {
          return sendTelegramMessage(
            message.chat.id,
            "Пожалуйста, введите корректную дату в будущем."
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
        
        const result = await createCollection(supabaseAdmin, collection);
        
        if (result.success) {
          // Сбрасываем состояние пользователя
          await resetDialogState(userId, supabaseAdmin);
          
          // Отправляем сообщение об успехе
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
        // Неизвестное состояние, сбрасываем
        await resetDialogState(userId, supabaseAdmin);
        
        return sendTelegramMessage(
          message.chat.id,
          "Произошла ошибка. Пожалуйста, начните создание сбора заново с помощью команды /new."
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
  
  switch (stateData.step) {
    case PaymentFlowStep.ENTER_AMOUNT:
      // Проверяем, что сумма - число
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        return sendTelegramMessage(
          message.chat.id,
          "Пожалуйста, введите корректную сумму (положительное число)."
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
          throw new Error(paymentResult.error);
        }
        
        // Обновляем общую сумму сбора
        const updateResult = await updateCollectionAmount(
          supabaseAdmin,
          stateData.collection_id!,
          amount
        );
        
        if (!updateResult.success) {
          throw new Error(updateResult.error);
        }
        
        // Сбрасываем состояние пользователя
        await resetDialogState(userId, supabaseAdmin);
        
        // Отправляем сообщение об успехе
        return sendTelegramMessage(
          message.chat.id,
          `Ваш платеж на сумму ${amount} руб. успешно зарегистрирован!\n` +
          `Спасибо за участие в сборе.`
        );
      } catch (error) {
        console.error("Error recording payment:", error);
        
        // Сбрасываем состояние пользователя
        await resetDialogState(userId, supabaseAdmin);
        
        return sendTelegramMessage(
          message.chat.id,
          "Произошла ошибка при регистрации платежа. Пожалуйста, попробуйте еще раз с помощью команды /paid."
        );
      }
      
    default:
      // Неизвестное состояние, сбрасываем
      await resetDialogState(userId, supabaseAdmin);
      
      return sendTelegramMessage(
        message.chat.id,
        "Произошла ошибка. Пожалуйста, начните процесс платежа заново с помощью команды /paid."
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
  
  // Сбрасываем состояние и предлагаем использовать команды
  await resetDialogState(userId, supabaseAdmin);
  
  return sendTelegramMessage(
    message.chat.id,
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
