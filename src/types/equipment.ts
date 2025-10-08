export interface Equipment {
  id: string;
  name: string;
  category: string;
  subType: string;
  location: string;
  ratedPower: number;
  operatingHours: number;
  operatingDays: number;
  usageSchedule: string;
  efficiency: number;
  loadFactor: 'Low (0-33%)' | 'Medium (34-66%)' | 'High (67-100%)';
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  controlSystem: 'Manual' | 'Programmable Thermostat' | 'BMS Integration' | 'Smart Controls' | 'None';
  age: number;
  manufacturer: string;
  modelNo: string;
  serialNumber: string;
  capacity: string;
  installationDate: string;
  maintenanceFrequency: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual' | 'As Needed';
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceHistory: Array<{
    date: string;
    type: string;
    description: string;
    technician: string;
  }>;
  energyMetered: boolean;
  iotConnected: boolean;
  notes: string;
  annualEnergy?: number;
  isHighImpact?: boolean;
  savingsPotential?: number;
  aiRecommendations?: string;
}

export interface MaintenanceRecord {
  date: string;
  type: string;
  description: string;
  technician: string;
}

export type EquipmentCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
export type ControlSystem = 'Manual' | 'Programmable Thermostat' | 'BMS Integration' | 'Smart Controls' | 'None';
export type LoadFactor = 'Low (0-33%)' | 'Medium (34-66%)' | 'High (67-100%)';
export type MaintenanceFrequency = 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual' | 'As Needed';