
/**
 * Управление состояниями диалогов в Telegram боте
 */

import { updateUserState, getUserState } from "./databaseUtils.ts";

// Основные состояния диалогов
export enum DialogState {
  IDLE = "idle",               // Нет активного диалога
  CREATING_COLLECTION = "creating_collection", // Создание сбора
  PAYMENT_FLOW = "payment_flow", // Процесс внесения платежа
  ADMIN_MODE = "admin_mode"    // Режим администратора
}

// Подсостояния для создания сбора
export enum CollectionCreationStep {
  TITLE = "title",            // Ввод названия
  DESCRIPTION = "description", // Ввод описания
  AMOUNT = "amount",          // Ввод суммы
  DEADLINE = "deadline"       // Ввод даты дедлайна
}

// Подсостояния для платежей
export enum PaymentFlowStep {
  SELECT_COLLECTION = "select_collection", // Выбор сбора
  ENTER_AMOUNT = "enter_amount",           // Ввод суммы
  CONFIRM = "confirm"                      // Подтверждение
}

// Интерфейс для данных состояния создания сбора
export interface CollectionCreationData {
  step: CollectionCreationStep;
  title?: string;
  description?: string;
  target_amount?: number;
}

// Интерфейс для данных состояния платежа
export interface PaymentFlowData {
  step: PaymentFlowStep;
  collection_id?: string;
  amount?: number;
}

// Базовый интерфейс для данных состояния
export interface DialogStateData {
  [key: string]: any;
}

// Интерфейс для хранения контекста сбора
export interface CollectionContext {
  collectionId: string;
  status?: string;
  title?: string;
}

/**
 * Установить состояние диалога для пользователя
 */
export async function setDialogState<T extends DialogStateData>(
  userId: string,
  state: DialogState | null,
  data: T | null,
  supabaseAdmin: any
): Promise<boolean> {
  try {
    console.log(`Setting dialog state for user ${userId}: ${state}`);
    return await updateUserState(userId, state, data, supabaseAdmin);
  } catch (error) {
    console.error("Error setting dialog state:", error);
    return false;
  }
}

/**
 * Получить текущее состояние диалога пользователя
 */
export async function getDialogState(
  userId: string,
  supabaseAdmin: any
): Promise<{ state: DialogState | null; data: DialogStateData | null }> {
  try {
    const userState = await getUserState(userId, supabaseAdmin);
    
    if (!userState || !userState.state) {
      return { state: null, data: null };
    }
    
    return {
      state: userState.state as DialogState,
      data: userState.data as DialogStateData
    };
  } catch (error) {
    console.error("Error getting dialog state:", error);
    return { state: null, data: null };
  }
}

/**
 * Сброс состояния диалога для пользователя
 */
export async function resetDialogState(
  userId: string,
  supabaseAdmin: any
): Promise<boolean> {
  try {
    console.log(`Resetting dialog state for user ${userId}`);
    return await updateUserState(userId, null, null, supabaseAdmin);
  } catch (error) {
    console.error("Error resetting dialog state:", error);
    return false;
  }
}

/**
 * Обновить данные состояния диалога для пользователя
 */
export async function updateDialogData<T extends DialogStateData>(
  userId: string,
  state: DialogState,
  data: T,
  supabaseAdmin: any
): Promise<boolean> {
  try {
    console.log(`Updating dialog data for user ${userId} in state ${state}`);
    return await updateUserState(userId, state, data, supabaseAdmin);
  } catch (error) {
    console.error("Error updating dialog data:", error);
    return false;
  }
}

/**
 * Проверить, находится ли пользователь в определенном состоянии диалога
 */
export async function isInDialogState(
  userId: string,
  state: DialogState,
  supabaseAdmin: any
): Promise<boolean> {
  const dialogState = await getDialogState(userId, supabaseAdmin);
  return dialogState.state === state;
}

/**
 * Получить текущий контекст сбора для пользователя
 */
export async function getCollectionContext(
  userId: string,
  supabaseAdmin: any
): Promise<CollectionContext | null> {
  try {
    const dialogState = await getDialogState(userId, supabaseAdmin);
    
    if (!dialogState || !dialogState.data || !dialogState.data.collectionContext) {
      return null;
    }
    
    return dialogState.data.collectionContext as CollectionContext;
  } catch (error) {
    console.error("Error getting collection context:", error);
    return null;
  }
}

/**
 * Установить контекст сбора для пользователя
 */
export async function setCollectionContext(
  userId: string,
  context: CollectionContext,
  supabaseAdmin: any
): Promise<boolean> {
  try {
    const dialogState = await getDialogState(userId, supabaseAdmin);
    
    // Создаем или обновляем данные состояния
    const data = dialogState && dialogState.data ? { ...dialogState.data } : {};
    data.collectionContext = context;
    
    // Сохраняем контекст в текущем состоянии диалога
    const state = dialogState && dialogState.state ? dialogState.state : DialogState.IDLE;
    return await updateDialogData(userId, state, data, supabaseAdmin);
  } catch (error) {
    console.error("Error setting collection context:", error);
    return false;
  }
}

/**
 * Очистить контекст сбора для пользователя
 */
export async function clearCollectionContext(
  userId: string,
  supabaseAdmin: any
): Promise<boolean> {
  try {
    const dialogState = await getDialogState(userId, supabaseAdmin);
    
    // Если нет данных состояния, нечего очищать
    if (!dialogState || !dialogState.data) {
      return true;
    }
    
    // Создаем копию данных без контекста сбора
    const data = { ...dialogState.data };
    delete data.collectionContext;
    
    // Сохраняем обновленные данные
    const state = dialogState.state ? dialogState.state : DialogState.IDLE;
    return await updateDialogData(userId, state, data, supabaseAdmin);
  } catch (error) {
    console.error("Error clearing collection context:", error);
    return false;
  }
}
