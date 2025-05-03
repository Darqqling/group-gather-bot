
/**
 * Functions for working with collections in the database
 */

/**
 * Update the state of a collection creation flow
 */
export async function updateCollectionState(
  supabaseAdmin: any,
  userId: string,
  data: any
) {
  try {
    // Update user state with collection creation data
    const { error } = await supabaseAdmin
      .from('user_states')
      .upsert({
        user_id: userId,
        state: 'creating_collection',
        data: data
      });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating collection state:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new collection
 */
export async function createCollection(
  supabaseAdmin: any,
  collection: any
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('collections')
      .insert([collection])
      .select();
    
    if (error) throw error;
    return { success: true, collection: data[0] };
  } catch (error) {
    console.error("Error creating collection:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get collections for a specific user
 */
export async function getUserCollections(
  supabaseAdmin: any,
  userId: string,
  status?: string
) {
  try {
    let query = supabaseAdmin
      .from('collections')
      .select()
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { success: true, collections: data };
  } catch (error) {
    console.error("Error getting user collections:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all active collections
 */
export async function getActiveCollections(
  supabaseAdmin: any
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('collections')
      .select()
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { success: true, collections: data };
  } catch (error) {
    console.error("Error getting active collections:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update collection status
 */
export async function updateCollectionStatus(
  supabaseAdmin: any,
  collectionId: string,
  status: string
) {
  try {
    const { error } = await supabaseAdmin
      .from('collections')
      .update({ status })
      .eq('id', collectionId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Error updating collection status:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Record a payment to a collection
 */
export async function recordPayment(
  supabaseAdmin: any,
  collectionId: string,
  userId: string,
  amount: number
) {
  try {
    const { error } = await supabaseAdmin
      .from('payments')
      .insert([{
        collection_id: collectionId,
        user_id: userId,
        amount,
        status: 'pending confirmation'
      }]);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Error recording payment:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update collection amount
 */
export async function updateCollectionAmount(
  supabaseAdmin: any,
  collectionId: string,
  amount: number
) {
  try {
    // Get current collection amount
    const { data: collection, error: getError } = await supabaseAdmin
      .from('collections')
      .select('current_amount')
      .eq('id', collectionId)
      .single();
    
    if (getError) throw getError;
    
    // Calculate new amount
    const currentAmount = collection.current_amount || 0;
    const newAmount = currentAmount + amount;
    
    // Update collection with new amount
    const { error: updateError } = await supabaseAdmin
      .from('collections')
      .update({ current_amount: newAmount })
      .eq('id', collectionId);
    
    if (updateError) throw updateError;
    
    return { success: true };
  } catch (error) {
    console.error("Error updating collection amount:", error);
    return { success: false, error: error.message };
  }
}
