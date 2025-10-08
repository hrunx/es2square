import React, { useState, Suspense, lazy } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, FileText, Grid, Ruler, Thermometer, Sun, BarChart as ChartBar } from 'lucide-react';
import { AuditLevelInfo } from './AuditLevelInfo';

const SimulationEngine = lazy(() => import('./SimulationEngine').then(module => ({ default: module.SimulationEngine })));
const AIEquipmentDetection = lazy(() => import('./AIEquipmentDetection').then(module => ({ default: module.AIEquipmentDetection })));

interface Zone {
  id: string;
  name: string;
  type: string;
  area: number;
  equipment: Equipment[];
}

interface Equipment {
  id: string;
  type: string;
  name: string;
  specs: Record<string, string | number>;
}

export function BuildingAssessment() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeTab, setActiveTab] = useState<'layout' | 'zones' | 'equipment' | 'simulation'>('layout');
  const [blueprint, setBlueprint] = useState<string | null>(null);
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        setBlueprint(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  });

  const tabs = [
    { id: 'layout', name: 'Layout', icon: Grid },
    { id: 'zones', name: 'Zones', icon: Ruler },
    { id: 'equipment', name: 'Equipment', icon: Thermometer },
    { id: 'simulation', name: 'Simulation', icon: ChartBar }
  ];

  return (
    <div className="space-y-6">
      <AuditLevelInfo 
        level="II"
        isoStandard="ISO 50002:2014 Structural Assessment"
        className="mb-6"
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Layout Tab */}
      {activeTab === 'layout' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Building Layout</h3>
            
            {!blueprint ? (
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-green-500 transition-colors cursor-pointer"
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Drop your building blueprint here, or click to select
                </p>
                <p className="text-xs text-gray-500">
                  Supports PNG, JPG up to 10MB
                </p>
              </div>
            ) : (
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Stage width={800} height={600}>
                  <Layer>
                    {/* Blueprint rendering would go here */}
                  </Layer>
                </Stage>
                <button
                  onClick={() => setBlueprint(null)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-50"
                >
                  <Upload className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Building Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Building Height (m)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Floor-to-Floor Height (m)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Building Orientation (°)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Window-to-Wall Ratio (%)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zones Tab */}
      {activeTab === 'zones' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Building Zones</h3>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Add Zone
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {zones.map((zone) => (
                <div key={zone.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{zone.name}</h4>
                      <p className="text-sm text-gray-500">{zone.type}</p>
                    </div>
                    <span className="text-sm text-gray-600">{zone.area} m²</span>
                  </div>
                </div>
              ))}
              
              {zones.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No zones defined yet. Start by adding a zone.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Occupancy Density (m²/person)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lighting Power Density (W/m²)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Equipment Power Density (W/m²)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ventilation Rate (L/s/person)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        }>
          <AIEquipmentDetection />
        </Suspense>
      )}

      {/* Simulation Tab */}
      {activeTab === 'simulation' && (
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        }>
          <SimulationEngine />
        </Suspense>
      )}
    </div>
  );
}