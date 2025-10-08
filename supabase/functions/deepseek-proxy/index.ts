import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const DEEP_URL = "https://api.deepseek.com/v1/chat/completions";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Content-Type": "application/json"
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const { messages, api_key } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!api_key) {
      return new Response(
        JSON.stringify({ error: "API key is required" }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    console.log("[DeepSeek] Sending request to DeepSeek API");

    const response = await fetch(DEEP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${api_key}`,
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    console.log("[DeepSeek] Response status:", response.status);

    // Get the raw response text first
    const responseText = await response.text();
    console.log("[DeepSeek] Raw response:", responseText);

    if (!response.ok) {
      console.error("[DeepSeek] API Error:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      return new Response(
        JSON.stringify({ 
          error: `DeepSeek API error (${response.status}): ${responseText}`,
          timestamp: new Date().toISOString()
        }),
        { status: response.status, headers: CORS_HEADERS }
      );
    }

    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("[DeepSeek] Failed to parse response as JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON response from DeepSeek API",
          raw: responseText,
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    if (!data.choices?.[0]?.message?.content) {
      console.error("[DeepSeek] Invalid API response structure:", data);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response format from DeepSeek API",
          data: data,
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const content = data.choices[0].message.content.trim();
    if (!content) {
      return new Response(
        JSON.stringify({ 
          error: "Empty response content from DeepSeek API",
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[DeepSeek] Error in deepseek-proxy:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
});