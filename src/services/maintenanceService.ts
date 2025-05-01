
import { supabase } from "@/integrations/supabase/client";

export const MAINTENANCE_MODE_SETTING_KEY = 'maintenance_mode';
export const MAINTENANCE_MESSAGE_SETTING_KEY = 'maintenance_message';

export const getMaintenanceStatus = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', MAINTENANCE_MODE_SETTING_KEY)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching maintenance status:", error);
    return false;
  }
  
  return data?.value === 'true';
};

export const getMaintenanceMessage = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', MAINTENANCE_MESSAGE_SETTING_KEY)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching maintenance message:", error);
    return "Сервис временно недоступен. Пожалуйста, попробуйте позже.";
  }
  
  return data?.value || "Сервис временно недоступен. Пожалуйста, попробуйте позже.";
};

export const setMaintenanceMode = async (enabled: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ 
      key: MAINTENANCE_MODE_SETTING_KEY, 
      value: enabled.toString(),
      description: 'Whether maintenance mode is enabled'
    });
  
  if (error) {
    console.error("Error updating maintenance mode:", error);
    return false;
  }
  
  return true;
};

export const setMaintenanceMessage = async (message: string): Promise<boolean> => {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ 
      key: MAINTENANCE_MESSAGE_SETTING_KEY, 
      value: message,
      description: 'Message shown during maintenance mode'
    });
  
  if (error) {
    console.error("Error updating maintenance message:", error);
    return false;
  }
  
  return true;
};

// Initialize maintenance settings in the database if they don't exist
export const initializeMaintenanceSettings = async (): Promise<void> => {
  try {
    // Check if maintenance mode setting exists
    const { data: modeData } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', MAINTENANCE_MODE_SETTING_KEY)
      .maybeSingle();
    
    // If not, create it with default value (disabled)
    if (!modeData) {
      await supabase
        .from('app_settings')
        .insert({
          key: MAINTENANCE_MODE_SETTING_KEY,
          value: 'false',
          description: 'Whether maintenance mode is enabled'
        });
    }
    
    // Check if maintenance message setting exists
    const { data: messageData } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', MAINTENANCE_MESSAGE_SETTING_KEY)
      .maybeSingle();
    
    // If not, create it with default value
    if (!messageData) {
      await supabase
        .from('app_settings')
        .insert({
          key: MAINTENANCE_MESSAGE_SETTING_KEY,
          value: 'Сервис временно недоступен. Пожалуйста, попробуйте позже.',
          description: 'Message shown during maintenance mode'
        });
    }
  } catch (error) {
    console.error("Error initializing maintenance settings:", error);
  }
};
