
/**
 * Утилиты для работы с коллекциями
 */

import { DialogState, CollectionCreationData, CollectionCreationStep, setDialogState } from "./dialogStateManager.ts";

/**
 * Обновление состояния создания коллекции
 */
export async function updateCollectionState(
  supabaseAdmin: any,
  userId: string,
  stateData: CollectionCreationData
) {
  try {
    return await setDialogState(userId, DialogState.CREATING_COLLECTION, stateData, supabaseAdmin);
  } catch (error) {
    console.error("Error updating collection state:", error);
    throw error;
  }
}

/**
 * Создание новой коллекции
 */
export async function createCollection(
  supabaseAdmin: any,
  collection: any
) {
  try {
    console.log("Creating collection:", collection);
    
    // Проверяем, что creator_id существует и это строка
    if (!collection.creator_id || typeof collection.creator_id !== 'string') {
      console.error("Invalid creator_id:", collection.creator_id);
      return { success: false, error: "Некорректный идентификатор создателя" };
    }
    
    // Создаем новую запись о сборе
    const { data, error } = await supabaseAdmin
      .from("collections")
      .insert({
        title: collection.title,
        description: collection.description,
        target_amount: collection.target_amount,
        current_amount: collection.current_amount || 0,
        deadline: collection.deadline,
        creator_id: collection.creator_id,
        status: collection.status || "active"
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error("Error creating collection:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, collection: data };
  } catch (error) {
    console.error("Exception creating collection:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Обновление статуса коллекции
 */
export async function updateCollectionStatus(
  supabaseAdmin: any,
  collectionId: string,
  status: string
) {
  try {
    console.log(`Updating collection ${collectionId} status to ${status}`);
    
    const { error } = await supabaseAdmin
      .from("collections")
      .update({
        status,
        last_updated_at: new Date().toISOString()
      })
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
 * Получение коллекции по ID
 */
export async function getCollection(
  supabaseAdmin: any,
  collectionId: string
) {
  try {
    console.log(`Getting collection with id: ${collectionId}`);
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
        deadline
      `)
      .eq("id", collectionId)
      .maybeSingle();
    
    if (error) {
      console.error("Error getting collection:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, collection: data };
  } catch (error) {
    console.error("Exception getting collection:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Получение коллекций пользователя
 */
export async function getUserCollections(
  supabaseAdmin: any,
  userId: string,
  status: string | null = null
) {
  try {
    console.log(`Getting collections for user ${userId} with status ${status || 'any'}`);
    
    if (!userId || typeof userId !== 'string') {
      console.error("Invalid userId:", userId);
      return { success: false, error: "Некорректный идентификатор пользователя" };
    }
    
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
        deadline
      `)
      .eq("creator_id", userId)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error getting user collections:", error);
      return { success: false, error: error.message };
    }
    
    // Проверить, есть ли данные
    if (!data || data.length === 0) {
      return { success: true, collections: [], message: "У вас пока нет сборов" };
    }
    
    return { success: true, collections: data };
  } catch (error) {
    console.error("Exception getting user collections:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Получение активных коллекций
 */
export async function getActiveCollections(supabaseAdmin: any) {
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
        deadline
      `)
      .eq("status", "active")
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error getting active collections:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, collections: data };
  } catch (error) {
    console.error("Exception getting active collections:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Регистрация платежа
 */
export async function recordPayment(
  supabaseAdmin: any,
  collectionId: string,
  userId: string,
  amount: number
) {
  try {
    console.log(`Recording payment of ${amount} by user ${userId} for collection ${collectionId}`);
    
    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert({
        collection_id: collectionId,
        user_id: userId,
        amount,
        status: "pending" // Ожидает подтверждения организатором
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.error("Error recording payment:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, payment: data };
  } catch (error) {
    console.error("Exception recording payment:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Обновление суммы коллекции
 */
export async function updateCollectionAmount(
  supabaseAdmin: any,
  collectionId: string,
  amount: number
) {
  try {
    console.log(`Updating collection ${collectionId} amount by ${amount}`);
    
    // Получаем текущую сумму
    const { data, error: selectError } = await supabaseAdmin
      .from("collections")
      .select("current_amount")
      .eq("id", collectionId)
      .maybeSingle();
    
    if (selectError) {
      console.error("Error fetching collection amount:", selectError);
      return { success: false, error: selectError.message };
    }
    
    const currentAmount = data?.current_amount || 0;
    const newAmount = currentAmount + amount;
    
    // Обновляем сумму
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
 * Получение платежей коллекции
 */
export async function getCollectionPayments(
  supabaseAdmin: any,
  collectionId: string
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select(`
        id, 
        amount, 
        status, 
        created_at, 
        confirmed_at,
        user_id
      `)
      .eq("collection_id", collectionId);
    
    if (error) {
      console.error("Error fetching collection payments:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, payments: data };
  } catch (error) {
    console.error("Exception fetching collection payments:", error);
    return { success: false, error: error.message };
  }
}
