import { useState, useEffect } from 'react';
import { supabase, Vehicle, ServiceType, TimeSlot } from '../lib/supabase';
import { Calendar, Clock, FileText, CheckCircle } from 'lucide-react';

interface BookingFormProps {
  userId: string;
  onSuccess: () => void;
}

export default function BookingForm({ userId, onSuccess }: BookingFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVehicles();
    loadServices();
  }, [userId]);

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setVehicles(data);
    if (error) console.error('Error loading vehicles:', error);
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('active', true)
      .order('name');

    if (data) setServices(data);
    if (error) console.error('Error loading services:', error);
  };

  const loadTimeSlots = async (date: string) => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('date', date)
      .eq('active', true)
      .order('start_time');

    if (data) setTimeSlots(data);
    if (error) console.error('Error loading time slots:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const slot = timeSlots.find(s => s.id === selectedSlot);
      if (slot && slot.booked_count >= slot.capacity) {
        throw new Error('This time slot is fully booked');
      }

      const { error: insertError } = await supabase.from('bookings').insert({
        user_id: userId,
        vehicle_id: selectedVehicle,
        service_type_id: selectedService,
        time_slot_id: selectedSlot,
        notes,
        status: 'pending',
      });

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const selectedServiceData = services.find(s => s.id === selectedService);
  const filteredServices = selectedVehicle
    ? services.filter(s => {
        const vehicle = vehicles.find(v => v.id === selectedVehicle);
        return s.vehicle_type === 'both' || s.vehicle_type === vehicle?.vehicle_type;
      })
    : services;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Book a Service</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Vehicle
          </label>
          {vehicles.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
              Please add a vehicle first before booking a service.
            </div>
          ) : (
            <select
              value={selectedVehicle}
              onChange={(e) => {
                setSelectedVehicle(e.target.value);
                setSelectedService('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Choose a vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.registration_number})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedVehicle && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Service
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedService(service.id)}
                    className={`p-4 border-2 rounded-lg transition text-left ${
                      selectedService === service.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{service.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{service.description}</div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration_minutes} min
                      </span>
                      <span className="font-semibold text-blue-600">
                        ${service.price.toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedService && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot('');
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="">Choose a date</option>
                      {getAvailableDates().map((date) => (
                        <option key={date} value={date}>
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedDate && timeSlots.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Time Slot
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {timeSlots.map((slot) => {
                        const isAvailable = slot.booked_count < slot.capacity;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => isAvailable && setSelectedSlot(slot.id)}
                            disabled={!isAvailable}
                            className={`p-3 border-2 rounded-lg transition ${
                              selectedSlot === slot.id
                                ? 'border-blue-600 bg-blue-50 text-blue-600'
                                : isAvailable
                                ? 'border-gray-300 hover:border-gray-400'
                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <div className="font-semibold">
                              {slot.start_time.slice(0, 5)}
                            </div>
                            <div className="text-xs mt-1">
                              {isAvailable
                                ? `${slot.capacity - slot.booked_count} spots`
                                : 'Full'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedSlot && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        rows={3}
                        placeholder="Any specific concerns or requests..."
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {selectedSlot && selectedServiceData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Booking Summary</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <div>Service: {selectedServiceData.name}</div>
              <div>Duration: {selectedServiceData.duration_minutes} minutes</div>
              <div>Price: ${selectedServiceData.price.toFixed(2)}</div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedSlot || vehicles.length === 0}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Creating Booking...</span>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Confirm Booking</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}