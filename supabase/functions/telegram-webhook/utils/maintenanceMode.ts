
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://smlqmythgpkucxbaxuob.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const MAINTENANCE_MODE_KEY = 'maintenance_mode';

/**
 * Check if maintenance mode is currently enabled
 */
export async function isMaintenanceModeEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", MAINTENANCE_MODE_KEY)
      .single();
    
    if (error) {
      console.error("Error checking maintenance mode:", error);
      return false;
    }
    
    return data?.value === 'true' || data?.value === true;
  } catch (error) {
    console.error("Unexpected error checking maintenance mode:", error);
    return false;
  }
}

/**
 * Get the maintenance mode message to display to users
 */
export async function getMaintenanceMessage(): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("description")
      .eq("key", MAINTENANCE_MODE_KEY)
      .single();
    
    if (error) {
      console.error("Error getting maintenance message:", error);
      return "Бот временно находится в режиме обслуживания. Пожалуйста, попробуйте позже.";
    }
    
    return data?.description || "Бот временно находится в режиме обслуживания. Пожалуйста, попробуйте позже.";
  } catch (error) {
    console.error("Unexpected error getting maintenance message:", error);
    return "Бот временно находится в режиме обслуживания. Пожалуйста, попробуйте позже.";
  }
}
