
/**
 * Functions for working with users and other database operations
 */

/**
 * Save or update user information
 */
export async function saveUser(
  telegramUser: any,
  supabaseAdmin: any
) {
  if (!telegramUser || !telegramUser.id) {
    console.log("Invalid user object");
    return { success: false };
  }

  try {
    console.log(`Saving user: ${telegramUser.first_name} (${telegramUser.id})`);
    
    const { error } = await supabaseAdmin
      .from('telegram_users')
      .upsert({
        telegram_id: telegramUser.id.toString(),
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        language_code: telegramUser.language_code,
        last_active_at: new Date().toISOString()
      }, { onConflict: 'telegram_id' });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Error saving user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user state
 */
export async function getUserState(
  userId: string,
  supabaseAdmin: any
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_states')
      .select()
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    
    return data || null;
  } catch (error) {
    console.error("Error getting user state:", error);
    return null;
  }
}

/**
 * Update user state
 */
export async function updateUserState(
  userId: string,
  state: string | null,
  data: any,
  supabaseAdmin: any
) {
  try {
    if (state === null) {
      // Delete user state
      const { error } = await supabaseAdmin
        .from('user_states')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    } else {
      // Upsert user state
      const { error } = await supabaseAdmin
        .from('user_states')
        .upsert({
          user_id: userId,
          state,
          data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user state:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: string, supabaseAdmin: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "admin_users")
      .single();
    
    if (error || !data) {
      return false;
    }
    
    const adminUsers = data.value.split(',').map((id: string) => id.trim());
    return adminUsers.includes(userId);
  } catch (error) {
    console.error("Exception checking admin status:", error);
    return false;
  }
}

/**
 * Log an error to the database
 */
export async function logError(
  error: any,
  context: any,
  supabaseAdmin: any
) {
  try {
    const errorData = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      context: context || {},
      timestamp: new Date().toISOString()
    };

    const { error: dbError } = await supabaseAdmin
      .from('error_logs')
      .insert([errorData]);
    
    if (dbError) {
      console.error("Failed to log error to database:", dbError);
    }
  } catch (logError) {
    console.error("Exception logging error to database:", logError);
  }
}
