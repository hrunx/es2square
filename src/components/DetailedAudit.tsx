import React, { useState, lazy, Suspense } from 'react';
import { Camera, Plus, Trash2, ArrowRight, X, AlertTriangle, Info, ArrowLeft } from 'lucide-react';
import { AuditLevelInfo } from './AuditLevelInfo';
import { RoomAssessment } from './RoomAssessment';
import { talkToDeepSeek } from '../lib/deepseek';
import { AuditSummary } from './AuditSummary';
import type { Equipment } from '../types/equipment';
import { getEquipmentTypes } from '../lib/constants/equipmentTypes';
import { supabase } from '../lib/supabase';
import { createOrUpdateAuditWithAI } from '../lib/finalReport';

const AIEquipmentDetection = lazy(() => import('./AIEquipmentDetection').then(module => ({ default: module.AIEquipmentDetection })));

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

interface DetailedAuditProps {
  customerType: string;
  initialRoomData?: RoomData[];
  buildingId: string;
  onBack: () => void;
}

type Step = 'rooms' | 'equipment' | 'summary';

const renderEquipmentForm = (
  equipment: Equipment,
  onUpdate: (id: string, updates: Partial<Equipment>) => void,
  setShowAIDetection: (show: boolean) => void,
  setEquipment: React.Dispatch<React.SetStateAction<Equipment[]>>,
  rooms: string[],
  customerType: string
) => {
  const equipmentTypes = getEquipmentTypes(customerType || 'residential');
  
  return (
    <div key={equipment.id} className="bg-white rounded-lg shadow-lg p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-8 w-full">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name/Description</label>
                <input
                  type="text"
                  value={equipment.name}
                  onChange={(e) => onUpdate(equipment.id, { name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter equipment name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="relative">
                  <select
                    value={equipment.category}
                    onChange={(e) => onUpdate(equipment.id, { category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Select category</option>
                    {Object.keys(equipmentTypes).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {equipment.category === 'Other' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Category</label>
                  <input
                    type="text"
                    value={equipment.subType}
                    onChange={(e) => onUpdate(equipment.id, { subType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter custom category"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Type</label>
                  <div className="relative">
                    <select
                      value={equipment.subType}
                      onChange={(e) => onUpdate(equipment.id, { subType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                    >
                      <option value="">Select type</option>
                      {equipmentTypes[equipment.category]?.map(type => (
                        <option key={type.type} value={type.type}>{type.type}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location and Power */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Power</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={equipment.location}
                  onChange={(e) => onUpdate(equipment.id, { location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Room</option>
                  {rooms.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rated Power (kW)</label>
                <input
                  type="number"
                  value={equipment.ratedPower || ''}
                  onChange={(e) => onUpdate(equipment.id, { ratedPower: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter rated power"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Efficiency (%)</label>
                <input
                  type="number"
                  value={equipment.efficiency || ''}
                  onChange={(e) => onUpdate(equipment.id, { efficiency: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter efficiency"
                />
              </div>
            </div>
          </div>

          {/* Usage Pattern */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Pattern</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours/Day</label>
                <input
                  type="number"
                  value={equipment.operatingHours || ''}
                  onChange={(e) => onUpdate(equipment.id, { operatingHours: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter hours per day"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operating Days/Week</label>
                <input
                  type="number"
                  value={equipment.operatingDays || ''}
                  onChange={(e) => onUpdate(equipment.id, { operatingDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter days per week"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Load Factor</label>
                <select
                  value={equipment.loadFactor}
                  onChange={(e) => onUpdate(equipment.id, { loadFactor: e.target.value as Equipment['loadFactor'] })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Low (0-33%)">Low (0-33%)</option>
                  <option value="Medium (34-66%)">Medium (34-66%)</option>
                  <option value="High (67-100%)">High (67-100%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Condition & Maintenance */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Condition & Maintenance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <select
                  value={equipment.condition}
                  onChange={(e) => onUpdate(equipment.id, { condition: e.target.value as Equipment['condition'] })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age (years)</label>
                <input
                  type="number"
                  value={equipment.age || ''}
                  onChange={(e) => onUpdate(equipment.id, { age: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter age in years"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Control System</label>
                <select
                  value={equipment.controlSystem}
                  onChange={(e) => onUpdate(equipment.id, { controlSystem: e.target.value as Equipment['controlSystem'] })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Manual">Manual</option>
                  <option value="Programmable Thermostat">Programmable Thermostat</option>
                  <option value="BMS Integration">BMS Integration</option>
                  <option value="Smart Controls">Smart Controls</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              rows={3}
              value={equipment.notes}
              onChange={(e) => onUpdate(equipment.id, { notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Additional observations..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowAIDetection(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Camera className="w-4 h-4" /> Scan Equipment
            </button>
            <button
              onClick={() => {
                setEquipment(current => current.filter(e => e.id !== equipment.id));
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DetailedAudit({ customerType, initialRoomData = [], buildingId, onBack }: DetailedAuditProps) {
  const [step, setStep] = useState<Step>('rooms');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [showAIDetection, setShowAIDetection] = useState(false);
  const [rooms] = useState<string[]>(initialRoomData.map(room => room.name));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    switch (step) {
      case 'equipment':
        setStep('rooms');
        break;
      case 'summary':
        setStep('equipment');
        break;
      case 'rooms':
        onBack();
        break;
    }
  };

  const handleStartSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await createOrUpdateAuditWithAI({
        buildingId,
        equipment,
        type: 'detailed'
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setStep('summary');
    } catch (error) {
      console.error('Error preparing summary:', error);
      setError(error instanceof Error ? error.message : 'Failed to prepare summary');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'rooms':
        return (
          <div className="space-y-6">
            <RoomAssessment
              buildingId={buildingId}
              initialRooms={initialRoomData}
              customerType={customerType}
              onComplete={() => setStep('equipment')}
              onBack={handleBack}
            />
          </div>
        );

      case 'equipment':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Equipment Assessment</h2>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    const newEquipment: Equipment = {
                      id: crypto.randomUUID(),
                      name: '',
                      category: '',
                      subType: '',
                      location: '',
                      ratedPower: 0,
                      efficiency: 0,
                      operatingHours: 0,
                      operatingDays: 0,
                      loadFactor: 'Low (0-33%)',
                      condition: 'Good',
                      age: 0,
                      controlSystem: 'Manual',
                      notes: ''
                    };
                    setEquipment(current => [...current, newEquipment]);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Add Equipment
                </button>
                {equipment.length > 0 && (
                  <button
                    onClick={handleStartSummary}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Generate Report'} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {equipment.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Equipment Added</h3>
                <p className="text-gray-500 mb-4">Start by adding equipment to assess their energy consumption.</p>
                <button
                  onClick={() => {
                    const newEquipment: Equipment = {
                      id: crypto.randomUUID(),
                      name: '',
                      category: '',
                      subType: '',
                      location: '',
                      ratedPower: 0,
                      efficiency: 0,
                      operatingHours: 0,
                      operatingDays: 0,
                      loadFactor: 'Low (0-33%)',
                      condition: 'Good',
                      age: 0,
                      controlSystem: 'Manual',
                      notes: ''
                    };
                    setEquipment([newEquipment]);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Add First Equipment
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {equipment.map(eq => (
                  renderEquipmentForm(
                    eq,
                    (id, updates) => {
                      setEquipment(current =>
                        current.map(e => (e.id === id ? { ...e, ...updates } : e))
                      );
                    },
                    setShowAIDetection,
                    setEquipment,
                    rooms,
                    customerType
                  )
                ))}
              </div>
            )}

            {showAIDetection && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">AI Equipment Detection</h3>
                    <button
                      onClick={() => setShowAIDetection(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4">
                    <Suspense fallback={<div>Loading AI detection...</div>}>
                      <AIEquipmentDetection
                        onDetectionComplete={(detectedEquipment) => {
                          setEquipment(current => [...current, ...detectedEquipment]);
                          setShowAIDetection(false);
                        }}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Back to Equipment
              </button>
            </div>
            <AuditSummary buildingId={buildingId} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderStep()}
    </div>
  );
}

export { DetailedAudit }