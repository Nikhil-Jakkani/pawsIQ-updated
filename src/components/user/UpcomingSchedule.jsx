import React, { useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaBell } from 'react-icons/fa';
import { PetIcon } from '../layout/PetIcons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UpcomingSchedule = ({ pets = [], appointments = null, accessToken }) => {
  const navigate = useNavigate();
  const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';
  const { authFetch, loading: authLoading, currentUser, fetchUserDashboard } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  // Memoize the current date to prevent unnecessary re-renders
  const currentDate = useMemo(() => new Date(), []);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const isWithinHours = (dt, hours) => {
    const now = new Date();
    const diffHours = (dt.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= hours;
  };

  useEffect(() => {
    if (authLoading || !currentUser) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        // Only load appointments if we have pets data
        if (!pets.length) return [];

        // Use provided appointments prop to avoid duplicate fetching
        let itemsSrc = appointments;
        
        // If no appointments prop provided, fetch them
        if (!itemsSrc) {
          // Prefer aggregated dashboard data
          let appts = null;
          try {
            const payload = await fetchUserDashboard();
            appts = payload?.appointments?.recent || null;
          } catch (_) {}

          itemsSrc = appts;
          if (!itemsSrc) {
            const res = await authFetch(`${API_URL}/appointments?page=1&limit=50`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || 'Failed to load appointments');
            itemsSrc = data?.items || [];
          }
        }

        // Process appointments in a single pass
        const mapped = (itemsSrc || [])
          .map((a) => {
            const dt = new Date(a.appointment_date);
            if (isNaN(dt.getTime())) return null;

            const petIdNum = Number(a.pet_id);
            const pet = pets.find((p) => Number(p.id) === petIdNum);
            const isToday = isSameDay(dt, currentDate);
            const rawStatus = (a.appointment_status || 'Scheduled').toLowerCase();
            
            // Map backend statuses to display statuses
            // 'scheduled' and 'confirmed' both mean the appointment is confirmed
            const displayStatus = rawStatus === 'scheduled' ? 'confirmed' : rawStatus;

            return {
              id: a.appointment_id ?? `${petIdNum}-${dt.toISOString()}`,
              type: 'appointment',
              title: a.appointment_type || 'Appointment',
              petName: pet?.name || 'Pet',
              petType: (pet?.type || 'dog').toLowerCase(),
              time: dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
              date: isToday ? 'Today' : 'Other',
              location: a.appointment_comments || '',
              status: displayStatus,
              urgent: isToday && isWithinHours(dt, 2),
              isToday,
            };
          })
          .filter(Boolean); // Remove any null entries from invalid dates
        if (!cancelled) setItems(mapped);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load appointments');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, currentUser, authFetch, API_URL, pets.length, appointments, currentDate]);

  const getItemIcon = (type) => {
    return type === 'appointment' ? FaCalendarAlt : FaBell;
  };

  const getStatusColor = (status, urgent) => {
    if (urgent) return 'border-l-red-400 bg-red-50';
    if (status === 'confirmed') return 'border-l-green-400 bg-green-50';
    return 'border-l-yellow-400 bg-yellow-50';
  };

  // Memoize today's items to prevent re-filtering on every render
  const todayItems = useMemo(() => {
    return items.filter((item) => item.isToday);
  }, [items]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaCalendarAlt className="text-[#145ae6]" />
          Today's Schedule
        </h2>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
          {todayItems.length} items
        </span>
      </div>

      {error && (
        <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-xs text-gray-500 mb-2">Loading appointments…</div>
      )}

      <div className="space-y-2">
        {todayItems.map((item) => {
          const IconComponent = getItemIcon(item.type);
          
          return (
            <div 
              key={item.id}
              className={`border-l-4 rounded-lg p-3 ${getStatusColor(item.status, item.urgent)} hover:shadow-sm transition-all duration-200`}
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-1.5 ${
                  item.urgent ? 'bg-red-100' : 
                  item.petType === 'cat' ? 'bg-blue-100' : 'bg-blue-100'
                }`}>
                  <IconComponent className={`text-xs ${
                    item.urgent ? 'text-red-600' :
                    'text-[#145ae6]'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-800 text-sm truncate flex items-center gap-1">
                      {item.title}
                      {item.urgent && (
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                          !
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">{item.time}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <PetIcon type={item.petType} className={`text-xs text-[#145ae6]`} />
                    <span className="text-xs text-gray-600">{item.petName}</span>
                    {item.location && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs text-gray-500 truncate">{item.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && todayItems.length === 0 && !error && (
        <div className="text-xs text-gray-500 text-center mt-2">No items for today.</div>
      )}
      <div className="mt-4 text-center">
        <button onClick={() => navigate('/user/appointments')} className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
          View All
        </button>
      </div>
    </div>
  );
};

export default UpcomingSchedule;