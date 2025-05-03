
// Message handlers for the Telegram bot
import { handleCommand } from "./commandHandlers.ts";
import { createCollection, updateCollectionState } from "../utils/collectionUtils.ts";

/**
 * Handle incoming messages from Telegram
 */
export async function handleMessage(message: any, saveUser: Function, sendTelegramMessage: Function, supabaseAdmin: any) {
  if (!message || !message.from) {
    console.log("Invalid message format or missing from field");
    return;
  }

  console.log(`Processing message from ${message.from.first_name} (${message.from.id}): ${message.text}`);
  
  // Save or update the user
  await saveUser(message.from);
  
  // Check user state to see if they're in the middle of a flow
  const { data: userData } = await supabaseAdmin
    .from("telegram_users")
    .select("current_state, state_data")
    .eq("telegram_id", message.from.id.toString())
    .single();
    
  // Process commands
  if (message.text && message.text.startsWith('/')) {
    await handleCommand(message, sendTelegramMessage, supabaseAdmin);
    return;
  }
  
  // Process user that's in the middle of a flow
  if (userData?.current_state) {
    console.log(`User ${message.from.id} is in state ${userData.current_state}`);
    
    if (userData.current_state === "creating_collection") {
      await handleCollectionCreation(message, userData, sendTelegramMessage, supabaseAdmin);
      return;
    }
  }

  // Default response if no command matched and not in a specific state
  await sendTelegramMessage(
    message.chat.id,
    "Извините, я не распознал команду. Используйте /start, /new, /finish, /cancel, /paid, /history.",
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
 * Handle collection creation flow
 */
async function handleCollectionCreation(message: any, userData: any, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    const stateData = userData.state_data ? JSON.parse(userData.state_data) : { step: "title" };
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
        
        await sendTelegramMessage(
          message.chat.id,
          "Введите описание сбора"
        );
        break;
        
      case "description":
        // Save the description and ask for target amount
        await updateCollectionState(supabaseAdmin, userId, {
          ...stateData,
          step: "amount",
          description: text
        });
        
        await sendTelegramMessage(
          message.chat.id,
          "Введите целевую сумму сбора"
        );
        break;
        
      case "amount":
        // Validate amount is a number
        const amount = parseFloat(text);
        if (isNaN(amount) || amount <= 0) {
          await sendTelegramMessage(
            message.chat.id,
            "Пожалуйста, введите корректную сумму (положительное число)."
          );
          return;
        }
        
        // Save the amount and ask for deadline
        await updateCollectionState(supabaseAdmin, userId, {
          ...stateData,
          step: "deadline",
          target_amount: amount
        });
        
        await sendTelegramMessage(
          message.chat.id,
          "Введите дату завершения сбора (ДД.ММ.ГГГГ)"
        );
        break;
        
      case "deadline":
        // Validate and parse the date
        const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
        if (!datePattern.test(text)) {
          await sendTelegramMessage(
            message.chat.id,
            "Пожалуйста, введите дату в формате ДД.ММ.ГГГГ"
          );
          return;
        }
        
        const [day, month, year] = text.split('.').map(Number);
        const deadline = new Date(year, month - 1, day); // month is 0-indexed in JS
        
        if (isNaN(deadline.getTime()) || deadline <= new Date()) {
          await sendTelegramMessage(
            message.chat.id,
            "Пожалуйста, введите корректную дату в будущем."
          );
          return;
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
          await supabaseAdmin
            .from("telegram_users")
            .update({ 
              current_state: null,
              state_data: null
            })
            .eq("telegram_id", userId);
          
          // Send success message
          await sendTelegramMessage(
            message.chat.id,
            `Сбор „${stateData.title}" успешно создан! Цель: ${stateData.target_amount} руб., завершение: ${text}`
          );
        } else {
          throw new Error(result.error);
        }
        break;
        
      default:
        // Invalid state, reset
        await supabaseAdmin
          .from("telegram_users")
          .update({ 
            current_state: null,
            state_data: null
          })
          .eq("telegram_id", userId);
        
        await sendTelegramMessage(
          message.chat.id,
          "Произошла ошибка. Пожалуйста, начните создание сбора заново с помощью команды /new."
        );
    }
  } catch (error) {
    console.error("Error in collection creation flow:", error);
    
    await sendTelegramMessage(
      message.chat.id,
      "Произошла ошибка при создании сбора. Пожалуйста, попробуйте еще раз с помощью команды /new."
    );
    
    // Reset user state
    await supabaseAdmin
      .from("telegram_users")
      .update({ 
        current_state: null,
        state_data: null
      })
      .eq("telegram_id", message.from.id.toString());
  }
}
