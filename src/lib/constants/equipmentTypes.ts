export const RESIDENTIAL_EQUIPMENT = {
  'HVAC': [
    { type: 'Split AC', defaultCapacity: '12000-36000 BTU' },
    { type: 'Window AC', defaultCapacity: '5000-24000 BTU' },
    { type: 'Central AC', defaultCapacity: '24000-60000 BTU' },
    { type: 'Heat Pump', defaultCapacity: '24000-48000 BTU' },
    { type: 'Furnace', defaultCapacity: '40000-120000 BTU' }
  ],
  'Water Heating': [
    { type: 'Tank Water Heater', defaultCapacity: '30-80 gallons' },
    { type: 'Tankless Water Heater', defaultCapacity: '6-10 GPM' },
    { type: 'Heat Pump Water Heater', defaultCapacity: '50-80 gallons' }
  ],
  'Appliances': [
    { type: 'Refrigerator', defaultCapacity: '18-25 cu.ft.' },
    { type: 'Washing Machine', defaultCapacity: '3.5-5.0 cu.ft.' },
    { type: 'Dryer', defaultCapacity: '7.0-8.0 cu.ft.' },
    { type: 'Dishwasher', defaultCapacity: '12-14 place settings' }
  ],
  'Lighting': [
    { type: 'LED Bulbs', defaultCapacity: '9-15W' },
    { type: 'LED Fixtures', defaultCapacity: '15-30W' },
    { type: 'Smart Lighting', defaultCapacity: '9-15W' }
  ],
  'Pool Equipment': [
    { type: 'Pool Pump', defaultCapacity: '1-2.5 HP' },
    { type: 'Pool Heater', defaultCapacity: '100000-400000 BTU' }
  ]
};

export const COMMERCIAL_EQUIPMENT = {
  'HVAC': [
    { type: 'Rooftop Unit (RTU)', defaultCapacity: '5-50 tons' },
    { type: 'VAV System', defaultCapacity: '2000-8000 CFM' },
    { type: 'Chiller', defaultCapacity: '20-500 tons' },
    { type: 'Cooling Tower', defaultCapacity: '50-1000 tons' },
    { type: 'Air Handling Unit (AHU)', defaultCapacity: '2000-50000 CFM' }
  ],
  'Lighting': [
    { type: 'LED Panels', defaultCapacity: '30-50W' },
    { type: 'High Bay LED', defaultCapacity: '100-240W' },
    { type: 'Office Lighting', defaultCapacity: '30-40W' },
    { type: 'Parking Lighting', defaultCapacity: '150-400W' }
  ],
  'Motors & Pumps': [
    { type: 'Supply Fan', defaultCapacity: '1-50 HP' },
    { type: 'Return Fan', defaultCapacity: '1-40 HP' },
    { type: 'Chilled Water Pump', defaultCapacity: '2-100 HP' },
    { type: 'Condenser Water Pump', defaultCapacity: '2-100 HP' }
  ],
  'Building Controls': [
    { type: 'BMS Controller', defaultCapacity: 'N/A' },
    { type: 'VAV Controller', defaultCapacity: 'N/A' },
    { type: 'Smart Thermostat', defaultCapacity: 'N/A' }
  ]
};

export const INDUSTRIAL_EQUIPMENT = {
  'Process Equipment': [
    { type: 'Process Chiller', defaultCapacity: '20-2000 tons' },
    { type: 'Process Boiler', defaultCapacity: '500-5000 MBH' },
    { type: 'Compressed Air System', defaultCapacity: '25-500 HP' },
    { type: 'Industrial Furnace', defaultCapacity: '1-10 MMBTU' }
  ],
  'Motors & Drives': [
    { type: 'Process Motor', defaultCapacity: '1-500 HP' },
    { type: 'VFD', defaultCapacity: '1-1000 HP' },
    { type: 'Conveyor System', defaultCapacity: '1-100 HP' },
    { type: 'Industrial Fan', defaultCapacity: '5-500 HP' }
  ],
  'HVAC': [
    { type: 'Make-up Air Unit', defaultCapacity: '5000-100000 CFM' },
    { type: 'Exhaust System', defaultCapacity: '5000-100000 CFM' },
    { type: 'Dust Collection', defaultCapacity: '5000-50000 CFM' }
  ],
  'Utility Systems': [
    { type: 'Steam System', defaultCapacity: '1000-10000 lbs/hr' },
    { type: 'Process Water System', defaultCapacity: '100-1000 GPM' },
    { type: 'Cooling Tower', defaultCapacity: '100-2000 tons' }
  ]
};

export const HEALTHCARE_EQUIPMENT = {
  'HVAC': [
    { type: 'Medical Air Handler', defaultCapacity: '5000-50000 CFM' },
    { type: 'Operating Room HVAC', defaultCapacity: '2000-4000 CFM' },
    { type: 'Isolation Room System', defaultCapacity: '500-1000 CFM' },
    { type: 'Medical Chiller', defaultCapacity: '100-500 tons' }
  ],
  'Medical Equipment': [
    { type: 'Medical Vacuum System', defaultCapacity: '10-50 HP' },
    { type: 'Medical Air Compressor', defaultCapacity: '10-50 HP' },
    { type: 'Sterilization Equipment', defaultCapacity: '20-50 kW' }
  ],
  'Backup Systems': [
    { type: 'Emergency Generator', defaultCapacity: '100-2000 kW' },
    { type: 'UPS System', defaultCapacity: '20-200 kVA' }
  ]
};

export const EDUCATIONAL_EQUIPMENT = {
  'HVAC': [
    { type: 'Classroom Unit Ventilator', defaultCapacity: '750-2000 CFM' },
    { type: 'Gymnasium AHU', defaultCapacity: '5000-20000 CFM' },
    { type: 'Library HVAC', defaultCapacity: '2000-10000 CFM' },
    { type: 'Cafeteria Kitchen Hood', defaultCapacity: '2000-6000 CFM' }
  ],
  'Lighting': [
    { type: 'Classroom Lighting', defaultCapacity: '30-40W per fixture' },
    { type: 'Gymnasium Lighting', defaultCapacity: '100-200W per fixture' },
    { type: 'Exterior Lighting', defaultCapacity: '50-150W per fixture' }
  ],
  'Lab Equipment': [
    { type: 'Fume Hood', defaultCapacity: '500-1000 CFM' },
    { type: 'Lab Air System', defaultCapacity: '2000-5000 CFM' }
  ]
};

export interface EquipmentType {
  type: string;
  defaultCapacity: string;
}

export const EQUIPMENT_CONDITIONS = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Critical'
] as const;

export const CONTROL_SYSTEMS = [
  'Manual',
  'Programmable Thermostat',
  'BMS Integration',
  'Smart Controls',
  'None'
] as const;

export const LOAD_FACTORS = [
  'Low (0-33%)',
  'Medium (34-66%)',
  'High (67-100%)'
] as const;

export const MAINTENANCE_FREQUENCIES = [
  'Monthly',
  'Quarterly',
  'Semi-Annual',
  'Annual',
  'As Needed'
] as const;

export const getEquipmentTypes = (customerType: string): Record<string, EquipmentType[]> => {
  switch (customerType.toLowerCase()) {
    case 'residential':
      return RESIDENTIAL_EQUIPMENT;
    case 'commercial':
      return COMMERCIAL_EQUIPMENT;
    case 'industrial':
      return INDUSTRIAL_EQUIPMENT;
    case 'healthcare':
      return HEALTHCARE_EQUIPMENT;
    case 'educational':
      return EDUCATIONAL_EQUIPMENT;
    default:
      return RESIDENTIAL_EQUIPMENT;
  }
};

export const getDefaultLoadFactor = (category: string): string => {
  const highLoadCategories = ['Process Equipment', 'HVAC', 'Medical Equipment'];
  const mediumLoadCategories = ['Motors & Drives', 'Utility Systems', 'Lab Equipment'];
  return highLoadCategories.includes(category) ? 'High (67-100%)' :
         mediumLoadCategories.includes(category) ? 'Medium (34-66%)' : 
         'Low (0-33%)';
};

export const getEfficiencyThresholds = (category: string): {
  excellent: number;
  good: number;
  fair: number;
} => {
  switch (category) {
    case 'HVAC':
      return { excellent: 95, good: 85, fair: 75 };
    case 'Lighting':
      return { excellent: 90, good: 80, fair: 70 };
    case 'Motors & Drives':
      return { excellent: 93, good: 88, fair: 80 };
    case 'Process Equipment':
      return { excellent: 92, good: 85, fair: 75 };
    default:
      return { excellent: 90, good: 80, fair: 70 };
  }
};