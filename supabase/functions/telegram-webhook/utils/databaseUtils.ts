import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://smlqmythgpkucxbaxuob.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * Save or update user information in the database.
 */
export async function saveUser(user: any, supabaseAdmin: any) {
  const telegramId = user.id.toString();
  const username = user.username || null;
  const firstName = user.first_name || null;
  const lastName = user.last_name || null;
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabaseAdmin
      .from("telegram_users")
      .upsert(
        {
          telegram_id: telegramId,
          username: username,
          first_name: firstName,
          last_name: lastName,
          last_active_at: now,
        },
        { onConflict: "telegram_id" }
      )
      .select();

    if (error) {
      console.error("Error saving user:", error);
    } else {
      console.log(`User ${user.first_name} (${user.id}) saved/updated.`);
    }
  } catch (error) {
    console.error("Unexpected error saving user:", error);
  }
}

/**
 * Log errors to the database for tracking and debugging.
 */
export async function logError(error: any, context: any, supabaseAdmin: any) {
  try {
    const { error: dbError } = await supabaseAdmin
      .from("error_logs")
      .insert([
        {
          message: error.message || String(error),
          stack: error.stack,
          context: context,
        },
      ]);

    if (dbError) {
      console.error("Error logging error to database:", dbError);
    } else {
      console.log("Error logged to database.");
    }
  } catch (error) {
    console.error("Failed to log error to database:", error);
  }
}
