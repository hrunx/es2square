import React, { useRef, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { FileText, Download, Mail, Printer, CheckCircle, AlertTriangle, XCircle, BarChart, Lightbulb, Thermometer, DollarSign, Clock, Leaf } from 'lucide-react';
import { AuditLevelInfo } from './AuditLevelInfo';
import { generateAIAnalysis, generatePDF, shareReport } from '../lib/reportGenerator';
import { format } from 'date-fns';

interface AuditReportProps {
  buildingData: {
    name: string;
    address: string;
    type: string;
    area: number;
    constructionYear: number;
    id: string;
  };
  energyData: {
    annualConsumption: number;
    peakDemand: number;
    carbonFootprint: number;
    energyCost: number;
  };
  equipment: Array<{
    type: string;
    count: number;
    avgEfficiency: number;
    condition: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    savings_usd: number;
    savings_kwh: number;
    savings_tCO2: number;
    cost: number;
    roi: number;
    priority: 'High' | 'Medium' | 'Low';
  }>;
}

export function AuditReport({ buildingData, energyData, equipment, recommendations }: AuditReportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        setLoading(true);
        setError(null);

        // First check if we have a cached analysis
        const { data: audit } = await supabase
          .from('audits')
          .select('id, recommendations, key_metrics, executive_summary')
          .eq('building_id', buildingData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (audit?.key_metrics && audit?.recommendations) {
          console.log('Using cached analysis:', audit);
          setAiAnalysis({
            executive_summary: audit.executive_summary,
            energy_performance: audit.key_metrics,
            recommendations: audit.recommendations
          });
          return;
        }

        // If no cached analysis, generate new one
        console.log('Generating new analysis for:', buildingData);
        const analysis = await generateAIAnalysis(buildingData, energyData, equipment);
        console.log('Generated analysis:', analysis);
        setAiAnalysis(analysis);
      } catch (error) {
        console.error('Error fetching analysis:', error);
        setError(error instanceof Error ? error.message : 'Failed to generate analysis');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [buildingData, energyData, equipment]);

  const getMetrics = () => {
    if (!aiAnalysis) return {
      annualSavings: 0,
      roi: 0,
      paybackMonths: 0,
      co2Reduction: 0
    };

    return {
      annualSavings: aiAnalysis.executive_summary?.annual_savings || 0,
      roi: aiAnalysis.executive_summary?.roi_percentage || 0,
      paybackMonths: aiAnalysis.executive_summary?.payback_months || 0,
      co2Reduction: aiAnalysis.executive_summary?.co2_reduction || 0
    };
  };

  const metrics = getMetrics();

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      const reportData = {
        buildingData,
        energyData,
        equipment,
        recommendations: aiAnalysis?.recommendations || recommendations,
        analysis: aiAnalysis
      };
      
      const pdfBlob = await generatePDF(reportData);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `energy-audit-report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setLoading(true);
      const reportData = {
        buildingData,
        energyData,
        equipment,
        recommendations: aiAnalysis?.recommendations || recommendations,
        analysis: aiAnalysis
      };
      
      const shareUrl = await shareReport(reportData);
      await navigator.clipboard.writeText(shareUrl);
      alert('Report link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing report:', error);
      setError('Failed to share report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.8) return 'text-green-600';
    if (value <= threshold * 1.2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const complianceTable = [
    { section: 'Intake', ashrae: 'Level I', iso: 'ISO 50001:2018, Clause 6.3' },
    { section: 'Detailed Audit', ashrae: 'Level II', iso: 'ISO 50002:2014, Sections 5-8' },
    { section: 'Simulation', ashrae: 'Level III', iso: 'ISO 50002:2014, Section 9' },
    { section: 'M&V', ashrae: 'N/A', iso: 'ISO 50006 + IPMVP Option B' }
  ];

  return (
    <div className="space-y-8" ref={reportRef}>
      <div className="flex flex-col gap-4">
        <AuditLevelInfo 
          level="III"
          isoStandard="ISO 50001/50002 Compliance"
          className="mb-4"
        />
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ASHRAE Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISO Clause</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complianceTable.map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.section}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.ashrae}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.iso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Energy Audit Report</h1>
          <p className="text-gray-600 mt-2">Generated on {format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleDownloadPDF}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button
            onClick={handleShare}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Mail className="w-4 h-4" /> Share
          </button>
          <button
            onClick={handlePrint}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Annual Savings</h3>
          </div>
          <p className="text-2xl font-bold text-green-700">
            ${metrics.annualSavings.toLocaleString()}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">ROI</h3>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {metrics.roi.toFixed(1)}%
          </p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-900">Payback Period</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-700">
            {metrics.paybackMonths.toFixed(1)} months
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">CO₂ Reduction</h3>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {metrics.co2Reduction.toFixed(1)} tons
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Building Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className="text-sm text-gray-500">Building Name</label>
            <p className="font-medium text-gray-900">{buildingData.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Building Type</label>
            <p className="font-medium text-gray-900">{buildingData.type}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Total Area</label>
            <p className="font-medium text-gray-900">{buildingData.area} m²</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Construction Year</label>
            <p className="font-medium text-gray-900">{buildingData.constructionYear}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Energy Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart className="w-5 h-5 text-blue-600" />
              <label className="text-sm text-gray-500">Annual Consumption</label>
            </div>
            <p className="font-medium text-gray-900">{energyData.annualConsumption} kWh</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <label className="text-sm text-gray-500">Peak Demand</label>
            </div>
            <p className="font-medium text-gray-900">{energyData.peakDemand} kW</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-5 h-5 text-red-600" />
              <label className="text-sm text-gray-500">Carbon Footprint</label>
            </div>
            <p className="font-medium text-gray-900">{energyData.carbonFootprint} tCO₂e</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-green-600" />
              <label className="text-sm text-gray-500">Energy Cost</label>
            </div>
            <p className="font-medium text-gray-900">{formatCurrency(energyData.energyCost)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Efficiency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipment.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.avgEfficiency}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                      item.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                      item.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.condition}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                  rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {rec.priority} Priority
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Annual Savings</label>
                  <p className="font-medium text-green-600">{formatCurrency(rec.savings_usd)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Implementation Cost</label>
                  <p className="font-medium text-gray-900">{formatCurrency(rec.cost)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">ROI</label>
                  <p className="font-medium text-blue-600">{rec.roi}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {aiAnalysis?.recommendations && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
          <div className="space-y-4">
            {aiAnalysis.recommendations.map((rec: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority} Priority
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Annual Savings</label>
                    <p className="font-medium text-green-600">{formatCurrency(rec.savings_usd)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Implementation Cost</label>
                    <p className="font-medium text-gray-900">{formatCurrency(rec.cost)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">ROI</label>
                    <p className="font-medium text-blue-600">{rec.roi}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-green-50 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Executive Summary</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-green-900">Total Potential Savings</h4>
              <p className="text-green-800">
                {formatCurrency(recommendations.reduce((acc, rec) => acc + rec.savings_usd, 0))} per year
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Implementation Investment</h4>
              <p className="text-blue-800">
                {formatCurrency(recommendations.reduce((acc, rec) => acc + rec.cost, 0))}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <BarChart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-purple-900">Average ROI</h4>
              <p className="text-purple-800">
                {Math.round(recommendations.reduce((acc, rec) => acc + rec.roi, 0) / recommendations.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}