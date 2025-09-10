import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaPlus, FaSearch, FaFilter, FaEye, FaTimes, FaCheck, FaClock, FaMapMarkerAlt, FaPaw, FaCalendarCheck } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserAppointments = () => {
  const navigate = useNavigate();
  const { currentUser, tokens } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [petsById, setPetsById] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accessToken = tokens?.access?.token;

  const toUiStatus = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'upcoming';
      case 'Completed':
        return 'completed';
      case 'Cancelled':
        return 'cancelled';
      default:
        return 'upcoming';
    }
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { date: '—', time: '' };
    const date = d.toISOString().slice(0, 10);
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  };

  const fetchPets = async () => {
    try {
      const res = await fetch(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();

      const map = {};
      (data?.pets || []).forEach((p) => {
        map[String(p.pet_id)] = { name: p.pet_name || 'Pet', type: p.pet_type || '' };
      });
      setPetsById(map);
    } catch (e) {
      // ignore
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/appointments?limit=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));

      // If unauthorized/invalid token, suppress error and show empty state
      if (res.status === 401) {
        setAppointments([]);
        return;
      }
      if (!res.ok) throw new Error(payload?.message || 'Failed to load appointments');
      const items = (payload?.items || []).map((a) => {
        const pet = petsById[String(a.pet_id)] || {};
        const { date, time } = formatDateTime(a.appointment_date);
        return {
          id: a.appointment_id,
          petName: pet.name || 'Pet',
          petType: pet.type || '',
          serviceType: a.appointment_type,
          date,
          time,
          status: toUiStatus(a.appointment_status),
          notes: a.appointment_comments || '',
          location: '—',
          address: '—',
        };
      });
      setAppointments(items);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    // load pets first, then appointments to map names
    (async () => {
      await fetchPets();
      await fetchAppointments();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Filter appointments based on search term and filter status
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.petName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      appointment.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.providerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || appointment.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Cancel appointment handler
  const handleCancelAppointment = async (id) => {
    if (!accessToken) return;
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ appointment_status: 'Cancelled' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to cancel appointment');
      }
      // refresh list
      await fetchAppointments();
    } catch (e) {
      alert(e.message);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch(status) {
      case 'upcoming':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          icon: <FaClock className="text-blue-500" />
        };
      case 'completed':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: <FaCheck className="text-green-500" />
        };
      case 'cancelled':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: <FaTimes className="text-red-500" />
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: <FaClock className="text-gray-500" />
        };
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#e3f2fd' }}>
                <FaCalendarAlt className="text-2xl" style={{ color: '#145ae6' }} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
            </div>
            <p className="text-gray-500 mt-1">Manage your pet service appointments</p>
          </div>
          <button 
            onClick={() => navigate('/user/appointments/new')}
            className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            style={{ backgroundColor: '#145ae6' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0f4bc7'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#145ae6'}
          >
            <FaPlus />
            Book New Appointment
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by pet, service, or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Appointments</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointment Cards - Enhanced Grid Layout */}
        {loading ? (
          <div className="bg-white rounded-lg p-6 text-center border border-gray-200">Loading appointments...</div>
        ) : error ? (
          <div className="bg-red-50 rounded-lg p-6 text-center border border-red-200 text-red-700">{error}</div>
        ) : filteredAppointments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAppointments.map(appointment => {
              const statusBadge = getStatusBadge(appointment.status);
              const appointmentDate = new Date(appointment.date);
              const isUpcoming = appointment.status === 'upcoming';

              return (
                <div 
                  key={appointment.id} 
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Card Header with Status */}
                  <div className={`h-2 ${
                    appointment.status === 'upcoming' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                    appointment.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    'bg-gradient-to-r from-red-400 to-red-600'
                  }`}></div>
                  
                  <div className="p-6">
                    {/* Service Type & Pet Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          appointment.status === 'upcoming' ? 'bg-blue-50' :
                          appointment.status === 'completed' ? 'bg-green-50' :
                          'bg-red-50'
                        }`}>
                          <FaCalendarCheck className={`text-xl ${
                            appointment.status === 'upcoming' ? 'text-blue-600' :
                            appointment.status === 'completed' ? 'text-green-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-1">{appointment.serviceType}</h3>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <FaPaw className="text-purple-500" />
                            <span className="font-medium">{appointment.petName}</span>
                            <span className="text-gray-400">•</span>
                            <span className="capitalize">{appointment.petType}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1.5 rounded-full ${statusBadge.bgColor} ${statusBadge.textColor} text-xs font-bold flex items-center gap-1.5 shadow-sm`}>
                        {statusBadge.icon}
                        <span>{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <FaCalendarAlt className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {appointmentDate.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-600 font-medium">{appointment.time}</p>
                        </div>
                      </div>
                    </div>

                    {/* Provider Info */}
                    {appointment.providerName && (
                      <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <img 
                            src={appointment.providerImage} 
                            alt={appointment.providerName} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{appointment.providerName}</p>
                          <p className="text-xs text-blue-600 font-medium">Service Provider</p>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-3 mb-4">
                      <FaMapMarkerAlt className="text-purple-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{appointment.location}</p>
                        <p className="text-xs text-gray-500">{appointment.address}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                      <div className="mb-4 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                        <p className="font-bold mb-1 text-yellow-800">Notes:</p>
                        <p className="text-gray-700">{appointment.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => navigate(`/user/appointments/${appointment.id}`)}
                        className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <FaEye />
                        View Details
                      </button>

                      {isUpcoming && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => navigate(`/user/appointments/reschedule/${appointment.id}`)}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <FaCalendarAlt />
                            Reschedule
                          </button>

                          <button 
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <FaTimes />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#e3f2fd' }}>
              <FaCalendarAlt className="text-2xl" style={{ color: '#145ae6' }} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No appointments found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? "No appointments match your search criteria. Try adjusting your filters."
                : "You don't have any appointments scheduled. Book your first appointment now!"}
            </p>
            <button 
              onClick={() => navigate('/user/appointments/new')}
              className="text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              style={{ backgroundColor: '#145ae6' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0f4bc7'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#145ae6'}
            >
              <FaPlus />
              Book New Appointment
            </button>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default UserAppointments;