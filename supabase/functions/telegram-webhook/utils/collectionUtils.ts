
// Collection utilities for working with the collections table

/**
 * Update the state data for a user's collection creation process
 */
export async function updateCollectionState(supabaseAdmin: any, userId: string, stateData: any) {
  try {
    await supabaseAdmin
      .from("telegram_users")
      .update({ 
        current_state: "creating_collection",
        state_data: JSON.stringify(stateData)
      })
      .eq("telegram_id", userId);
  } catch (error) {
    console.error("Error updating collection state:", error);
    throw error;
  }
}

/**
 * Create a new collection in the database
 */
export async function createCollection(supabaseAdmin: any, collection: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("collections")
      .insert(collection)
      .select("id")
      .single();
      
    if (error) {
      console.error("Error creating collection:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, collectionId: data.id };
  } catch (error) {
    console.error("Exception creating collection:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get active collections for a user
 */
export async function getUserCollections(supabaseAdmin: any, userId: string, status?: string) {
  try {
    let query = supabaseAdmin
      .from("collections")
      .select("*")
      .eq("creator_id", userId);
      
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching collections:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, collections: data };
  } catch (error) {
    console.error("Exception fetching collections:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update collection status
 */
export async function updateCollectionStatus(supabaseAdmin: any, collectionId: string, status: string) {
  try {
    const { error } = await supabaseAdmin
      .from("collections")
      .update({ status })
      .eq("id", collectionId);
    
    if (error) {
      console.error("Error updating collection status:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Exception updating collection status:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get collection by ID
 */
export async function getCollectionById(supabaseAdmin: any, collectionId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .single();
    
    if (error) {
      console.error("Error fetching collection:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, collection: data };
  } catch (error) {
    console.error("Exception fetching collection:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Record a payment for a collection
 */
export async function recordPayment(supabaseAdmin: any, collectionId: string, userId: string, amount: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert({
        collection_id: collectionId,
        user_id: userId,
        amount,
        status: "pending"
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("Error recording payment:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, paymentId: data.id };
  } catch (error) {
    console.error("Exception recording payment:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update collection amount after payment
 */
export async function updateCollectionAmount(supabaseAdmin: any, collectionId: string, amount: number) {
  try {
    // Get current collection data
    const { data: collection, error: fetchError } = await supabaseAdmin
      .from("collections")
      .select("current_amount")
      .eq("id", collectionId)
      .single();
    
    if (fetchError) {
      console.error("Error fetching collection amount:", fetchError);
      return { success: false, error: fetchError.message };
    }
    
    // Calculate new amount
    const newAmount = (collection.current_amount || 0) + amount;
    
    // Update collection with new amount
    const { error: updateError } = await supabaseAdmin
      .from("collections")
      .update({ 
        current_amount: newAmount,
        last_updated_at: new Date().toISOString()
      })
      .eq("id", collectionId);
    
    if (updateError) {
      console.error("Error updating collection amount:", updateError);
      return { success: false, error: updateError.message };
    }
    
    return { success: true, newAmount };
  } catch (error) {
    console.error("Exception updating collection amount:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get collections by status for all users (admin function)
 */
export async function getAllCollections(supabaseAdmin: any, status?: string) {
  try {
    let query = supabaseAdmin
      .from("collections")
      .select("*, telegram_users(first_name, last_name, username)");
      
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching all collections:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, collections: data };
  } catch (error) {
    console.error("Exception fetching all collections:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get active collections available for payments
 */
export async function getActiveCollections(supabaseAdmin: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching active collections:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, collections: data };
  } catch (error) {
    console.error("Exception fetching active collections:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get payments for a collection
 */
export async function getPaymentsForCollection(supabaseAdmin: any, collectionId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("*, telegram_users(first_name, last_name, username)")
      .eq("collection_id", collectionId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching payments:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, payments: data };
  } catch (error) {
    console.error("Exception fetching payments:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Confirm a payment
 */
export async function confirmPayment(supabaseAdmin: any, paymentId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("payments")
      .update({ 
        status: "confirmed",
        confirmed_at: new Date().toISOString()
      })
      .eq("id", paymentId);
    
    if (error) {
      console.error("Error confirming payment:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Exception confirming payment:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Reset user state
 */
export async function resetUserState(supabaseAdmin: any, userId: string) {
  try {
    await supabaseAdmin
      .from("telegram_users")
      .update({ 
        current_state: null,
        state_data: null
      })
      .eq("telegram_id", userId);
      
    return { success: true };
  } catch (error) {
    console.error("Exception resetting user state:", error);
    return { success: false, error: error.message };
  }
}
