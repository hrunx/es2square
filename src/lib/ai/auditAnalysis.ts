import { supabase } from '../supabase';

interface AuditData {
  buildingType: string;
  area: number;
  bills: Array<{
    consumption: number;
    cost: number;
    period: string;
  }>;
  equipment: Array<{
    type: string;
    age: number;
    efficiency: number;
  }>;
}

interface AuditRecommendation {
  title: string;
  description: string;
  savings: number;
  cost: number;
  roi: number;
  priority: 'High' | 'Medium' | 'Low';
}

interface AuditAnalysis {
  energyScore: number;
  recommendations: AuditRecommendation[];
  potentialSavings: number;
  carbonReduction: number;
}

export async function analyzeAuditData(data: AuditData): Promise<AuditAnalysis> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert energy auditor. Analyze the building data and provide detailed recommendations."
          },
          {
            role: "user",
            content: `Analyze this building data and provide recommendations:
              Building Type: ${data.buildingType}
              Area: ${data.area}m²
              Energy Bills: ${JSON.stringify(data.bills)}
              Equipment: ${JSON.stringify(data.equipment)}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze audit data');
    }

    const result = await response.json();
    const analysis = JSON.parse(result.choices[0].message.content);

    // Cache the analysis results
    await supabase.from('audits').insert({
      type: 'initial',
      status: 'completed',
      findings: analysis,
      recommendations: analysis.recommendations
    });

    return analysis;
  } catch (error) {
    console.error('Error analyzing audit data:', error);
    throw error;
  }
}

export async function analyzeEquipmentEfficiency(
  equipmentData: Array<{
    type: string;
    specs: Record<string, any>;
    usage: Record<string, number>;
  }>
): Promise<Array<{
  id: string;
  efficiency: number;
  recommendations: string[];
  potentialSavings: number;
}>> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert in energy equipment efficiency analysis."
          },
          {
            role: "user",
            content: `Analyze the efficiency of these equipment:
              ${JSON.stringify(equipmentData)}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze equipment efficiency');
    }

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing equipment efficiency:', error);
    throw error;
  }
}

export async function generateDetailedReport(
  auditId: string,
  includeComparisons: boolean = true
): Promise<string> {
  try {
    // Fetch audit data
    const { data: auditData, error } = await supabase
      .from('audits')
      .select(`
        *,
        building:building_id (
          *,
          rooms (*),
          equipment (*)
        )
      `)
      .eq('id', auditId)
      .single();

    if (error) throw error;

    // Generate report using DeepSeek
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "Generate a detailed energy audit report with actionable insights."
          },
          {
            role: "user",
            content: `Generate a detailed report for this audit data:
              ${JSON.stringify(auditData)}
              Include industry comparisons: ${includeComparisons}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error('Error generating detailed report:', error);
    throw error;
  }
}