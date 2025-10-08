/*
  # Initial Schema Setup

  1. New Tables
    - buildings
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - name (text)
      - address (text)
      - type (text)
      - area (numeric)
      - construction_year (integer)
      - created_at (timestamptz)
    
    - rooms
      - id (uuid, primary key)
      - building_id (uuid, references buildings)
      - name (text)
      - area (numeric)
      - lighting_type (text)
      - num_fixtures (integer)
      - ac_type (text)
      - ac_size (numeric)
      - notes (text)
      - created_at (timestamptz)
    
    - equipment
      - id (uuid, primary key)
      - building_id (uuid, references buildings)
      - room_id (uuid, references rooms)
      - type (text)
      - manufacturer (text)
      - model_no (text)
      - capacity (text)
      - year_installed (integer)
      - condition (text)
      - efficiency_rating (text)
      - notes (text)
      - created_at (timestamptz)
    
    - audits
      - id (uuid, primary key)
      - building_id (uuid, references buildings)
      - type (text)
      - status (text)
      - findings (jsonb)
      - recommendations (jsonb)
      - created_at (timestamptz)
    
    - equipment_photos
      - id (uuid, primary key)
      - equipment_id (uuid, references equipment)
      - url (text)
      - detection_results (jsonb)
      - created_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  type text NOT NULL,
  area numeric NOT NULL,
  construction_year integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own buildings"
  ON buildings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid REFERENCES buildings ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  area numeric NOT NULL,
  lighting_type text,
  num_fixtures integer,
  ac_type text,
  ac_size numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage rooms in their buildings"
  ON rooms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM buildings
      WHERE buildings.id = rooms.building_id
      AND buildings.user_id = auth.uid()
    )
  );

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid REFERENCES buildings ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES rooms ON DELETE SET NULL,
  type text NOT NULL,
  manufacturer text,
  model_no text,
  capacity text,
  year_installed integer,
  condition text,
  efficiency_rating text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage equipment in their buildings"
  ON equipment
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM buildings
      WHERE buildings.id = equipment.building_id
      AND buildings.user_id = auth.uid()
    )
  );

-- Audits table
CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid REFERENCES buildings ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
  findings jsonb DEFAULT '{}',
  recommendations jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage audits for their buildings"
  ON audits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM buildings
      WHERE buildings.id = audits.building_id
      AND buildings.user_id = auth.uid()
    )
  );

-- Equipment photos table
CREATE TABLE IF NOT EXISTS equipment_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES equipment ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  detection_results jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE equipment_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage photos of their equipment"
  ON equipment_photos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM equipment
      JOIN buildings ON buildings.id = equipment.building_id
      WHERE equipment.id = equipment_photos.equipment_id
      AND buildings.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_buildings_user_id ON buildings(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_building_id ON rooms(building_id);
CREATE INDEX IF NOT EXISTS idx_equipment_building_id ON equipment(building_id);
CREATE INDEX IF NOT EXISTS idx_equipment_room_id ON equipment(room_id);
CREATE INDEX IF NOT EXISTS idx_audits_building_id ON audits(building_id);
CREATE INDEX IF NOT EXISTS idx_equipment_photos_equipment_id ON equipment_photos(equipment_id);