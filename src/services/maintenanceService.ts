
import { supabase } from "@/integrations/supabase/client";

export const MAINTENANCE_MODE_SETTING_KEY = 'maintenance_mode';
export const MAINTENANCE_MESSAGE_SETTING_KEY = 'maintenance_message';

export const getMaintenanceStatus = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', MAINTENANCE_MODE_SETTING_KEY)
    .single();
  
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
    .single();
  
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
