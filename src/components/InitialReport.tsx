import React, { useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, Loader2, FileText, Lightbulb, Thermometer, BarChart, Upload, ArrowLeft } from 'lucide-react';
import { analyzeFilesWithProxy, talkToDeepSeek } from '../lib/deepseek';
import { processImageWithOCR } from '../lib/ocr';
import { supabase } from '../lib/supabase';
import { AuditLevelInfo } from './AuditLevelInfo';

interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  floorArea: string;
  rooms: string;
  residents: string;
  electricityBills: File[];
  floorPlan: File | null;
}

interface RoomData {
  name: string;
  area: number;
  type?: string;
  windows?: number;
  lighting_type?: string;
  num_fixtures?: number;
  ac_type?: string;
  ac_size?: number;
}

interface InitialReportProps {
  formData: FormData;
  onStartDetailedAudit: (roomData: RoomData[]) => void;
  customerType?: string;
  buildingId: string;
  onBack: () => void;
}

export function InitialReport({ formData, onStartDetailedAudit, customerType = 'residential', buildingId, onBack }: InitialReportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [roomData, setRoomData] = useState<RoomData[]>([]);
  const [processingErrors, setProcessingErrors] = useState<string[]>([]);
  const [noRoomDataFound, setNoRoomDataFound] = useState(false);

  useEffect(() => {
    if (!buildingId) {
      console.error('No building ID provided to InitialReport');
      setError('Building ID is required');
      return;
    }

    console.log('Initializing with building ID:', buildingId);
    initializeReport();
  }, [buildingId]);

  async function initializeReport() {
    try {
      setError(null);
      setLoading(true);

      // Verify the building exists
      const { data: building, error: fetchError } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Failed to fetch building: ${fetchError.message}`);
      }

      if (!building) {
        throw new Error('Building not found');
      }

      console.log('Found building:', building);
      await uploadFiles();
    } catch (error) {
      console.error('Initialization error:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  async function uploadFileToStorage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    setUploadProgress(prev => ({
      ...prev,
      [file.name]: 0
    }));

    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const auditFilesBucket = buckets?.find(b => b.name === 'audit-files');
      
      if (!auditFilesBucket) {
        const { error: createBucketError } = await supabase.storage.createBucket('audit-files', {
          public: true,
          fileSizeLimit: 10485760,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf']
        });
        
        if (createBucketError) {
          throw new Error(`Failed to create storage bucket: ${createBucketError.message}`);
        }
      }

      const { data, error } = await supabase.storage
        .from('audit-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress(progress) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: percent
            }));
          }
        });

      if (error) {
        console.error('[Storage] Upload failed:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('audit-files')
        .getPublicUrl(fileName);

      await supabase
        .from('audit_files')
        .insert({
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
          building_id: buildingId
        });

      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 100
      }));

      return publicUrl;
    } catch (error) {
      console.error('[Storage] Upload failed:', error);
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 0
      }));
      throw error;
    }
  }

  async function uploadFiles() {
    setIsUploading(true);
    setError(null);
    
    try {
      const allFiles = [...formData.electricityBills];
      if (formData.floorPlan) allFiles.push(formData.floorPlan);

      const initialProgress = allFiles.reduce((acc, file) => ({
        ...acc,
        [file.name]: 0
      }), {});
      setUploadProgress(initialProgress);

      await Promise.all(allFiles.map(file => uploadFileToStorage(file)));
      setIsUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Failed to upload files: ${error instanceof Error ? error.message : String(error)}`);
      setIsUploading(false);
    }
  }

  async function extractAndStoreRoomData() {
    try {
      const { data: ocrData, error: ocrError } = await supabase
        .from('ocr_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (ocrError) {
        throw new Error(`Failed to fetch OCR data: ${ocrError.message}`);
      }

      if (!ocrData?.processed_text?.rooms) {
        setNoRoomDataFound(true);
        const numRooms = parseInt(formData.rooms) || 1;
        const avgArea = parseFloat(formData.floorArea) / numRooms;
        
        const defaultRooms = Array.from({ length: numRooms }, (_, i) => ({
          building_id: buildingId,
          name: `Room ${i + 1}`,
          area: avgArea,
          room_data: {
            dimensions: {
              width: Math.sqrt(avgArea),
              length: Math.sqrt(avgArea)
            },
            is_default: true
          }
        })).filter(room => room.area > 0); // Filter out rooms with zero area

        const { data: insertedRooms, error: insertError } = await supabase
          .from('rooms')
          .insert(defaultRooms)
          .select();

        if (insertError) {
          throw new Error(`Failed to insert default rooms: ${insertError.message}`);
        }

        const formattedRooms: RoomData[] = insertedRooms
          .filter(room => room.area > 0) // Filter out rooms with zero area
          .map(room => ({
            name: room.name,
            area: room.area,
            type: '',
            windows: 0,
            lighting_type: '',
            num_fixtures: 0,
            ac_type: '',
            ac_size: 0
          }));

        setRoomData(formattedRooms);
        return formattedRooms;
      }

      const rooms = ocrData.processed_text.rooms;
      const roomInserts = rooms
        .filter(room => {
          const area = room.area || (room.width && room.length ? parseFloat(room.width) * parseFloat(room.length) : 0);
          return area > 0; // Filter out rooms with zero area
        })
        .map(room => ({
          building_id: buildingId,
          name: room.name,
          area: room.area || (room.width && room.length ? parseFloat(room.width) * parseFloat(room.length) : 0),
          room_data: {
            dimensions: {
              width: room.width,
              length: room.length
            },
            extracted_from_ocr: true,
            ocr_data_id: ocrData.id
          }
        }));

      const { data: insertedRooms, error: insertError } = await supabase
        .from('rooms')
        .insert(roomInserts)
        .select();

      if (insertError) {
        throw new Error(`Failed to insert rooms: ${insertError.message}`);
      }

      const formattedRooms: RoomData[] = insertedRooms
        .filter(room => room.area > 0) // Filter out rooms with zero area
        .map(room => ({
          name: room.name,
          area: room.area,
          type: '',
          windows: 0,
          lighting_type: '',
          num_fixtures: 0,
          ac_type: '',
          ac_size: 0
        }));

      setRoomData(formattedRooms);
      return formattedRooms;
    } catch (error) {
      console.error('Error extracting and storing room data:', error);
      throw error;
    }
  }

  async function generateReport() {
    setError(null);
    setProcessingErrors([]);
    setNoRoomDataFound(false);
    
    if (!formData.electricityBills.length) {
      setError('Please upload at least one electricity bill.');
      return;
    }
    if (!formData.floorPlan) {
      setError('Please upload a floor plan.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    
    const validateFile = (file: File) => {
      if (file.size > maxSize) {
        throw new Error(`File ${file.name} exceeds maximum size of 10MB`);
      }
      if (!validTypes.includes(file.type)) {
        throw new Error(`File ${file.name} must be PDF, JPEG, or PNG`);
      }
    };

    try {
      formData.electricityBills.forEach(validateFile);
      if (formData.floorPlan) validateFile(formData.floorPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }

    setLoading(true);
    try {
      console.log('[InitialReport] Starting report generation');

      const billTexts = await Promise.all(
        formData.electricityBills.map(async (file) => {
          try {
            const text = await processImageWithOCR(file);
            if (!text.trim()) {
              throw new Error(`No text detected in ${file.name}. Please ensure the image is clear and contains readable text.`);
            }
            return text;
          } catch (error) {
            setProcessingErrors(prev => [...prev, error instanceof Error ? error.message : String(error)]);
            return null;
          }
        })
      );

      const validBillTexts = billTexts.filter((text): text is string => text !== null);

      if (validBillTexts.length === 0) {
        throw new Error('No electricity bills could be processed. Please ensure the images are clear and contain readable text.');
      }

      let planText = '';
      if (formData.floorPlan) {
        try {
          planText = await processImageWithOCR(formData.floorPlan);
          if (!planText.trim()) {
            throw new Error('No text detected in floor plan. Please ensure the image is clear and contains readable text.');
          }
        } catch (error) {
          setProcessingErrors(prev => [...prev, error instanceof Error ? error.message : String(error)]);
          throw new Error(`Failed to process floor plan: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const prompt = `
        As an expert energy auditor, analyze this building data and provide a structured JSON response with the following format:
        {
          "energyConsumption": {
            "annual": number (kWh),
            "peak": number (kW),
            "average": number (kWh/month)
          },
          "carbonFootprint": number (tCO2e/year),
          "costMetrics": {
            "annual": number (USD),
            "perSquareMeter": number (USD/m²)
          },
          "recommendations": [
            {
              "title": string,
              "description": string,
              "potentialSavings": number (USD/year),
              "priority": "high" | "medium" | "low"
            }
          ]
        }

        Building Details:
        - Floor Area: ${formData.floorArea} m²
        - Number of Rooms: ${formData.rooms}
        - Number of Residents: ${formData.residents}

        Electricity Bills Analysis:
        ${validBillTexts.join('\n\n')}

        Floor Plan Analysis:
        ${planText}
      `.trim();

      const response = await talkToDeepSeek(prompt);
      let analysisResult: any;

      try {
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/i);
        const jsonText = jsonMatch ? jsonMatch[1] : response;
        analysisResult = JSON.parse(jsonText);
      } catch (e) {
        console.error('[InitialReport] invalid JSON payload:', response);
        throw new Error(`Failed to parse AI response as JSON: ${e instanceof Error ? e.message : String(e)}`);
      }

      const extractedRooms = await extractAndStoreRoomData();
      
      const validRooms = extractedRooms
        .filter(room => {
          const roomName = room.name.trim();
          return roomName && !/^\d+$/.test(roomName) && roomName !== 'unnamed room' && room.area > 0;
        });

      setReport(analysisResult);
      setRoomData(validRooms);
      console.log('[InitialReport] Report generation completed successfully');

    } catch (err) {
      console.error('[InitialReport] Error generating report:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(`Failed to generate report: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  const handleStartDetailedAudit = () => {
    if (!buildingId) {
      setError('No building ID available');
      return;
    }
    onStartDetailedAudit(roomData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <p className="text-gray-600">Analyzing files and generating report...</p>
        </div>
      </div>
    );
  }

  if (error || processingErrors.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            {window.DeepSeekTranslate?.convert('Back') ?? 'Back'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {processingErrors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Processing Issues:</h4>
            <ul className="list-disc list-inside space-y-1">
              {processingErrors.map((err, index) => (
                <li key={index} className="text-yellow-700">{err}</li>
              ))}
            </ul>
            <div className="mt-4 text-sm text-yellow-700">
              <p className="font-medium">Tips for better results:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Ensure images are well-lit and clear</li>
                <li>Avoid glare and shadows on the documents</li>
                <li>Make sure text is clearly visible and not blurry</li>
                <li>Use high-resolution scans when possible</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => {
              setError(null);
              setProcessingErrors([]);
              setReport(null);
            }}
            className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Try Again with Different Files
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            {window.DeepSeekTranslate?.convert('Back') ?? 'Back'}
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploading Files</h3>
          <div className="space-y-4">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate max-w-[80%]">{fileName}</span>
                  <span className="text-gray-900 font-medium">{progress}%</span>
                </div>
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-green-600 transition-all duration-300 ease-out rounded-full"
                    style={{ 
                      width: `${progress}%`,
                      transition: 'width 0.3s ease-out'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => generateReport()}
            disabled={isUploading || Object.values(uploadProgress).some(p => p < 100)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              isUploading || Object.values(uploadProgress).some(p => p < 100)
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Generate Initial Report
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {window.DeepSeekTranslate?.convert('Back') ?? 'Back'}
        </button>
      </div>
      
      <AuditLevelInfo 
        level="I"
        isoStandard="ISO 50001:2018 Energy Review"
        className="mb-6"
      />

      {noRoomDataFound && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">No Room Data Found</h4>
              <p className="text-sm text-yellow-700 mt-1">
                We couldn't extract room information from your floor plan. Default rooms have been created based on your input. 
                You can modify these details during the detailed audit.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Initial Energy Assessment</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Annual Consumption</h3>
            </div>
            <p className="text-2xl font-bold text-blue-700">{report.energyConsumption.annual.toLocaleString()} kWh</p>
            <p className="text-sm text-blue-600 mt-1">Peak: {report.energyConsumption.peak} kW</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Carbon Footprint</h3>
            </div>
            <p className="text-2xl font-bold text-green-700">{report.carbonFootprint.toFixed(1)} tCO₂e</p>
            <p className="text-sm text-green-600 mt-1">Per Year</p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">Energy Cost</h3>
            </div>
            <p className="text-2xl font-bold text-yellow-700">${report.costMetrics.annual.toLocaleString()}</p>
            <p className="text-sm text-yellow-600 mt-1">${report.costMetrics.perSquareMeter}/m² annually</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Recommendations</h3>
            </div>
            <p className="text-2xl font-bold text-purple-700">{report.recommendations.length}</p>
            <p className="text-sm text-purple-600 mt-1">Improvement Actions</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recommended Actions</h3>
          {report.recommendations.map((rec, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                </span>
              </div>
              <div className="mt-2">
                <span className="text-sm font-medium text-green-600">
                  Potential Savings: ${rec.potentialSavings.toLocaleString()}/year
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleStartDetailedAudit}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Start Detailed Audit
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}