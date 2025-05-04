
/**
 * Модуль валидации команд на основе правил из commandRules.json
 */

import commandRules from "../../../commandRules.json" assert { type: "json" };

// Типы для результатов валидации
export interface ValidationResult {
  allowed: boolean;
  error?: {
    code: string;
    message: string;
  };
  availableStates?: string[];
  allowableActions?: string;
}

/**
 * Функция для валидации команды
 * @param command Команда для проверки
 * @param context Контекст сбора (ID и статус)
 * @returns Результат валидации
 */
export function validateCommand(
  command: string,
  context: { collectionId?: string; status?: string } | null
): ValidationResult {
  // Очищаем команду от параметров
  const commandName = command.split(" ")[0].toLowerCase();
  
  // Проверяем, есть ли такая команда в правилах
  if (!commandRules.commands[commandName]) {
    return { allowed: true }; // Команда не в списке правил - разрешаем по умолчанию
  }
  
  const rule = commandRules.commands[commandName];
  
  // Проверка на необходимость контекста
  if (!rule.no_context) {
    // Команда требует контекста, но он отсутствует
    if (!context || !context.collectionId) {
      return {
        allowed: false,
        error: {
          code: commandRules.errors.no_context_provided.code,
          message: commandRules.errors.no_context_provided.message
        }
      };
    }
    
    // Если сбор не найден, возвращаем ошибку CONTEXT_NOT_FOUND
    // Это проверяется внешне через обращение к базе данных
    
    // Проверка статуса сбора, если указаны допустимые статусы для команды
    if (rule.available_states && context.status) {
      if (!rule.available_states.includes(context.status)) {
        // Определяем доступные действия на основе статуса сбора
        const allowableActions = getAllowableActions(context.status);
        
        return {
          allowed: false,
          error: {
            code: commandRules.errors.invalid_status.code,
            message: commandRules.errors.invalid_status.message
              .replace("%s", getStatusName(context.status))
              .replace("%s", allowableActions)
          },
          availableStates: rule.available_states,
          allowableActions
        };
      }
    }
  }
  
  // Команда прошла все проверки
  return { allowed: true };
}

/**
 * Функция для получения допустимых действий на основе статуса сбора
 */
function getAllowableActions(status: string): string {
  switch (status) {
    case "draft":
      return "редактировать или подтвердить";
    case "active":
      return "вносить платежи, завершить или отменить";
    case "finished":
      return "только просматривать";
    case "cancelled":
      return "только просматривать";
    default:
      return "использовать ограниченно";
  }
}

/**
 * Функция для получения русского названия статуса
 */
function getStatusName(status: string): string {
  switch (status) {
    case "draft":
      return "Черновик";
    case "active":
      return "Активен";
    case "finished":
      return "Завершён";
    case "cancelled":
      return "Отменён";
    default:
      return status;
  }
}

/**
 * Функция для проверки, требует ли команда сброса контекста
 */
export function shouldClearContext(command: string): boolean {
  const commandName = command.split(" ")[0].toLowerCase();
  const rule = commandRules.commands[commandName];
  return rule && rule.no_context === true;
}
