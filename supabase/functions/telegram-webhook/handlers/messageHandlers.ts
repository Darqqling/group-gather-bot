
// Message handlers for the Telegram bot
import { handleCommand } from "./commandHandlers.ts";

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
    // Handle state-specific messages
    // This would handle things like creating a collection, etc.
    console.log(`User ${message.from.id} is in state ${userData.current_state}`);
    // Process based on state...
    return;
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
