
import { supabase } from "@/integrations/supabase/client";

export const WEBHOOK_URL_SETTING_KEY = 'telegram_webhook_url';

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

export const getDefaultWebhookUrl = (): string => {
  return `https://smlqmythgpkucxbaxuob.supabase.co/functions/v1/telegram-webhook`;
};
