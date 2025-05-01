
// Message handlers for the Telegram bot
import { handleCommand } from './commandHandlers.ts';

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
  
  // Process commands
  if (message.text && message.text.startsWith('/')) {
    await handleCommand(message, sendTelegramMessage, supabaseAdmin);
    return;
  }

  // Check for user state for multi-step commands
  try {
    const { data: userData } = await supabaseAdmin
      .from("telegram_users")
      .select("current_state, state_data")
      .eq("telegram_id", message.from.id.toString())
      .single();
    
    if (userData?.current_state) {
      // Handle different states for multi-step commands
      // Like creating a new collection, etc.
      console.log(`User ${message.from.id} is in state: ${userData.current_state}`);
      
      // Handle state-based operations here
      // This will be implemented in another task
    } else {
      // Default response if no command matched and no active state
      await sendTelegramMessage(
        message.chat.id,
        "Извините, я не распознал команду. Используйте /start, /new, /finish, /cancel, /paid, /history.",
        {
          reply_markup: JSON.stringify({
            keyboard: [
              [{ text: '/start' }, { text: '/new' }],
              [{ text: '/finish' }, { text: '/cancel' }],
              [{ text: '/paid' }, { text: '/history' }]
            ],
            resize_keyboard: true
          })
        }
      );
    }
  } catch (error) {
    console.error("Error processing message state:", error);
    
    // Default response if error occurred
    await sendTelegramMessage(
      message.chat.id,
      "Извините, произошла ошибка при обработке сообщения. Попробуйте еще раз или используйте команду /start.",
      {
        reply_markup: JSON.stringify({
          keyboard: [
            [{ text: '/start' }]
          ],
          resize_keyboard: true
        })
      }
    );
  }
}
