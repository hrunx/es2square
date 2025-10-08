import { supabase } from './supabase';
import { talkToDeepSeek } from './deepseek';

async function getBase64FromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error(`Failed to fetch image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function performOCRWithVision(imageUrl: string, retries = 3): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const base64Image = await getBase64FromUrl(imageUrl);
      
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${import.meta.env.VITE_GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: {
                content: base64Image
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 100
                },
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                  maxResults: 100
                }
              ],
              imageContext: {
                languageHints: ['en', 'ar'],
                textDetectionParams: {
                  enableTextDetectionConfidenceScore: true
                }
              }
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Vision API request failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.responses?.[0]?.fullTextAnnotation?.text;
      
      if (!text) {
        throw new Error('No text detected in image. Please ensure the image is clear and contains readable text.');
      }

      return text;
    } catch (error) {
      console.error(`OCR attempt ${attempt} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
    }
  }

  throw lastError || new Error('Failed to process image after multiple attempts');
}

function parseRoomText(text: string): Array<{
  name: string;
  dimensions?: { width: string; length: string };
  area: number;
}> {
  const rooms: Array<{
    name: string;
    dimensions?: { width: string; length: string };
    area: number;
  }> = [];

  // Enhanced room pattern to match architectural drawings
  const roomPattern = /([A-Z][A-Z\s\/\d]+?)(?:\s*(?:(\d+(?:'\s*)?(?:-|\s+)?(?:\d+(?:"|½|¼|¾|\.5)?)?)[\"']?\s*[xX×]\s*(\d+(?:'\s*)?(?:-|\s+)?(?:\d+(?:"|½|¼|¾|\.5)?)?)[\"']?)|$)/gm;

  // Process each line to find room information
  let match;
  while ((match = roomPattern.exec(text)) !== null) {
    if (match[1]) {
      const name = match[1].trim();
      let width = match[2] || '';
      let length = match[3] || '';

      // Skip non-room text
      if (name.match(/^(UP|DOWN|OPENING|DRIVE|WAY)$/)) {
        continue;
      }

      // Clean up dimensions
      width = width.replace(/\s+/g, '').replace(/["""]/g, '"');
      length = length.replace(/\s+/g, '').replace(/["""]/g, '"');

      // Convert dimensions to decimal feet for area calculation
      const convertToDecimalFeet = (dim: string): number => {
        if (!dim) return 0;
        
        // Handle format like "12'6""
        const feetInchesMatch = dim.match(/(\d+)'(?:-)?(\d+(?:½|¼|¾|\.5)?)?(?:"|'')?/);
        if (feetInchesMatch) {
          const feet = parseInt(feetInchesMatch[1], 10);
          let inches = 0;
          
          if (feetInchesMatch[2]) {
            // Handle fractions
            if (feetInchesMatch[2].includes('½')) inches = 0.5;
            else if (feetInchesMatch[2].includes('¼')) inches = 0.25;
            else if (feetInchesMatch[2].includes('¾')) inches = 0.75;
            else inches = parseFloat(feetInchesMatch[2]);
          }
          
          return feet + (inches / 12);
        }
        
        // Handle decimal format
        const decimalMatch = dim.match(/(\d+(?:\.\d+)?)/);
        if (decimalMatch) {
          return parseFloat(decimalMatch[1]);
        }
        
        return 0;
      };

      const widthFeet = convertToDecimalFeet(width);
      const lengthFeet = convertToDecimalFeet(length);
      const area = widthFeet && lengthFeet ? widthFeet * lengthFeet : 0;

      // Only add if it's a valid room
      if (name && !name.match(/^(WALL|FLOOR|CEILING|CLG|SLAB)$/i)) {
        rooms.push({
          name,
          dimensions: width && length ? { width, length } : undefined,
          area: Math.round(area * 100) / 100
        });
      }
    }
  }

  return rooms;
}

export async function processImageWithOCR(file: File): Promise<string> {
  try {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File ${file.name} exceeds maximum size of 10MB`);
    }

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`File ${file.name} must be a JPEG, PNG, or PDF file`);
    }

    // Generate file hash for caching
    const fileHash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
      .then(hash => Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''));

    // Upload to Supabase storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audit-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audit-files')
      .getPublicUrl(fileName);

    // Process OCR text
    const text = await performOCRWithVision(publicUrl);

    if (!text.trim()) {
      throw new Error('No text was detected in the image. Please ensure the image is clear and contains readable text.');
    }

    // Determine if this is a floor plan
    const isFloorPlan = file.name.toLowerCase().includes('floor') || 
                       file.name.toLowerCase().includes('plan') ||
                       text.includes('BEDROOM') ||
                       text.includes('LIVING') ||
                       text.includes('KITCHEN');

    // Parse room data if this is a floor plan
    let processedData = {};
    if (isFloorPlan) {
      const rooms = parseRoomText(text);
      processedData = {
        type: 'floor_plan',
        rooms
      };

      console.log('Extracted room data:', rooms);
    }

    // Store in ocr_data
    const { data: ocrData, error: ocrError } = await supabase
      .from('ocr_data')
      .insert({
        raw_text: text,
        processed_text: processedData,
        metadata: {
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          processed_at: new Date().toISOString(),
          is_floor_plan: isFloorPlan
        }
      })
      .select()
      .single();

    if (ocrError) {
      throw ocrError;
    }

    // If this is a floor plan, store rooms in the rooms table
    if (isFloorPlan && processedData.rooms?.length > 0) {
      const { data: buildingData } = await supabase
        .from('buildings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (buildingData?.id) {
        const roomInserts = processedData.rooms.map((room: any) => ({
          building_id: buildingData.id,
          name: room.name,
          area: room.area,
          room_data: {
            dimensions: room.dimensions,
            extracted_from_ocr: true,
            ocr_data_id: ocrData.id
          }
        }));

        const { error: roomsError } = await supabase
          .from('rooms')
          .insert(roomInserts);

        if (roomsError) {
          console.error('Failed to insert rooms:', roomsError);
        }
      }
    }

    // Update audit_files with OCR data reference
    const { error: updateError } = await supabase
      .from('audit_files')
      .update({
        ocr_text: text,
        ocr_data_id: ocrData.id,
        processing_status: 'processed',
        extracted_data: processedData
      })
      .eq('file_url', publicUrl);

    if (updateError) {
      console.error('Failed to update audit_files:', updateError);
    }

    return text;
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw error;
  }
}