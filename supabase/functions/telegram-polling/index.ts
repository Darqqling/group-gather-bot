import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import { handleTelegramUpdates } from "./handlers/messageHandlers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON payload" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Handle different actions
    const action = body.action || "process";
    
    if (action === "reset") {
      // Reset the update ID counter to force getting fresh updates
      const { error } = await supabaseAdmin
        .from("app_settings")
        .upsert({ 
          key: "telegram_last_update_id", 
          value: "0",
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });
      
      if (error) {
        console.error("Error resetting update ID:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to reset update counter" }),
          { 
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      console.log("Successfully reset Telegram update counter");
      return new Response(
        JSON.stringify({ success: true, message: "Update counter reset" }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } else if (action === "process") {
      // Process updates as normal
      const result = await handleTelegramUpdates(supabaseAdmin);
      
      return new Response(
        JSON.stringify(result),
        { 
          status: result.success ? 200 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid action" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
