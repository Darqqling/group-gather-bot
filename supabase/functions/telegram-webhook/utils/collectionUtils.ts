
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
