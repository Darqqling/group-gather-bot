
// Utilities for interacting with the Telegram API

/**
 * Send messages to Telegram API
 */
export async function sendTelegramMessage(chatId: number | string, text: string, options = {}) {
  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return;
  }
  
  try {
    console.log(`Sending message to chat ${chatId}: ${text.substring(0, 50)}...`);
    
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          ...options,
        }),
      }
    );
    
    const data = await response.json();
    console.log("Message sent response:", data);
    if (!data.ok) {
      console.error("Error from Telegram API:", data.description);
    }
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
}

/**
 * Answer callback queries
 */
export async function answerCallbackQuery(callbackQueryId: string, text = "") {
  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return;
  }
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text
        }),
      }
    );
    
    const data = await response.json();
    console.log("Answered callback query:", data);
    return data;
  } catch (error) {
    console.error("Error answering callback query:", error);
    return null;
  }
}
