import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

  try {
    const { extractedText, type } = await req.json();

    if (!extractedText) {
      throw new Error("Missing extractedText");
    }

    if (!type || !['bill', 'floorplan'].includes(type)) {
      throw new Error("Invalid or missing type parameter. Must be 'bill' or 'floorplan'");
    }

    const systemPrompt = type === 'bill' 
      ? `You are an expert energy auditor analyzing electricity bills. Extract key information and provide insights to reduce consumption.`
      : `You are an expert building analyst examining floor plans. Extract key information about layout and suggest energy efficiency improvements.`;

    const userPrompt = type === 'bill'
      ? `Analyze this electricity bill text and provide a structured JSON response with:
         - Monthly consumption (kWh)
         - Total cost
         - Cost per kWh
         - Billing period
         - Peak demand if available
         - Usage patterns
         - Anomalies or unusual spikes
         - CO2 footprint estimate
         - Energy saving recommendations

         Text to analyze:
         ${extractedText}`
      : `Analyze this floor plan text and provide a structured JSON response with:
         - Total floor area
         - Number of rooms
         - Room types and dimensions
         - Window locations and counts
         - Layout efficiency score
         - Natural lighting assessment
         - Ventilation assessment
         - Energy efficiency recommendations

         Text to analyze:
         ${extractedText}`;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("DEEPSEEK_API_KEY")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("DeepSeek API Error:", error);
      throw new Error(`DeepSeek API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error("No analysis received from DeepSeek");
    }

    // Try to parse the response as JSON
    let structuredAnalysis;
    try {
      // Look for JSON fence blocks first
      const jsonMatch = analysis.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : analysis;
      structuredAnalysis = JSON.parse(jsonText);
    } catch (error) {
      console.warn("Failed to parse DeepSeek response as JSON:", error);
      structuredAnalysis = { raw_analysis: analysis };
    }

    // Store the analysis in ocr_data
    const { data: supabase } = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/ocr_data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        },
        body: JSON.stringify({
          processed_text: structuredAnalysis,
          metadata: {
            type,
            analysis_timestamp: new Date().toISOString(),
            model: "deepseek-chat"
          }
        })
      }
    );

    return new Response(
      JSON.stringify({ analysis: structuredAnalysis }),
      { 
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS
        }
      }
    );
  } catch (error) {
    console.error("Error in deepseek-analyze:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...CORS_HEADERS
        }
      }
    );
  }
});