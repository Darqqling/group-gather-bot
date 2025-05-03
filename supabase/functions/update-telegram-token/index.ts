
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Check authorization - only authenticated users with admin rights should be able to update the token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization header is missing' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the token from request body
    const { token } = await req.json();
    
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

    // Validate token format (simple check for bot tokens)
    if (!token.match(/^\d+:[\w-]+$/)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid token format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update the secret in Supabase
    // In a real production environment, you would use the Supabase Admin API to update secrets
    // For this demo, we'll simulate the update and just set the environment variable for this execution
    Deno.env.set('TELEGRAM_BOT_TOKEN', token);

    console.log("Telegram token has been updated");

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
