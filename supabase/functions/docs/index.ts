
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
    
    // Determine which file to serve
    let contentType = "text/html";
    let content = "";
    
    if (pathname.endsWith("group_collect_api.yaml") || pathname.includes("group_collect_api.yaml")) {
      // Serve the YAML file directly from the included_files
      contentType = "application/yaml";
      try {
        content = await Deno.readTextFile("group_collect_api.yaml");
        console.log("Successfully read YAML file");
      } catch (error) {
        console.error("Error reading YAML file:", error);
        throw error;
      }
    } else {
      // Serve the HTML file by default
      try {
        content = await Deno.readTextFile("index.html");
        console.log("Successfully read HTML file");
      } catch (error) {
        console.error("Error reading HTML file:", error);
        throw error;
      }
    }
    
    return new Response(content, { 
      headers: { 
        ...corsHeaders, 
        "Content-Type": contentType
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
