
// Utilities for interacting with the Telegram API

/**
 * Send messages to Telegram API
 */
export async function sendTelegramMessage(chatId: number | string, text: string, options: any = {}) {
  const token = options.token;
  delete options.token;
  
  if (!token) {
    console.error("Telegram bot token not provided");
    throw new Error("Telegram bot token is required");
  }
  
  try {
    console.log(`Sending message to chat ${chatId}: ${text.substring(0, 50)}...`);
    
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
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
    if (!data.ok) {
      console.error("Error from Telegram API:", data.description);
      throw new Error(`Telegram API error: ${data.description}`);
    }
    
    console.log("Message sent successfully");
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Answer callback queries
 */
export async function answerCallbackQuery(callbackQueryId: string, text = "", options: any = {}) {
  const token = options.token;
  delete options.token;
  
  if (!token) {
    console.error("Telegram bot token not provided");
    throw new Error("Telegram bot token is required");
  }
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text,
          ...options
        }),
      }
    );
    
    const data = await response.json();
    if (!data.ok) {
      console.error("Error answering callback query:", data.description);
      throw new Error(`Telegram API error: ${data.description}`);
    }
    
    console.log("Answered callback query successfully");
    return data;
  } catch (error) {
    console.error("Error answering callback query:", error);
    throw error;
  }
}
