import { useState, useEffect } from 'react';
import { supabase, Vehicle } from '../lib/supabase';
import { Car, Bike, Trash2, Plus } from 'lucide-react';

interface VehicleListProps {
  userId: string;
  onAddClick: () => void;
  onRefresh?: number;
}

export default function VehicleList({ userId, onAddClick, onRefresh }: VehicleListProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, [userId, onRefresh]);

  const loadVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setVehicles(data);
    if (error) console.error('Error loading vehicles:', error);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    const { error } = await supabase.from('vehicles').delete().eq('id', id);

    if (error) {
      alert('Failed to delete vehicle: ' + error.message);
    } else {
      loadVehicles();
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading vehicles...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Vehicles</h2>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Vehicles Added</h3>
          <p className="text-gray-600 mb-6">Add your first vehicle to start booking services</p>
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Vehicle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {vehicle.vehicle_type === 'car' ? (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Car className="w-6 h-6 text-blue-600" />
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Bike className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-600">{vehicle.year}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-2 inline-block">
                <span className="font-mono font-semibold text-gray-800">
                  {vehicle.registration_number}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}