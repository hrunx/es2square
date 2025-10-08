import React from 'react';
import { LineChart, BarChart, Activity, AlertTriangle } from 'lucide-react';
import { AuditLevelInfo } from './AuditLevelInfo';

interface MonitoringData {
  timestamp: string;
  consumption: number;
  baseline: number;
  savings: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'info';
  message: string;
  timestamp: string;
}

export function ContinuousMonitoring() {
  const [data] = React.useState<MonitoringData[]>([
    // Sample data - replace with real data from your backend
    { timestamp: '2025-01', consumption: 1200, baseline: 1500, savings: 300 },
    { timestamp: '2025-02', consumption: 1100, baseline: 1500, savings: 400 },
    { timestamp: '2025-03', consumption: 1300, baseline: 1500, savings: 200 },
    // ... more data points
  ]);

  const [alerts] = React.useState<Alert[]>([
    {
      id: '1',
      type: 'success',
      message: 'Energy consumption 20% below baseline',
      timestamp: '2025-03-15'
    },
    {
      id: '2',
      type: 'warning',
      message: 'Unusual consumption pattern detected',
      timestamp: '2025-03-10'
    }
    // ... more alerts
  ]);

  return (
    <div className="space-y-6">
      <AuditLevelInfo 
        level="III"
        isoStandard="ISO 50006 & IPMVP Option B"
        className="mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Energy Usage vs. Baseline</h3>
            <LineChart className="w-5 h-5 text-gray-500" />
          </div>
          <div className="h-64 bg-gray-50 rounded-lg">
            {/* Implement actual chart here using your preferred charting library */}
            <div className="flex items-center justify-center h-full text-gray-500">
              Energy usage chart placeholder
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cumulative Savings</h3>
            <BarChart className="w-5 h-5 text-gray-500" />
          </div>
          <div className="h-64 bg-gray-50 rounded-lg">
            {/* Implement actual chart here using your preferred charting library */}
            <div className="flex items-center justify-center h-full text-gray-500">
              Savings chart placeholder
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Performance Alerts</h3>
          <Activity className="w-5 h-5 text-gray-500" />
        </div>
        <div className="space-y-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-4 rounded-lg ${
                alert.type === 'warning' ? 'bg-yellow-50' :
                alert.type === 'success' ? 'bg-green-50' :
                'bg-blue-50'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 ${
                alert.type === 'warning' ? 'text-yellow-500' :
                alert.type === 'success' ? 'text-green-500' :
                'text-blue-500'
              }`} />
              <div>
                <p className={`font-medium ${
                  alert.type === 'warning' ? 'text-yellow-800' :
                  alert.type === 'success' ? 'text-green-800' :
                  'text-blue-800'
                }`}>
                  {alert.message}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(alert.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}