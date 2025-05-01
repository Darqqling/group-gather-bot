
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

  // Default response if no command matched
  await sendTelegramMessage(
    message.chat.id,
    "Извините, я не распознал команду. Используйте /start, /new, /finish, /cancel, /paid, /history."
  );
}
