import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const DEEP_URL = "https://api.deepseek.com/v1/chat/completions";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      }
    );
  }

  try {
    const formData = await req.formData();
    const fileUrls: string[] = [];
    const api_key = formData.get("api_key");

    if (!api_key) {
      throw new Error("API key is required");
    }

    // Collect all file URLs from form data
    for (let i = 0; formData.get(`file${i}`) !== null; i++) {
      fileUrls.push(formData.get(`file${i}`) as string);
    }

    if (fileUrls.length === 0) {
      throw new Error("No files provided");
    }

    // Construct the message for DeepSeek
    const message = {
      role: "user",
      content: `Analyze the following files:\n${fileUrls.join('\n')}`
    };

    const requestBody = {
      model: "deepseek-chat",
      messages: [message],
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    };

    console.log("[deepseek-file-proxy] Sending request:", {
      url: DEEP_URL,
      headers: {
        Authorization: 'Bearer [REDACTED]',
        'Content-Type': 'application/json'
      },
      bodyKeys: Object.keys(requestBody)
    });

    const response = await fetch(DEEP_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${api_key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[deepseek-file-proxy] API Error:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorBody
      });
      throw new Error(`DeepSeek API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`);
    }

    const data = await response.json();
    
    // Ensure we have a valid response from DeepSeek
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from DeepSeek API");
    }

    // Process the analysis results
    const analysisResults = fileUrls.map(url => ({
      file: url,
      analysis: data.choices[0].message.content
    }));

    console.log("[deepseek-file-proxy] Successful response:", {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      resultCount: analysisResults.length
    });

    return new Response(
      JSON.stringify({ content: analysisResults }),
      {
        headers: { 
          ...CORS_HEADERS,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("[deepseek-file-proxy] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      }
    );
  }
});