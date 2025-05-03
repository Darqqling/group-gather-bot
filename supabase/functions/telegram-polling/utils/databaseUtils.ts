
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
    const { error } = await supabaseAdmin
      .from('telegram_users')
      .upsert({
        id: telegramUser.id.toString(),
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        language_code: telegramUser.language_code,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
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
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
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
          data
        });
      
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user state:", error);
    return { success: false, error: error.message };
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
