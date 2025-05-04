
/**
 * Утилиты для работы со сборами средств
 */

/**
 * Создание нового сбора
 */
export async function createCollection(supabaseAdmin: any, collectionData: any) {
  try {
    console.log("Creating collection:", collectionData);
    
    // Валидация обязательных полей
    if (!collectionData.title) {
      return { success: false, error: "Название сбора не указано" };
    }
    
    if (!collectionData.target_amount || isNaN(collectionData.target_amount) || collectionData.target_amount <= 0) {
      return { success: false, error: "Некорректная целевая сумма сбора" };
    }
    
    if (!collectionData.deadline) {
      return { success: false, error: "Дедлайн сбора не указан" };
    }
    
    const deadline = new Date(collectionData.deadline);
    if (isNaN(deadline.getTime())) {
      return { success: false, error: "Некорректная дата дедлайна" };
    }
    
    if (!collectionData.creator_id) {
      return { success: false, error: "ID создателя сбора не указан" };
    }
    
    // Создаем сбор
    const { data, error } = await supabaseAdmin
      .from("collections")
      .insert([{
        title: collectionData.title,
        description: collectionData.description || "",
        target_amount: collectionData.target_amount,
        current_amount: 0,
        deadline: collectionData.deadline,
        creator_id: collectionData.creator_id,
        status: "active"
      }])
      .select();
    
    if (error) {
      console.error("Error creating collection in database:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Collection created successfully:", data);
    return { success: true, collection: data[0] };
  } catch (error) {
    console.error("Exception creating collection:", error);
    return { success: false, error: error.message || "Неизвестная ошибка при создании сбора" };
  }
}

/**
 * Получение всех сборов пользователя
 */
export async function getUserCollections(supabaseAdmin: any, userId: string, status: string | null = null) {
  try {
    console.log(`Getting collections for user ${userId} with status ${status || "all"}`);
    
    let query = supabaseAdmin
      .from("collections")
      .select("*")
      .eq("creator_id", userId)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching user collections:", error);
      return { success: false, error: error.message };
    }
    
    console.log(`Retrieved ${data?.length || 0} collections`);
    return { success: true, collections: data };
  } catch (error) {
    console.error("Exception fetching user collections:", error);
    return { success: false, error: error.message || "Неизвестная ошибка при получении сборов" };
  }
}

/**
 * Получение всех активных сборов
 */
export async function getActiveCollections(supabaseAdmin: any) {
  try {
    console.log("Getting all active collections");
    
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select("*")
      .eq("status", "active")
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching active collections:", error);
      return { success: false, error: error.message };
    }
    
    console.log(`Retrieved ${data?.length || 0} active collections`);
    return { success: true, collections: data };
  } catch (error) {
    console.error("Exception fetching active collections:", error);
    return { success: false, error: error.message || "Неизвестная ошибка при получении активных сборов" };
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
    
    if (!["active", "finished", "cancelled"].includes(newStatus)) {
      return { success: false, error: "Некорректный статус сбора" };
    }
    
    const { data, error } = await supabaseAdmin
      .from("collections")
      .update({ 
        status: newStatus,
        last_updated_at: new Date().toISOString()
      })
      .eq("id", collectionId)
      .select();
    
    if (error) {
      console.error("Error updating collection status:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Collection status updated successfully:", data);
    return { success: true, collection: data[0] };
  } catch (error) {
    console.error("Exception updating collection status:", error);
    return { success: false, error: error.message || "Неизвестная ошибка при обновлении статуса сбора" };
  }
}

/**
 * Запись платежа
 */
export async function recordPayment(supabaseAdmin: any, collectionId: string, userId: string, amount: number) {
  try {
    console.log(`Recording payment from user ${userId} for collection ${collectionId} amount ${amount}`);
    
    if (!collectionId) {
      return { success: false, error: "ID сбора не указан" };
    }
    
    if (!userId) {
      return { success: false, error: "ID пользователя не указан" };
    }
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return { success: false, error: "Некорректная сумма платежа" };
    }
    
    // Проверяем, что сбор существует и активен
    const collection = await getCollection(supabaseAdmin, collectionId);
    
    if (!collection.success || !collection.collection) {
      return { success: false, error: collection.error || "Сбор не найден" };
    }
    
    if (collection.collection.status !== "active") {
      return { success: false, error: `Сбор не является активным (текущий статус: ${collection.collection.status})` };
    }
    
    // Записываем платеж
    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert([{
        collection_id: collectionId,
        user_id: userId,
        amount: amount,
        status: "confirmed",
        confirmed_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error("Error recording payment:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Payment recorded successfully:", data);
    return { success: true, payment: data[0] };
  } catch (error) {
    console.error("Exception recording payment:", error);
    return { success: false, error: error.message || "Неизвестная ошибка при записи платежа" };
  }
}

/**
 * Обновление суммы сбора
 */
export async function updateCollectionAmount(supabaseAdmin: any, collectionId: string, amount: number) {
  try {
    console.log(`Updating collection ${collectionId} amount by ${amount}`);
    
    const collection = await getCollection(supabaseAdmin, collectionId);
    
    if (!collection.success || !collection.collection) {
      return { success: false, error: collection.error || "Сбор не найден" };
    }
    
    const currentAmount = collection.collection.current_amount || 0;
    const newAmount = currentAmount + amount;
    
    const { data, error } = await supabaseAdmin
      .from("collections")
      .update({ 
        current_amount: newAmount,
        last_updated_at: new Date().toISOString()
      })
      .eq("id", collectionId)
      .select();
    
    if (error) {
      console.error("Error updating collection amount:", error);
      return { success: false, error: error.message };
    }
    
    console.log("Collection amount updated successfully:", data);
    
    // Если цель сбора достигнута, можно автоматически завершить сбор
    if (newAmount >= collection.collection.target_amount) {
      console.log(`Collection ${collectionId} target amount reached, automatically finishing`);
      // Раскомментировать если нужно автоматическое завершение
      // await updateCollectionStatus(supabaseAdmin, collectionId, "finished");
    }
    
    return { success: true, collection: data[0] };
  } catch (error) {
    console.error("Exception updating collection amount:", error);
    return { success: false, error: error.message || "Неизвестная ошибка при обновлении суммы сбора" };
  }
}

/**
 * Получение платежей для сбора
 */
export async function getCollectionPayments(supabaseAdmin: any, collectionId: string) {
  try {
    console.log(`Getting payments for collection ${collectionId}`);
    
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        amount,
        status,
        confirmed_at,
        created_at,
        telegram_users(first_name, last_name, username)
      `)
      .eq("collection_id", collectionId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching collection payments:", error);
      return { success: false, error: error.message };
    }
    
    console.log(`Retrieved ${data?.length || 0} payments`);
    return { success: true, payments: data };
  } catch (error) {
    console.error("Exception fetching collection payments:", error);
    return { success: false, error: error.message || "Неизвестная ошибка при получении платежей сбора" };
  }
}
