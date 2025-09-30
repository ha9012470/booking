import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import VehicleList from './VehicleList';
import VehicleForm from './VehicleForm';
import BookingForm from './BookingForm';
import BookingList from './BookingList';
import { LogOut, Calendar, Car, Plus } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'vehicles'>('bookings');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleVehicleSuccess = () => {
    setShowVehicleForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">AutoCare</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Manage your vehicle services and bookings</p>
        </div>

        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'bookings'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>My Bookings</span>
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'vehicles'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Car className="w-5 h-5" />
              <span>My Vehicles</span>
            </button>
          </div>
        </div>

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {!showBookingForm && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Booking</span>
                </button>
              </div>
            )}

            {showBookingForm ? (
              <div>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="mb-4 text-gray-600 hover:text-gray-800 font-medium"
                >
                  ← Back to Bookings
                </button>
                <BookingForm userId={user!.id} onSuccess={handleBookingSuccess} />
              </div>
            ) : (
              <BookingList userId={user!.id} onRefresh={refreshKey} />
            )}
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div>
            {showVehicleForm ? (
              <div>
                <button
                  onClick={() => setShowVehicleForm(false)}
                  className="mb-4 text-gray-600 hover:text-gray-800 font-medium"
                >
                  ← Back to Vehicles
                </button>
                <VehicleForm
                  userId={user!.id}
                  onSuccess={handleVehicleSuccess}
                  onCancel={() => setShowVehicleForm(false)}
                />
              </div>
            ) : (
              <VehicleList
                userId={user!.id}
                onAddClick={() => setShowVehicleForm(true)}
                onRefresh={refreshKey}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}