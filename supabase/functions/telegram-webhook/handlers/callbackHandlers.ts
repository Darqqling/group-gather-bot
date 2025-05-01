
// Callback query handlers for the Telegram bot

/**
 * List collections for a specific action (finish, cancel, pay)
 */
export async function listCollectionsForAction(chatId: number, userId: number, action: string, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // For payment confirmation, organizers need to see collections they created
    // For other actions, users see collections based on their role
    const isPaymentConfirmation = action === 'confirm_payment';
    
    let query = supabaseAdmin.from("collections").select("*");
    
    if (isPaymentConfirmation) {
      // Organizers see their collections for payment confirmation
      query = query.eq("creator_id", userId.toString());
    } else if (action === 'pay') {
      // Users see active collections to make payments
      query = query.eq("status", "active");
    } else {
      // For finish/cancel, users see their own active collections
      query = query.eq("creator_id", userId.toString()).eq("status", "active");
    }
    
    const { data: collections, error } = await query;
    
    if (error) throw error;
    
    if (!collections || collections.length === 0) {
      await sendTelegramMessage(
        chatId,
        isPaymentConfirmation 
          ? "У вас нет сборов с ожидающими подтверждения платежами."
          : "У вас нет активных сборов."
      );
      return;
    }
    
    const keyboard = collections.map(collection => {
      return [{
        text: `${collection.title} (${collection.current_amount || 0}/${collection.target_amount} ₽)`,
        callback_data: `select_collection_${action}_${collection.id}`
      }];
    });
    
    await sendTelegramMessage(
      chatId,
      isPaymentConfirmation
        ? "Выберите сбор для подтверждения платежей:"
        : "Выберите сбор из списка:",
      {
        reply_markup: JSON.stringify({
          inline_keyboard: keyboard
        })
      }
    );
  } catch (error) {
    console.error("Error listing collections:", error);
    await sendTelegramMessage(
      chatId,
      "Произошла ошибка при получении списка сборов. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * List pending payments for confirmation by collection creator
 */
export async function listPendingPayments(chatId: number, collectionId: string, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        amount,
        user_id,
        created_at,
        telegram_users(first_name, last_name, username)
      `)
      .eq("collection_id", collectionId)
      .eq("status", "pending");
    
    if (error) throw error;
    
    if (!payments || payments.length === 0) {
      await sendTelegramMessage(
        chatId,
        "В этом сборе нет ожидающих подтверждения платежей."
      );
      return;
    }
    
    const keyboard = payments.map(payment => {
      const user = payment.telegram_users;
      const userName = user 
        ? (user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username) 
        : 'Пользователь';
      
      return [{
        text: `${userName}: ${payment.amount} ₽ (${new Date(payment.created_at).toLocaleDateString()})`,
        callback_data: `confirm_payment_${payment.id}`
      }];
    });
    
    await sendTelegramMessage(
      chatId,
      "Выберите платеж для подтверждения:",
      {
        reply_markup: JSON.stringify({
          inline_keyboard: keyboard
        })
      }
    );
  } catch (error) {
    console.error("Error listing payments:", error);
    await sendTelegramMessage(
      chatId,
      "Произошла ошибка при получении списка платежей. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Handle action on a collection (finish, cancel, pay)
 */
export async function handleCollectionAction(chatId: number, collectionId: string, action: string, userId: number, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // Check if collection exists and user has permission
    const { data: collection, error: collectionError } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .single();
      
    if (collectionError) throw collectionError;
    
    if (action === 'finish' || action === 'cancel') {
      // Check if user is creator for these actions
      if (collection.creator_id !== userId.toString()) {
        await sendTelegramMessage(chatId, "У вас нет прав на изменение этого сбора.");
        return;
      }
      
      // Update collection status
      const { error: updateError } = await supabaseAdmin
        .from("collections")
        .update({
          status: action === 'finish' ? 'finished' : 'cancelled',
          last_updated_at: new Date().toISOString()
        })
        .eq("id", collectionId);
        
      if (updateError) throw updateError;
      
      // Notify creator
      const actionMessage = action === 'finish' 
        ? "Сбор успешно завершен!" 
        : "Сбор отменен.";
      await sendTelegramMessage(chatId, actionMessage);
      
    } else if (action === 'pay') {
      // Set user state to entering payment amount
      await supabaseAdmin
        .from("telegram_users")
        .update({
          current_state: "entering_payment_amount",
          state_data: JSON.stringify({ collection_id: collectionId })
        })
        .eq("telegram_id", userId.toString());
      
      await sendTelegramMessage(chatId, "Пожалуйста, укажите сумму, которую вы хотите внести:");
    } else if (action === 'confirm_payments') {
      // Show pending payments for this collection
      await listPendingPayments(chatId, collectionId, sendTelegramMessage, supabaseAdmin);
    }
  } catch (error) {
    console.error("Error handling collection action:", error);
    await sendTelegramMessage(
      chatId,
      "Произошла ошибка при выполнении действия. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Confirm a specific payment
 */
export async function confirmPayment(chatId: number, paymentId: string, userId: number, sendTelegramMessage: Function, supabaseAdmin: any) {
  try {
    // Get payment info
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*, collections(*)")
      .eq("id", paymentId)
      .single();
      
    if (paymentError) throw paymentError;
    
    // Verify user is the creator of the collection
    if (payment.collections.creator_id !== userId.toString()) {
      await sendTelegramMessage(chatId, "У вас нет прав на подтверждение этого платежа.");
      return;
    }
    
    // Update payment status
    const { error: updatePaymentError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString()
      })
      .eq("id", paymentId);
      
    if (updatePaymentError) throw updatePaymentError;
    
    // Update collection's current amount
    const newAmount = (payment.collections.current_amount || 0) + payment.amount;
    const { error: updateCollectionError } = await supabaseAdmin
      .from("collections")
      .update({
        current_amount: newAmount,
        last_updated_at: new Date().toISOString()
      })
      .eq("id", payment.collection_id);
      
    if (updateCollectionError) throw updateCollectionError;
    
    // Notify the creator
    await sendTelegramMessage(
      chatId,
      `Платеж на сумму ${payment.amount} ₽ успешно подтвержден!\nТекущая сумма сбора: ${newAmount} ₽`
    );
    
    // Notify the contributor if possible
    try {
      const { data: user } = await supabaseAdmin
        .from("telegram_users")
        .select("telegram_id")
        .eq("id", payment.user_id)
        .single();
        
      if (user) {
        await sendTelegramMessage(
          parseInt(user.telegram_id),
          `Ваш платеж на сумму ${payment.amount} ₽ для сбора "${payment.collections.title}" был подтвержден организатором.`
        );
      }
    } catch (error) {
      console.error("Error notifying contributor:", error);
      // Non-critical error, continue execution
    }
  } catch (error) {
    console.error("Error confirming payment:", error);
    await sendTelegramMessage(
      chatId,
      "Произошла ошибка при подтверждении платежа. Пожалуйста, попробуйте позже."
    );
  }
}

/**
 * Main handler for callback queries
 */
export async function handleCallbackQuery(
  callbackQuery: any, 
  sendTelegramMessage: Function, 
  answerCallbackQuery: Function,
  supabaseAdmin: any
) {
  console.log("Received callback query:", callbackQuery);
  
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  
  try {
    if (data.startsWith('list_collections_to_')) {
      // Handle listing collections for various actions
      const action = data.replace('list_collections_to_', '');
      await listCollectionsForAction(chatId, userId, action, sendTelegramMessage, supabaseAdmin);
    } else if (data.startsWith('select_collection_')) {
      // Pattern: select_collection_ACTION_COLLECTION_ID
      const parts = data.split('_');
      if (parts.length >= 4) {
        const action = parts[2];
        const collectionId = parts.slice(3).join('_'); // Handle IDs with underscores
        await handleCollectionAction(chatId, collectionId, action, userId, sendTelegramMessage, supabaseAdmin);
      }
    } else if (data.startsWith('confirm_payment_')) {
      // Pattern: confirm_payment_PAYMENT_ID
      const paymentId = data.replace('confirm_payment_', '');
      await confirmPayment(chatId, paymentId, userId, sendTelegramMessage, supabaseAdmin);
    }
    
    // Answer callback query to remove loading state
    await answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error("Error handling callback query:", error);
    await sendTelegramMessage(
      chatId,
      "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже."
    );
    
    // Still need to answer the callback query even in case of error
    try {
      await answerCallbackQuery(callbackQuery.id, "Произошла ошибка");
    } catch {
      // Ignore errors in answering the callback query
    }
    
    // Log the error to the database
    try {
      await supabaseAdmin
        .from("error_logs")
        .insert({
          message: `Error handling callback query: ${error.message}`,
          stack: error.stack,
          context: { 
            callback_data: data,
            user_id: userId,
            source: "callbackHandlers" 
          }
        });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
  }
}
