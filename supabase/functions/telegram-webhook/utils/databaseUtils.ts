
// Database utilities for the Telegram bot

/**
 * Save or update a user in the database
 */
export async function saveUser(user: any, supabaseAdmin: any) {
  if (!user || !user.id) {
    console.log("Invalid user object:", user);
    return;
  }
  
  try {
    console.log(`Saving user: ${user.first_name} (ID: ${user.id})`);
    
    const { data, error } = await supabaseAdmin
      .from("telegram_users")
      .upsert({
        telegram_id: user.id.toString(),
        username: user.username || null,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        last_active_at: new Date().toISOString(),
        joined_at: new Date().toISOString() // This will only be used for new records
      }, {
        onConflict: 'telegram_id'  // Specify the conflict column
      })
      .select();
    
    if (error) {
      console.error("Error saving user:", error);
      throw error;
    }
    
    console.log("User saved successfully:", data);
    return data;
  } catch (error) {
    console.error("Exception saving user:", error);
    throw error;
  }
}

/**
 * Log errors to the database
 */
export async function logError(error: Error, context: any, supabaseAdmin: any) {
  try {
    await supabaseAdmin
      .from("error_logs")
      .insert({
        message: `Error processing Telegram webhook: ${error.message}`,
        stack: error.stack,
        context: { source: "telegram-webhook", ...context }
      });
  } catch (logError) {
    console.error("Failed to log error:", logError);
  }
}
