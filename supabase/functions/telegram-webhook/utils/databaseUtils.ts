
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

/**
 * Get user state from database
 */
export async function getUserState(userId: string, supabaseAdmin: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("telegram_users")
      .select("current_state, state_data")
      .eq("telegram_id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching user state:", error);
      return null;
    }
    
    return {
      state: data.current_state,
      data: data.state_data ? JSON.parse(data.state_data) : null
    };
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
    const update: any = { current_state: state };
    
    if (stateData !== undefined) {
      update.state_data = stateData ? JSON.stringify(stateData) : null;
    }
    
    const { error } = await supabaseAdmin
      .from("telegram_users")
      .update(update)
      .eq("telegram_id", userId);
    
    if (error) {
      console.error("Error updating user state:", error);
      return false;
    }
    
    return true;
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
      .eq("telegram_users.telegram_id", userId);
    
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
