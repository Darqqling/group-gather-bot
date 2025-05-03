
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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

    // Get the token from our app_secrets table
    const { data: secretData, error: secretError } = await supabaseAdmin
      .from('app_secrets')
      .select('value')
      .eq('key', 'TELEGRAM_BOT_TOKEN')
      .single();
      
    if (secretError || !secretData) {
      throw new Error('Failed to retrieve Telegram bot token from database');
    }
    
    const botToken = secretData.value;
    
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured in database');
    }

    // Parse the request body to determine the action
    let action = 'set'; // Default action
    let requestBody = {};
    
    try {
      const text = await req.text();
      if (text && text.trim().length > 0) {
        requestBody = JSON.parse(text);
        if (requestBody.action) {
          action = requestBody.action;
        }
      }
    } catch (parseError) {
      console.log('No valid JSON in request body or empty body, using default action');
    }
    
    // Default webhook URL - get from environment or use hardcoded value
    const webhookBaseUrl = Deno.env.get('WEBHOOK_BASE_URL') || 'https://smlqmythgpkucxbaxuob.supabase.co';
    const webhookUrl = `${webhookBaseUrl}/functions/v1/telegram-webhook`;
    
    console.log(`Using webhook URL: ${webhookUrl}`);
    console.log(`Action: ${action}`);
    console.log(`Using bot token: ${botToken.substring(0, 5)}...${botToken.substring(botToken.length - 5)}`); // Logging part of token for debugging
    
    // Handle different actions
    if (action === 'set' || !action) {
      // Test the token first to validate it's working
      const getMeUrl = `https://api.telegram.org/bot${botToken}/getMe`;
      const testResponse = await fetch(getMeUrl);
      const testResult = await testResponse.json();
      
      if (!testResult.ok) {
        throw new Error(`Invalid bot token: ${testResult.description}`);
      }
      
      console.log(`Bot token is valid for bot: ${testResult.result.username}`);

      // Set the webhook
      const setWebhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`;
      const response = await fetch(setWebhookUrl);
      const result = await response.json();

      if (!result.ok) {
        throw new Error(`Failed to set webhook: ${result.description}`);
      }

      // Get webhook info to verify
      const getWebhookInfoUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
      const webhookInfoResponse = await fetch(getWebhookInfoUrl);
      const webhookInfo = await webhookInfoResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Webhook configured successfully',
          webhookInfo: webhookInfo.result
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else if (action === 'check') {
      // Get webhook info
      const getWebhookInfoUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
      const webhookInfoResponse = await fetch(getWebhookInfoUrl);
      const webhookInfo = await webhookInfoResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          webhookInfo: webhookInfo.result
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else if (action === 'delete') {
      // Delete the webhook
      const deleteWebhookUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
      const response = await fetch(deleteWebhookUrl);
      const result = await response.json();

      return new Response(
        JSON.stringify({
          success: result.ok,
          message: result.ok ? 'Webhook deleted successfully' : result.description
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error managing webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
});
