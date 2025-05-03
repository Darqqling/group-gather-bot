
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
        language_code: user.language_code || null,
        last_active_at: new Date().toISOString()
      }, {
        onConflict: 'telegram_id'
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

/**
 * Get user state from database
 */
export async function getUserState(userId: string, supabaseAdmin: any) {
  try {
    // Проверяем сначала в новой таблице user_states
    const { data: userStateData, error: userStateError } = await supabaseAdmin
      .from("user_states")
      .select("state, data")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (userStateError && userStateError.code !== "PGRST116") {
      console.error("Error fetching user state from user_states:", userStateError);
    }
    
    // Если нашли данные в таблице user_states, возвращаем их
    if (userStateData) {
      return {
        state: userStateData.state,
        data: userStateData.data
      };
    }
    
    // Если нет, проверяем в таблице telegram_users (обратная совместимость)
    const { data, error } = await supabaseAdmin
      .from("telegram_users")
      .select("current_state, state_data")
      .eq("telegram_id", userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching user state from telegram_users:", error);
      return null;
    }
    
    // Если нашли данные в таблице telegram_users, сохраняем их в новую таблицу user_states
    // и возвращаем
    if (data && data.current_state) {
      try {
        await updateUserState(userId, data.current_state, data.state_data, supabaseAdmin);
      } catch (migrationError) {
        console.error("Error migrating user state to user_states:", migrationError);
      }
      
      return {
        state: data.current_state,
        data: data.state_data
      };
    }
    
    return null;
  } catch (error) {
    console.error("Exception fetching user state:", error);
    return null;
  }
}

/**
 * Update user state
 */
export async function updateUserState(userId: string, state: string | null, stateData: any | null, supabaseAdmin: any) {
  try {
    if (state === null) {
      // Удаляем состояние пользователя
      const { error: deleteError } = await supabaseAdmin
        .from("user_states")
        .delete()
        .eq("user_id", userId);
      
      if (deleteError) {
        console.error("Error deleting user state:", deleteError);
      }
      
      // Также очищаем состояние в telegram_users для обратной совместимости
      const { error: updateError } = await supabaseAdmin
        .from("telegram_users")
        .update({ current_state: null, state_data: null })
        .eq("telegram_id", userId);
      
      if (updateError) {
        console.error("Error clearing state in telegram_users:", updateError);
      }
      
      return true;
    } else {
      // Добавляем/обновляем состояние в user_states
      const { error: upsertError } = await supabaseAdmin
        .from("user_states")
        .upsert({
          user_id: userId,
          state,
          data: stateData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (upsertError) {
        console.error("Error upserting user state:", upsertError);
        return false;
      }
      
      // Также обновляем состояние в telegram_users для обратной совместимости
      const update: any = { current_state: state };
      if (stateData !== undefined) {
        update.state_data = stateData;
      }
      
      const { error: updateError } = await supabaseAdmin
        .from("telegram_users")
        .update(update)
        .eq("telegram_id", userId);
      
      if (updateError) {
        console.error("Error updating state in telegram_users:", updateError);
      }
      
      return true;
    }
  } catch (error) {
    console.error("Exception updating user state:", error);
    return false;
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
 * Get collection by ID
 */
export async function getCollectionById(collectionId: string, supabaseAdmin: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select(`
        id, 
        title, 
        description, 
        creator_id, 
        target_amount, 
        current_amount, 
        status, 
        deadline,
        telegram_users!collections_creator_id_fkey (
          telegram_id,
          first_name,
          last_name,
          username
        )
      `)
      .eq("id", collectionId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching collection:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Exception fetching collection:", error);
    return null;
  }
}

/**
 * Get user collections
 */
export async function getUserCollections(userId: string, status: string | null, supabaseAdmin: any) {
  try {
    let query = supabaseAdmin
      .from("collections")
      .select(`
        id, 
        title, 
        description, 
        creator_id, 
        target_amount, 
        current_amount, 
        status, 
        deadline,
        telegram_users!collections_creator_id_fkey (
          telegram_id,
          first_name,
          last_name,
          username
        )
      `)
      .eq("creator_id", userId);
    
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching user collections:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Exception fetching user collections:", error);
    return null;
  }
}

/**
 * Get collection payments
 */
export async function getCollectionPayments(collectionId: string, supabaseAdmin: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select(`
        id, 
        amount, 
        status, 
        created_at, 
        confirmed_at,
        telegram_users!payments_user_id_fkey (
          telegram_id,
          first_name,
          last_name,
          username
        )
      `)
      .eq("collection_id", collectionId);
    
    if (error) {
      console.error("Error fetching collection payments:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Exception fetching collection payments:", error);
    return null;
  }
}
