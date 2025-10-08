import { supabase } from './supabase';

async function uploadFileToStorage(file: File, bucket: string, buildingId: string): Promise<string> {
  try {
    // Generate a unique file name to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[Storage] Upload failed:', error);
      throw error;
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // Store file metadata in the audit_files table with building_id
    const { error: dbError } = await supabase
      .from('audit_files')
      .insert({
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        building_id: buildingId
      });

    if (dbError) {
      console.error('[Storage] Failed to store file metadata:', dbError);
      throw dbError;
    }

    return publicUrl;
  } catch (error) {
    console.error('[Storage] Upload process failed:', error);
    throw new Error(`File upload failed: ${error.message}`);
  }
}

export async function analyzeFilesWithProxy(files: File[], buildingId: string): Promise<string> {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing');
  }

  const url = new URL('/functions/v1/deepseek-file-proxy', import.meta.env.VITE_SUPABASE_URL).toString();

  console.log("[DeepSeekFileProxy] Analyzing files:", {
    url,
    fileCount: files.length,
    buildingId
  });

  try {
    // First upload files to Supabase Storage with building ID
    const uploadPromises = files.map(file => uploadFileToStorage(file, 'audit-files', buildingId));
    const fileUrls = await Promise.all(uploadPromises);

    // Create FormData with file URLs and metadata
    const form = new FormData();
    fileUrls.forEach((url, i) => form.append(`file${i}`, url));
    form.append("api_key", import.meta.env.VITE_DEEPSEEK_API_KEY);

    const response = await fetch(url, { 
      method: "POST", 
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-client-info': 'deepseek-file-proxy'
      },
      body: form 
    });

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType?.includes("application/json")) {
      const errorText = await response.text();
      console.error("[DeepSeekFileProxy] API Error:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Check for error in response
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Ensure we have valid content
    if (!data.content || !Array.isArray(data.content)) {
      throw new Error("Invalid response format: missing or invalid content array");
    }

    // Process the analysis results and create a summary
    const summary = data.content.map((result: any) => {
      if (!result.file || !result.analysis) {
        console.warn("[DeepSeekFileProxy] Invalid result format:", result);
        return "";
      }
      const fileName = new URL(result.file).pathname.split('/').pop();
      return `File: ${fileName}\nAnalysis Results:\n${result.analysis}`;
    }).filter(Boolean).join('\n\n');

    if (!summary) {
      throw new Error("No valid analysis results received");
    }

    return summary;
  } catch (error) {
    console.error('[DeepSeekFileProxy] Request failed:', error);
    throw new Error(`File analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function talkToDeepSeek(prompt: string): Promise<string> {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing');
  }

  if (!import.meta.env.VITE_DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key is missing');
  }

  const url = new URL('/functions/v1/deepseek-proxy', import.meta.env.VITE_SUPABASE_URL).toString();

  console.log('[DeepSeek] Sending request to:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-client-info': 'deepseek-proxy'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        api_key: import.meta.env.VITE_DEEPSEEK_API_KEY
      })
    });

    // Log response details for debugging
    console.log('[DeepSeek] Response status:', response.status);
    console.log('[DeepSeek] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = errorText || response.statusText || errorMessage;
      }
      console.error('[DeepSeek] API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response received from DeepSeek API');
    }

    console.log('[DeepSeek] Raw response:', responseText);

    try {
      const data = JSON.parse(responseText);
      if (!data.content) {
        console.error('[DeepSeek] Invalid response data:', data);
        throw new Error('Invalid response format: missing content');
      }

      const cleanContent = data.content.trim();
      if (!cleanContent) {
        throw new Error('Empty content received from DeepSeek API');
      }

      return cleanContent;
    } catch (parseError) {
      console.error('[DeepSeek] Failed to parse response:', parseError);
      throw new Error('Failed to parse DeepSeek response');
    }
  } catch (error) {
    console.error('[DeepSeek] Request failed:', error);
    throw new Error(`DeepSeek request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}