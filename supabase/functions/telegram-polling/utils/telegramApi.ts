
/**
 * Utility functions for interacting with the Telegram API
 */

/**
 * Send a message to a Telegram chat
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options: any = {}
) {
  try {
    const token = options.token;
    if (!token) {
      throw new Error("Bot token is required");
    }
    
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    // Remove token from options to avoid sending it in the request
    const { token: _, ...optionsWithoutToken } = options;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...optionsWithoutToken
      })
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }
    
    return result;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Answer a callback query
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text: string = "",
  options: any = {}
) {
  try {
    const token = options.token;
    if (!token) {
      throw new Error("Bot token is required");
    }
    
    const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
    
    // Remove token from options
    const { token: _, ...optionsWithoutToken } = options;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        ...optionsWithoutToken
      })
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }
    
    return result;
  } catch (error) {
    console.error("Error answering callback query:", error);
    throw error;
  }
}
