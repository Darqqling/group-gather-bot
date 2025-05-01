
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

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
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured')
    }

    // Parse the request body to determine the action
    const { action } = await req.json()
    
    // Default webhook URL
    const webhookUrl = 'https://smlqmythgpkucxbaxuob.supabase.co/functions/v1/telegram-webhook'
    
    // Handle different actions
    if (action === 'set' || !action) {
      // Set the webhook
      const setWebhookUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`
      const response = await fetch(setWebhookUrl)
      const result = await response.json()

      if (!result.ok) {
        throw new Error(`Failed to set webhook: ${result.description}`)
      }

      // Get webhook info to verify
      const getWebhookInfoUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`
      const webhookInfoResponse = await fetch(getWebhookInfoUrl)
      const webhookInfo = await webhookInfoResponse.json()

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
      const getWebhookInfoUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`
      const webhookInfoResponse = await fetch(getWebhookInfoUrl)
      const webhookInfo = await webhookInfoResponse.json()

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
      const deleteWebhookUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`
      const response = await fetch(deleteWebhookUrl)
      const result = await response.json()

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
      throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('Error managing webhook:', error)
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
})
