import { useState, useEffect } from 'react';
import { supabase, Booking } from '../lib/supabase';
import { Calendar, Clock, Car, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface BookingListProps {
  userId: string;
  onRefresh?: number;
}

const statusConfig = {
  pending: { color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: AlertCircle, label: 'Pending' },
  confirmed: { color: 'text-blue-700 bg-blue-50 border-blue-200', icon: CheckCircle2, label: 'Confirmed' },
  in_progress: { color: 'text-orange-700 bg-orange-50 border-orange-200', icon: Loader2, label: 'In Progress' },
  completed: { color: 'text-green-700 bg-green-50 border-green-200', icon: CheckCircle2, label: 'Completed' },
  cancelled: { color: 'text-red-700 bg-red-50 border-red-200', icon: XCircle, label: 'Cancelled' },
};

export default function BookingList({ userId, onRefresh }: BookingListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, [userId, onRefresh]);

  const loadBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicle:vehicles(*),
        service_type:service_types(*),
        time_slot:time_slots(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setBookings(data);
    if (error) console.error('Error loading bookings:', error);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Bookings Yet</h3>
        <p className="text-gray-600">Book your first service to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const config = statusConfig[booking.status];
        const StatusIcon = config.icon;

        return (
          <div
            key={booking.id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {booking.service_type?.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Car className="w-4 h-4" />
                    <span>
                      {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{booking.vehicle?.registration_number}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">
                    {new Date(booking.time_slot?.date || '').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">
                    {booking.time_slot?.start_time.slice(0, 5)} - {booking.time_slot?.end_time.slice(0, 5)}
                  </span>
                </div>
              </div>

              {booking.notes && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">{booking.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  Booked on {new Date(booking.created_at).toLocaleDateString()}
                </div>
                <div className="text-lg font-bold text-blue-600">
                  ${booking.service_type?.price.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}