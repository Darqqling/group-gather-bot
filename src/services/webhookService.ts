
import { supabase } from "@/integrations/supabase/client";

export const WEBHOOK_URL_SETTING_KEY = 'telegram_webhook_url';
export const MAINTENANCE_MODE_KEY = 'maintenance_mode';

export const getWebhookUrl = async (): Promise<string | null> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', WEBHOOK_URL_SETTING_KEY)
    .single();
  
  if (error) {
    console.error("Error fetching webhook URL:", error);
    return null;
  }
  
  return data?.value || null;
};

export const setWebhookUrl = async (url: string): Promise<boolean> => {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ 
      key: WEBHOOK_URL_SETTING_KEY, 
      value: url,
      description: 'URL for Telegram bot webhook'
    });
  
  if (error) {
    console.error("Error updating webhook URL:", error);
    return false;
  }
  
  return true;
};

export const setupWebhook = async (webhookUrl?: string): Promise<any> => {
  try {
    const { data, error } = await supabase.functions.invoke('setup-telegram-webhook', {
      body: webhookUrl ? { webhookUrl } : {}
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error setting up webhook:", error);
    throw error;
  }
};

export const getDefaultWebhookUrl = (): string => {
  return `https://smlqmythgpkucxbaxuob.supabase.co/functions/v1/telegram-webhook`;
};

export const getMaintenanceMode = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', MAINTENANCE_MODE_KEY)
    .single();
  
  if (error) {
    console.error("Error fetching maintenance mode:", error);
    return false;
  }
  
  return data?.value === 'true' || data?.value === true;
};

export const setMaintenanceMode = async (enabled: boolean, message: string): Promise<boolean> => {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ 
      key: MAINTENANCE_MODE_KEY, 
      value: enabled.toString(),
      description: message || 'Бот временно находится в режиме обслуживания. Пожалуйста, попробуйте позже.'
    });
  
  if (error) {
    console.error("Error updating maintenance mode:", error);
    return false;
  }
  
  return true;
};
