export type Building = {
  id: string;
  user_id: string;
  name: string;
  address: string;
  type: 'residential' | 'commercial' | 'industrial' | 'educational';
  area: number;
  construction_year: number;
  created_at: string;
};

export type Room = {
  id: string;
  building_id: string;
  name: string;
  area: number;
  lighting_type: string | null;
  num_fixtures: number | null;
  ac_type: string | null;
  ac_size: number | null;
  notes: string | null;
  created_at: string;
};

export type Equipment = {
  id: string;
  building_id: string;
  room_id: string | null;
  type: string;
  manufacturer: string | null;
  model_no: string | null;
  capacity: string | null;
  year_installed: number | null;
  condition: string | null;
  efficiency_rating: string | null;
  notes: string | null;
  created_at: string;
};

export type Audit = {
  id: string;
  building_id: string;
  type: 'initial' | 'detailed';
  status: 'pending' | 'in_progress' | 'completed';
  findings: Record<string, any>;
  recommendations: Array<{
    title: string;
    description: string;
    savings: number;
    cost: number;
    roi: number;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  created_at: string;
};

export type EquipmentPhoto = {
  id: string;
  equipment_id: string;
  url: string;
  detection_results: Record<string, any>;
  created_at: string;
};