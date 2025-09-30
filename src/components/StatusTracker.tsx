import { useState, useEffect } from 'react';
import { supabase, BookingStatusHistory } from '../lib/supabase';
import { CheckCircle2, Clock } from 'lucide-react';

interface StatusTrackerProps {
  bookingId: string;
}

export default function StatusTracker({ bookingId }: StatusTrackerProps) {
  const [history, setHistory] = useState<BookingStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [bookingId]);

  const loadHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('booking_status_history')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (data) setHistory(data);
    if (error) console.error('Error loading history:', error);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-600">Loading history...</div>;
  }

  if (history.length === 0) {
    return <div className="text-center py-4 text-gray-600">No status history available</div>;
  }

  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              {index === history.length - 1 ? (
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              ) : (
                <Clock className="w-5 h-5 text-blue-600" />
              )}
            </div>
            {index < history.length - 1 && (
              <div className="w-0.5 h-full bg-blue-200 mt-2" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="font-semibold text-gray-800 capitalize">
              {item.new_status.replace('_', ' ')}
            </div>
            <div className="text-sm text-gray-600">
              {new Date(item.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            {item.notes && (
              <div className="text-sm text-gray-700 mt-1">{item.notes}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}