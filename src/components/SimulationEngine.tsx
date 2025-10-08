import React from 'react';
import {
  Chart as ChartJS,
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LineChart, Lightbulb, Thermometer, Wind } from 'lucide-react';
import { AuditLevelInfo } from './AuditLevelInfo';

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

export function SimulationEngine() {
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
          <div className="text-3xl font-bold text-gray-900 mb-2">24.5 kW</div>
          <p className="text-sm text-gray-500">Peak cooling demand</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Lighting Power</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">8.2 W/m²</div>
          <p className="text-sm text-gray-500">Average LPD</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Wind className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Ventilation</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">850 L/s</div>
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
            {[
              { title: 'LED Lighting Upgrade', savings: '15%', cost: 'Medium' },
              { title: 'HVAC Optimization', savings: '20%', cost: 'Low' },
              { title: 'Smart Controls', savings: '10%', cost: 'Medium' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-500">Potential savings: {item.savings}</p>
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
                <span className="text-sm text-gray-600">120 kWh/m²/year</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Carbon Footprint</span>
                <span className="text-sm text-gray-600">45 tCO₂e/year</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Energy Star Score</span>
                <span className="text-sm text-gray-600">85/100</span>
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