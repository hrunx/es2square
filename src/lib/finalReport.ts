import { supabase } from './supabase';
import { talkToDeepSeek } from './deepseek';

interface Equipment {
  id: string;
  name: string;
  category: string;
  subType: string;
  location: string;
  ratedPower: number;
  efficiency: number;
  operatingHours: number;
  operatingDays: number;
  loadFactor: string;
  condition: string;
  age: number;
  controlSystem: string;
  notes: string;
}

interface AuditData {
  buildingId: string;
  equipment: Equipment[];
  type: 'initial' | 'detailed';
}

function normaliseDeepSeek(ai: any) {
  const flatRecs = (ai.recommendations || []).map((r: any) => ({
    ...r,
    savings_usd: typeof r.savings === 'object' ? r.savings.cost ?? 0 : r.savings ?? 0,
    savings_kwh: typeof r.savings === 'object' ? r.savings.energy ?? 0 : 0,
    savings_tCO2: typeof r.savings === 'object' ? r.savings.carbon ?? 0 : 0,
  }));

  return {
    ...ai,
    recommendations: flatRecs,
  };
}

export async function createOrUpdateAuditWithAI({ buildingId, equipment, type }: AuditData) {
  try {
    // Get building data with detailed information
    const { data: buildingData, error: buildingError } = await supabase
      .from('buildings')
      .select(`
        *,
        rooms (
          *,
          equipment (*)
        ),
        audit_files (
          *,
          ocr_data!ocr_data_file_id_fkey (*)
        )
      `)
      .eq('id', buildingId)
      .single();

    if (buildingError) throw buildingError;

    // Get existing audits for historical context
    const { data: existingAudits, error: auditsError } = await supabase
      .from('audits')
      .select('*')
      .eq('building_id', buildingId)
      .order('created_at', { ascending: false });

    if (auditsError) throw auditsError;

    // Prepare enriched equipment data with calculations
    const enrichedEquipment = equipment.map(eq => ({
      ...eq,
      annualEnergy: calculateAnnualEnergy(eq),
      savingsPotential: calculateSavingsPotential(eq),
      efficiencyGap: getEfficiencyGap(eq),
      recommendations: generateEquipmentRecommendations(eq)
    }));

    // Calculate building-level metrics
    const buildingMetrics = {
      totalAnnualEnergy: enrichedEquipment.reduce((sum, eq) => sum + calculateAnnualEnergy(eq), 0),
      totalSavingsPotential: enrichedEquipment.reduce((sum, eq) => sum + calculateSavingsPotential(eq), 0),
      averageEquipmentAge: enrichedEquipment.reduce((sum, eq) => sum + eq.age, 0) / enrichedEquipment.length,
      equipmentByCategory: categorizeEquipment(enrichedEquipment)
    };

    // Create a slimmed down version of the analysis data to reduce payload size
    const slimAnalysisData = {
      building: {
        id: buildingData.id,
        type: buildingData.type,
        area: buildingData.area,
        construction_year: buildingData.construction_year,
        address: buildingData.address
      },
      equipment: enrichedEquipment.map(eq => ({
        type: eq.category,
        subType: eq.subType,
        efficiency: eq.efficiency,
        age: eq.age,
        condition: eq.condition,
        annualEnergy: eq.annualEnergy,
        savingsPotential: eq.savingsPotential
      })),
      metrics: buildingMetrics,
      auditType: type
    };

    // Enhanced AI prompt with specific instructions and slimmed data
    const aiPrompt = `You are an expert energy auditor conducting a ${type} audit. Analyze this building data and provide a comprehensive energy assessment.

CONTEXT:
${JSON.stringify(slimAnalysisData, null, 2)}

INSTRUCTIONS:
1. Analyze the provided data including building details, equipment information, and calculated metrics
2. Consider the relationships between different building systems
3. Prioritize recommendations based on ROI, implementation complexity, and energy savings potential
4. Include specific, actionable recommendations with quantified benefits
5. Provide detailed findings supported by the data

REQUIRED: Return ONLY a JSON object with the following structure (no additional text or markdown):
{
  "findings": {
    "buildingOverview": { "description": "", "metrics": {} },
    "equipmentAnalysis": { "description": "", "keyIssues": [] },
    "energyConsumption": { "description": "", "patterns": [] },
    "maintenanceStatus": { "description": "", "issues": [] }
  },
  "recommendations": [
    {
      "category": "",
      "title": "",
      "description": "",
      "implementation": "",
      "savings": { "energy": 0, "cost": 0, "carbon": 0 },
      "investment": 0,
      "roi": 0,
      "priority": "High|Medium|Low"
    }
  ],
  "keyMetrics": {
    "totalEnergyConsumption": 0,
    "potentialSavings": 0,
    "carbonReduction": 0,
    "averageROI": 0,
    "implementationCost": 0
  },
  "executiveSummary": {
    "overview": "",
    "keyFindings": [],
    "potentialImpact": {},
    "nextSteps": []
  }
}`;

    // Get AI analysis
    const aiResponse = await talkToDeepSeek(aiPrompt);
    if (!aiResponse) {
      throw new Error('No response received from AI analysis');
    }

    // Clean the response by removing any markdown code fences
    const cleanedResponse = aiResponse.replace(/^```json\n?|\n?```$/g, '').trim();
    if (!cleanedResponse) {
      throw new Error('Empty response after cleaning markdown fences');
    }

    // Parse and validate AI response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    // Validate the parsed response structure
    if (!parsedResponse.findings || !parsedResponse.recommendations || !parsedResponse.keyMetrics || !parsedResponse.executiveSummary) {
      throw new Error('Invalid response format: missing required sections');
    }

    // Normalize the AI response to flatten nested objects
    const normalizedResponse = normaliseDeepSeek(parsedResponse);

    // Create or update audit record
    const { data: auditData, error: auditError } = await supabase
      .from('audits')
      .upsert({
        building_id: buildingId,
        type: type,
        status: 'completed',
        findings: normalizedResponse.findings,
        recommendations: normalizedResponse.recommendations,
        key_metrics: normalizedResponse.keyMetrics,
        executive_summary: normalizedResponse.executiveSummary,
        ai_raw: parsedResponse // Store the original AI response
      })
      .select()
      .single();

    if (auditError) throw auditError;

    return {
      success: true,
      data: {
        ...normalizedResponse,
        auditId: auditData.id
      }
    };
  } catch (error) {
    console.error('Error in createOrUpdateAuditWithAI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create/update audit'
    };
  }
}

function calculateAnnualEnergy(equipment: Equipment): number {
  const loadFactorMap = {
    'Low (0-33%)': 0.33,
    'Medium (34-66%)': 0.66,
    'High (67-100%)': 1
  };

  const loadFactor = loadFactorMap[equipment.loadFactor as keyof typeof loadFactorMap] || 0.5;
  const annualHours = equipment.operatingHours * equipment.operatingDays * 52;
  return equipment.ratedPower * loadFactor * annualHours;
}

function calculateSavingsPotential(equipment: Equipment): number {
  const baselineEfficiency = getBaselineEfficiency(equipment.category, equipment.subType);
  if (!baselineEfficiency || equipment.efficiency >= baselineEfficiency) return 0;

  const annualEnergy = calculateAnnualEnergy(equipment);
  return annualEnergy * (1 - equipment.efficiency / baselineEfficiency);
}

function getBaselineEfficiency(category: string, subType: string): number {
  const standards: Record<string, Record<string, number>> = {
    'HVAC': {
      'Chiller': 0.9,
      'Boiler': 0.85,
      'Heat Pump': 0.88,
      'default': 0.8
    },
    'Lighting': {
      'LED': 0.95,
      'Fluorescent': 0.85,
      'default': 0.8
    },
    'default': {
      'default': 0.75
    }
  };

  return standards[category]?.[subType] || 
         standards[category]?.['default'] || 
         standards['default']['default'];
}

function getEfficiencyGap(equipment: Equipment): number {
  const baselineEfficiency = getBaselineEfficiency(equipment.category, equipment.subType);
  return Math.max(0, baselineEfficiency - equipment.efficiency);
}

function generateEquipmentRecommendations(equipment: Equipment): string[] {
  const recommendations: string[] = [];
  const efficiencyGap = getEfficiencyGap(equipment);

  if (efficiencyGap > 0.1) {
    recommendations.push('Consider upgrading to high-efficiency equipment');
  }

  if (equipment.age > 15) {
    recommendations.push('Equipment approaching end of life - plan for replacement');
  }

  if (!equipment.controlSystem) {
    recommendations.push('Install automated controls to optimize operation');
  }

  return recommendations;
}

function categorizeEquipment(equipment: Equipment[]): Record<string, number> {
  return equipment.reduce((acc, eq) => {
    acc[eq.category] = (acc[eq.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}