import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Camera, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { AuditLevelInfo } from './AuditLevelInfo';
import { supabase } from '../lib/supabase';

interface Room {
  id: string;
  name: string;
  area: number;
  lightingType: string;
  numFixtures: number;
  acType: string;
  acSize: number;
  windows: Array<{
    id: string;
    height: number;
    width: number;
    glazingType: 'single' | 'double';
  }>;
  notes: string;
  dimensions?: {
    width: string;
    length: string;
  };
}

interface RoomData {
  name: string;
  area: number;
  type?: string;
  windows?: number;
  lighting_type?: string;
  num_fixtures?: number;
  ac_type?: string;
  ac_size?: number;
  room_data?: {
    dimensions?: {
      width: string;
      length: string;
    };
  };
}

interface RoomAssessmentProps {
  onComplete: () => void;
  initialRoomData?: RoomData[];
  buildingId: string;
  onBack: () => void;
}

export function RoomAssessment({ onComplete, buildingId, onBack }: RoomAssessmentProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoomData();
  }, [buildingId]);

  async function loadRoomData() {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading rooms for building:', buildingId);
      
      // Modified query to ensure unique rooms
      const { data: dbRooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name, area, lighting_type, num_fixtures, ac_type, ac_size, notes, room_data')
        .eq('building_id', buildingId)
        .gt('area', 5)
        .order('created_at', { ascending: true });

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        throw roomsError;
      }

      console.log('Fetched rooms:', dbRooms);

      if (dbRooms && dbRooms.length > 0) {
        // Use a Map to ensure unique rooms by name
        const uniqueRooms = new Map<string, any>();
        
        // Keep only the first occurrence of each room name
        dbRooms.forEach(room => {
          if (!uniqueRooms.has(room.name)) {
            uniqueRooms.set(room.name, room);
          }
        });

        const formattedRooms: Room[] = Array.from(uniqueRooms.values())
          .map(room => ({
            id: room.id,
            name: room.name || 'New Room',
            area: parseFloat(String(room.area)) || 0,
            lightingType: room.lighting_type || '',
            numFixtures: room.num_fixtures || 0,
            acType: room.ac_type || '',
            acSize: room.ac_size || 0,
            windows: [],
            notes: room.notes || '',
            dimensions: room.room_data?.dimensions
          }));

        console.log('Formatted rooms:', formattedRooms);
        setRooms(formattedRooms);
        if (formattedRooms.length > 0) {
          setSelectedRoom(formattedRooms[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading room data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }

  const addRoom = () => {
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name: 'New Room',
      area: 0,
      lightingType: '',
      numFixtures: 0,
      acType: '',
      acSize: 0,
      windows: [],
      notes: ''
    };
    setRooms(prev => [...prev, newRoom]);
    setSelectedRoom(newRoom.id);
  };

  const updateRoom = async (roomId: string, updates: Partial<Room>) => {
    try {
      // Find the current room data
      const currentRoom = rooms.find(r => r.id === roomId);
      if (!currentRoom) return;

      // Create updates object with only the changed fields
      const updatedRoom = {
        ...currentRoom,
        ...updates
      };

      // Update local state
      setRooms(prev => prev.map(r => r.id === roomId ? updatedRoom : r));

      // Update database
      if (buildingId) {
        const { error } = await supabase
          .from('rooms')
          .upsert({
            id: roomId,
            building_id: buildingId,
            name: updatedRoom.name,
            area: updatedRoom.area,
            lighting_type: updatedRoom.lightingType,
            num_fixtures: updatedRoom.numFixtures,
            ac_type: updatedRoom.acType,
            ac_size: updatedRoom.acSize,
            notes: updatedRoom.notes,
            room_data: {
              dimensions: updatedRoom.dimensions
            }
          });

        if (error) {
          console.error('Error updating room:', error);
          setError('Failed to update room. Please try again.');
          // Revert the local state if the update failed
          await loadRoomData();
        }
      }
    } catch (error) {
      console.error('Error in updateRoom:', error);
      setError('Failed to update room. Please try again.');
      // Revert the local state if there was an error
      await loadRoomData();
    }
  };

  const addWindow = (roomId: string) => {
    setRooms(prev =>
      prev.map(r =>
        r.id === roomId
          ? {
              ...r,
              windows: [
                ...r.windows,
                { id: crypto.randomUUID(), height: 0, width: 0, glazingType: 'single' },
              ],
            }
          : r
      )
    );
  };

  const renderRoomDetails = (room: Room) => (
    <div key={room.id} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
        <span className="text-sm text-gray-600">{room.area} m²</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
          <input
            type="text"
            value={room.name}
            onChange={e => updateRoom(room.id, { name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Enter room name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={room.area || ''}
            onChange={e => {
              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
              updateRoom(room.id, { area: Math.max(0, value) });
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Enter area"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lighting Type</label>
          <select
            value={room.lightingType}
            onChange={e => updateRoom(room.id, { lightingType: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select type</option>
            <option value="LED">LED</option>
            <option value="CFL">CFL</option>
            <option value="Fluorescent">Fluorescent</option>
            <option value="Halogen">Halogen</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Fixtures</label>
          <input
            type="number"
            min="0"
            value={room.numFixtures || ''}
            onChange={e => {
              const value = e.target.value === '' ? 0 : parseInt(e.target.value);
              updateRoom(room.id, { numFixtures: Math.max(0, value) });
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Enter number of fixtures"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">AC Type</label>
          <select
            value={room.acType}
            onChange={e => updateRoom(room.id, { acType: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select type</option>
            <option value="Split Unit">Split Unit</option>
            <option value="Window Unit">Window Unit</option>
            <option value="Central">Central</option>
            <option value="None">None</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">AC Size (BTU)</label>
          <input
            type="number"
            min="0"
            value={room.acSize || ''}
            onChange={e => {
              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
              updateRoom(room.id, { acSize: Math.max(0, value) });
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Enter AC size"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Windows</label>
          <button
            onClick={() => addWindow(room.id)}
            className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Window
          </button>
        </div>
        <div className="space-y-3">
          {room.windows.map((w, i) => (
            <div key={w.id} className="grid grid-cols-3 gap-3">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Height (m)"
                value={w.height || ''}
                onChange={e => {
                  const updated = [...room.windows];
                  updated[i].height = Math.max(0, parseFloat(e.target.value) || 0);
                  updateRoom(room.id, { windows: updated });
                }}
                className="px-3 py-1.5 border rounded text-sm"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Width (m)"
                value={w.width || ''}
                onChange={e => {
                  const updated = [...room.windows];
                  updated[i].width = Math.max(0, parseFloat(e.target.value) || 0);
                  updateRoom(room.id, { windows: updated });
                }}
                className="px-3 py-1.5 border rounded text-sm"
              />
              <select
                value={w.glazingType}
                onChange={e => {
                  const updated = [...room.windows];
                  updated[i].glazingType = e.target.value as 'single' | 'double';
                  updateRoom(room.id, { windows: updated });
                }}
                className="px-3 py-1.5 border rounded text-sm"
              >
                <option value="single">Single Glazed</option>
                <option value="double">Double Glazed</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          rows={3}
          value={room.notes}
          onChange={e => updateRoom(room.id, { notes: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          placeholder="Additional observations..."
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <AuditLevelInfo 
        level="II"
        isoStandard="ASHRAE Level II – Room Assessment"
        className="mb-6"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Room Assessment</h2>
        </div>
        <button
          onClick={addRoom}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Error Loading Rooms</h4>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Plus className="w-8 h-8 mx-auto text-gray-400" />
          <p className="text-gray-600 mt-2">No rooms added yet. Click "Add Room" to begin.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition-colors ${
                  selectedRoom === room.id ? 'border-green-500' : 'border-gray-200 hover:border-green-200'
                }`}
              >
                <h3 className="font-medium text-gray-900">{room.name}</h3>
                <p className="text-sm text-gray-600">{room.area} m²</p>
              </div>
            ))}
          </div>

          {selectedRoom && renderRoomDetails(rooms.find(r => r.id === selectedRoom)!)}

          <div className="flex justify-end">
            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Continue to Equipment <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}