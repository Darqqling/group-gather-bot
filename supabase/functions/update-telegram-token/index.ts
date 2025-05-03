
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Supabase URL and admin key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables for Supabase client');
    }
    
    // Create a Supabase client with the admin key
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get the token from request body
    let token;
    try {
      const body = await req.json();
      token = body.token;
      
      if (!token) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token is required' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request body' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate token format (simple check for bot tokens)
    if (!token.match(/^\d+:[\w-]+$/)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid token format. It should be in format: 123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Saving token to database...");
    
    // Update the token in app_secrets table
    const { error } = await supabaseAdmin
      .from('app_secrets')
      .upsert({
        key: 'TELEGRAM_BOT_TOKEN',
        value: token,
        description: 'Telegram Bot API Token'
      }, {
        onConflict: 'key'
      });
    
    if (error) {
      console.error('Error setting Telegram token:', error);
      throw new Error(`Failed to update Telegram token in database: ${error.message}`);
    }

    console.log("Telegram token has been updated successfully");

    // Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Telegram token has been updated successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error updating Telegram token:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to update Telegram token' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
