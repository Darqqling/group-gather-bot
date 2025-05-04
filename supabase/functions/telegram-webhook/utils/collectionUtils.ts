/**
 * Утилиты для работы со сборами средств
 */

import { DialogState, CollectionCreationData, CollectionCreationStep, setDialogState } from "./dialogStateManager.ts";
import { getUserUuidByTelegramId } from "./databaseUtils.ts";

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
 * Создание нового сбора
 */
export async function createCollection(supabaseAdmin: any, collectionData: any) {
  try {
    console.log("Creating collection:", collectionData);
    
    // Проверяем, что creator_id существует и это строка
    if (!collectionData.creator_id || typeof collectionData.creator_id !== 'string') {
      console.error("Invalid creator_id:", collectionData.creator_id);
      return { success: false, error: "Некорректный идентификатор создателя" };
    }
    
    // Получаем UUID пользователя по его Telegram ID
    const creatorUuid = await getUserUuidByTelegramId(collectionData.creator_id, supabaseAdmin);
    
    if (!creatorUuid) {
      console.error(`Could not find UUID for user with Telegram ID: ${collectionData.creator_id}`);
      return { success: false, error: "Пользователь не найден в системе" };
    }
    
    console.log(`Using creator UUID: ${creatorUuid} for Telegram ID: ${collectionData.creator_id}`);
    
    // Создаем новую запись о сборе с использованием UUID вместо Telegram ID
    const { data, error } = await supabaseAdmin
      .from("collections")
      .insert({
        title: collectionData.title,
        description: collectionData.description,
        target_amount: collectionData.target_amount,
        current_amount: collectionData.current_amount || 0,
        deadline: collectionData.deadline,
        creator_id: creatorUuid, // Используем UUID вместо Telegram ID
        status: collectionData.status || "active"
      })
      .select();
    
    if (error) {
      console.error("Error creating collection:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, collection: data[0] };
  } catch (error) {
    console.error("Exception creating collection:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Получение всех сборов пользователя
 */
export async function getUserCollections(supabaseAdmin: any, userId: string, status: string | null = null) {
  try {
    console.log(`Getting collections for user ID ${userId} with status ${status || 'any'}`);
    
    if (!userId || typeof userId !== 'string') {
      console.error("Invalid userId:", userId);
      return { success: false, error: "Некорректный идентификатор пользователя" };
    }
    
    // Get the user UUID from telegram_id
    const userUuid = await getUserUuidByTelegramId(userId, supabaseAdmin);
    
    if (!userUuid) {
      console.error(`Could not find UUID for user with Telegram ID: ${userId}`);
      return { success: false, error: "Пользователь не найден в системе" };
    }
    
    console.log(`Found UUID ${userUuid} for Telegram ID ${userId}, fetching collections`);
    
    let query = supabaseAdmin
      .from("collections")
      .select("*")
      .eq("creator_id", userUuid)  // Use UUID instead of Telegram ID
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
 * Получение всех активных сборов
 */
export async function getActiveCollections(supabaseAdmin: any) {
  try {
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select("*")
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
 * Получение сбора по ID
 */
export async function getCollection(supabaseAdmin: any, collectionId: string) {
  try {
    console.log(`Getting collection with ID ${collectionId}`);
    
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching collection:", error);
      return { success: false, error: error.message };
    }
    
    if (!data) {
      return { success: false, error: "Сбор не найден" };
    }
    
    return { success: true, collection: data };
  } catch (error) {
    console.error("Exception fetching collection:", error);
    return { success: false, error: error.message || "Неизвестная ошибка при получении сбора" };
  }
}

/**
 * Обновление статуса сбора
 */
export async function updateCollectionStatus(supabaseAdmin: any, collectionId: string, newStatus: string) {
  try {
    console.log(`Updating collection ${collectionId} status to ${newStatus}`);
    
    const { error } = await supabaseAdmin
      .from("collections")
      .update({
        status: newStatus,
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
 * Запись платежа
 */
export async function recordPayment(supabaseAdmin: any, collectionId: string, userId: string, amount: number) {
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
 * Обновление суммы сбора
 */
export async function updateCollectionAmount(supabaseAdmin: any, collectionId: string, amount: number) {
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
 * Получение платежей для сбора
 */
export async function getCollectionPayments(supabaseAdmin: any, collectionId: string) {
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
