
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers for the API
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Routes definition - will be expanded in the future
const routes = {
  "GET /health": handleHealthCheck,
  "GET /api/health": handleHealthCheck, // Alternative path
};

// Simple health check handler
function handleHealthCheck(_req: Request): Response {
  console.log("Health check endpoint called");
  return new Response(
    JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
    { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}

// Main request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract the path from the URL
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Log the incoming request
    console.log(`Bot API request: ${req.method} ${path}`);

    // Find the appropriate route handler
    for (const [routePattern, routeHandler] of Object.entries(routes)) {
      const [method, routePath] = routePattern.split(" ");
      
      if (req.method === method && (path === routePath || path.endsWith(routePath))) {
        console.log(`Matched route: ${routePattern}`);
        return routeHandler(req);
      }
    }

    // Return 404 for undefined routes
    console.log(`No route matched for: ${req.method} ${path}`);
    return new Response(
      JSON.stringify({ error: "Not found", path }),
      { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
