import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, DoughnutController, LineController, BarElement, BarController } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { LineChart, Lightbulb, Thermometer, Wind, AlertTriangle } from 'lucide-react';
import { AuditLevelInfo } from './AuditLevelInfo';
import { supabase } from '../lib/supabase';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  LineController,
  BarElement,
  BarController
);

interface AuditSummaryProps {
  buildingId: string;
}

export function AuditSummary({ buildingId }: AuditSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any | null>(null);
  const [buildingMetrics, setBuildingMetrics] = useState<any>({
    hvac_load: 0,
    lighting_power: 0,
    ventilation_rate: 0
  });

  useEffect(() => {
    async function fetchAuditData() {
      try {
        setLoading(true);
        setError(null);

        // Get the latest audit with all related data
        const { data: audit, error: auditError } = await supabase
          .from('audits')
          .select(`
            *,
            building:building_id (
              *,
              rooms (
                *,
                equipment (*)
              )
            ),
            detailed_reports (
              content
            )
          `)
          .eq('building_id', buildingId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (auditError) throw auditError;
        if (!audit) throw new Error('No audit data found');

        // Calculate metrics from room data
        const rooms = audit.building?.rooms || [];
        const totalArea = rooms.reduce((sum: number, room: any) => sum + (parseFloat(room.area) || 0), 0);
        
        // Calculate lighting power density
        const totalLightingPower = rooms.reduce((sum: number, room: any) => {
          const fixtureWattage = {
            'LED': 15,
            'CFL': 25,
            'Fluorescent': 32,
            'Halogen': 50
          };
          const watts = fixtureWattage[room.lighting_type as keyof typeof fixtureWattage] || 0;
          return sum + (watts * (room.num_fixtures || 0));
        }, 0);
        
        const lightingPowerDensity = totalArea > 0 ? totalLightingPower / totalArea : 0;

        // Calculate HVAC load
        const totalHVACLoad = rooms.reduce((sum: number, room: any) => {
          const acSizeInKW = (room.ac_size || 0) * 0.293; // Convert BTU/hr to kW
          return sum + acSizeInKW;
        }, 0);

        // Calculate ventilation rate (simplified)
        const totalVentilation = rooms.reduce((sum: number, room: any) => {
          const ratePerArea = 0.3; // L/s per m²
          return sum + (parseFloat(room.area) || 0) * ratePerArea;
        }, 0);

        setBuildingMetrics({
          hvac_load: totalHVACLoad.toFixed(1),
          lighting_power: lightingPowerDensity.toFixed(1),
          ventilation_rate: totalVentilation.toFixed(0)
        });

        setAuditData(audit);
      } catch (error) {
        console.error('Error fetching audit data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load audit data');
      } finally {
        setLoading(false);
      }
    }

    if (buildingId) {
      fetchAuditData();
    }
  }, [buildingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900">Loading Audit Data</h3>
          <p className="text-gray-500">Please wait while we analyze your building data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!auditData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertTriangle className="w-5 h-5" />
          <p>No audit data available</p>
        </div>
      </div>
    );
  }

  const simulationData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Baseline Energy Usage',
        data: [65, 59, 80, 81, 56, 55, 40, 45, 50, 55, 60, 70],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Projected Usage with Improvements',
        data: [45, 39, 60, 61, 36, 35, 30, 35, 40, 45, 50, 55],
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Energy Consumption Simulation'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Energy Usage (kWh)'
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <AuditLevelInfo 
        level="III"
        isoStandard="ISO 50002:2014, Section 9"
        className="mb-6"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">HVAC Load</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{buildingMetrics.hvac_load} kW</div>
          <p className="text-sm text-gray-500">Peak cooling demand</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Lighting Power</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{buildingMetrics.lighting_power} W/m²</div>
          <p className="text-sm text-gray-500">Average LPD</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Wind className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Ventilation</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{buildingMetrics.ventilation_rate} L/s</div>
          <p className="text-sm text-gray-500">Total airflow rate</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Energy Consumption Projection</h3>
        <Line options={chartOptions} data={simulationData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Recommendations</h3>
          <div className="space-y-4">
            {(auditData.recommendations || []).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-500">
                    {typeof item.savings === 'object' ? (
                      <>
                        Cost savings: {item.savings.cost}%<br />
                        Energy savings: {item.savings.energy}%<br />
                        Carbon reduction: {item.savings.carbon}%
                      </>
                    ) : (
                      `Potential savings: ${item.savings}%`
                    )}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  item.cost === 'Low' ? 'bg-green-100 text-green-800' :
                  item.cost === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.cost} Cost
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Energy Usage Index (EUI)</span>
                <span className="text-sm text-gray-600">{auditData.key_metrics?.eui || '0'} kWh/m²/year</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Carbon Footprint</span>
                <span className="text-sm text-gray-600">{auditData.key_metrics?.carbon_footprint || '0'} tCO₂e/year</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Energy Star Score</span>
                <span className="text-sm text-gray-600">{auditData.key_metrics?.energy_star_score || '0'}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}