
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Main server function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get pathname from URL
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    console.log(`Docs request: ${req.method} ${pathname}`);
    
    // Remove the /docs prefix if it exists (for local development vs production)
    const normalizedPath = pathname.replace(/^\/docs/, "");
    console.log(`Normalized path: ${normalizedPath}`);
    
    // Read the files dynamically
    let html, yaml;
    try {
      html = await Deno.readTextFile(new URL("./index.html", import.meta.url));
      yaml = await Deno.readTextFile(new URL("./group_collect_api.yaml", import.meta.url));
      console.log("Successfully read files");
    } catch (fileError) {
      console.error("Error reading files:", fileError);
      throw fileError;
    }
    
    // Serve YAML file
    if (normalizedPath.endsWith("/group_collect_api.yaml") || normalizedPath === "/group_collect_api.yaml") {
      return new Response(yaml, { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/yaml" 
        } 
      });
    }
    
    // Serve HTML by default
    return new Response(html, { 
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/html" 
      } 
    });
  } catch (error) {
    console.error("Error processing docs request:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
