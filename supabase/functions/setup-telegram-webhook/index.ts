
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    // Get the webhook URL from request body or use default
    const requestData = await req.json().catch(() => ({}))
    const webhookUrl = requestData.webhookUrl || 'https://smlqmythgpkucxbaxuob.supabase.co/functions/v1/telegram-webhook'
    
    console.log(`Setting webhook to URL: ${webhookUrl}`)

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

  } catch (error) {
    console.error('Error setting up webhook:', error)
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
