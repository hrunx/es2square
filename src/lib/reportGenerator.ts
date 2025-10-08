import { jsPDF } from 'jspdf';
import { talkToDeepSeek } from './deepseek';
import { supabase } from './supabase';

export async function generateAIAnalysis(buildingData: any, energyData: any, equipment: any): Promise<any> {
  try {
    // First check if we have a cached analysis
    const { data: existingReport } = await supabase
      .from('detailed_reports')
      .select('content')
      .eq('audit_id', buildingData.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingReport?.content) {
      console.log('Using cached analysis:', existingReport.content);
      return existingReport.content;
    }

    // Get the audit data
    const { data: audit } = await supabase
      .from('audits')
      .select('*')
      .eq('building_id', buildingData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!audit) {
      throw new Error('No audit found for this building');
    }

    // Generate analysis prompt
    const prompt = `
As an expert ASHRAE Level II energy auditor, analyze this building's energy audit data and provide a detailed assessment.
The analysis must be data-driven and based on the actual measurements provided.

Building Data:
${JSON.stringify({
  buildingInfo: buildingData,
  energyData: energyData,
  equipment: equipment
}, null, 2)}

Return a pure JSON response in this exact format:
{
  "executive_summary": {
    "annual_savings": number,
    "roi_percentage": number,
    "payback_months": number,
    "co2_reduction": number
  },
  "energy_performance": {
    "annual_consumption": number,
    "peak_demand": number,
    "carbon_footprint": number,
    "energy_cost": number
  },
  "recommendations": [
    {
      "title": string,
      "description": string,
      "savings": number,
      "cost": number,
      "roi": number,
      "priority": "High" | "Medium" | "Low"
    }
  ]
}

CRITICAL: Return ONLY the JSON object, no other text.
`.trim();

    const analysisResponse = await talkToDeepSeek(prompt);
    
    // Clean and parse the response
    const cleanedResponse = analysisResponse
      .replace(/```json\s*|\s*```/g, '')
      .replace(/^[^{]*/, '')
      .replace(/[^}]*$/, '')
      .trim();

    const parsedAnalysis = JSON.parse(cleanedResponse);

    // Store in detailed_reports
    const { error: reportError } = await supabase
      .from('detailed_reports')
      .insert({
        audit_id: audit.id,
        content: parsedAnalysis,
        generated_at: new Date().toISOString()
      });

    if (reportError) {
      throw new Error(`Failed to store detailed report: ${reportError.message}`);
    }

    // Update audit with key metrics and recommendations
    const { error: updateError } = await supabase
      .from('audits')
      .update({
        status: 'completed',
        key_metrics: parsedAnalysis.energy_performance,
        recommendations: parsedAnalysis.recommendations,
        executive_summary: parsedAnalysis.executive_summary
      })
      .eq('id', audit.id);

    if (updateError) {
      throw new Error(`Failed to update audit: ${updateError.message}`);
    }

    return parsedAnalysis;
  } catch (error) {
    console.error('Error in generateAIAnalysis:', error);
    throw error;
  }
}

export async function generatePDF(reportData: any): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Helper function for adding text with line breaks
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * 7); // Return new Y position
  };

  // Title
  doc.setFontSize(24);
  doc.text('Energy Audit Report', 20, 20);

  // Building Information
  doc.setFontSize(16);
  doc.text('Building Information', 20, 40);
  doc.setFontSize(12);
  let y = 50;
  y = addWrappedText(`Name: ${reportData.buildingData.name}`, 20, y, 170);
  y = addWrappedText(`Address: ${reportData.buildingData.address}`, 20, y, 170);
  y = addWrappedText(`Type: ${reportData.buildingData.type}`, 20, y, 170);
  y = addWrappedText(`Area: ${reportData.buildingData.area} m²`, 20, y, 170);

  // Energy Performance
  y += 10;
  doc.setFontSize(16);
  doc.text('Energy Performance', 20, y);
  doc.setFontSize(12);
  y += 10;
  const ep = reportData.analysis?.energy_performance || {};
  y = addWrappedText(`Annual Consumption: ${ep.annual_consumption?.toLocaleString() || 0} kWh`, 20, y, 170);
  y = addWrappedText(`Annual Cost: $${ep.energy_cost?.toLocaleString() || 0}`, 20, y, 170);
  y = addWrappedText(`Carbon Footprint: ${ep.carbon_footprint?.toLocaleString() || 0} tCO₂e`, 20, y, 170);

  // Executive Summary
  y += 10;
  doc.setFontSize(16);
  doc.text('Executive Summary', 20, y);
  doc.setFontSize(12);
  y += 10;
  const es = reportData.analysis?.executive_summary || {};
  y = addWrappedText(`Annual Savings Potential: $${es.annual_savings?.toLocaleString() || 0}`, 20, y, 170);
  y = addWrappedText(`ROI: ${es.roi_percentage?.toFixed(1) || 0}%`, 20, y, 170);
  y = addWrappedText(`Payback Period: ${es.payback_months?.toFixed(1) || 0} months`, 20, y, 170);
  y = addWrappedText(`CO₂ Reduction: ${es.co2_reduction?.toFixed(1) || 0} tons/year`, 20, y, 170);

  // Add page break if needed
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Recommendations
  y += 10;
  doc.setFontSize(16);
  doc.text('Recommendations', 20, y);
  doc.setFontSize(12);
  y += 10;

  const recommendations = reportData.analysis?.recommendations || [];
  recommendations.forEach((rec: any, index: number) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    y = addWrappedText(`${index + 1}. ${rec.title}`, 20, y, 170);
    y = addWrappedText(rec.description, 25, y, 165);
    y = addWrappedText(`• Savings: $${rec.savings?.toLocaleString() || 0}/year`, 25, y, 165);
    y = addWrappedText(`• Implementation Cost: $${rec.cost?.toLocaleString() || 0}`, 25, y, 165);
    y = addWrappedText(`• ROI: ${rec.roi?.toFixed(1) || 0}%`, 25, y, 165);
    y = addWrappedText(`• Priority: ${rec.priority}`, 25, y, 165);
    y += 5;
  });

  return doc.output('blob');
}

export async function shareReport(reportData: any): Promise<string> {
  try {
    // Upload report data to Supabase storage
    const fileName = `report-${Date.now()}.json`;
    const { data, error } = await supabase.storage
      .from('audit-files')
      .upload(fileName, JSON.stringify(reportData));

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audit-files')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error sharing report:', error);
    throw new Error('Failed to share report');
  }
}