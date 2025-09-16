import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  FaCalendarAlt, 
  FaSearch, 
  FaFilter, 
  FaEdit, 
  FaTimes, 
  FaCheck,
  FaExclamationTriangle,
  FaClock,
  FaMoneyBillWave,
  FaPercent,
  FaDownload,
  FaEye,
  FaCalendarCheck,
  FaCalendarTimes,
  FaUserClock,
  FaExclamationCircle,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';

const Appointments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Sample booking data
  const bookingStats = {
    totalBookings: 1259,
    upcomingBookings: 168,
    completedToday: 25,
    noShows: 9,
    cancellations: 13,
    disputes: 4
  };

  const bookingsData = [
    {
      id: 'BK001',
      customerName: 'Priya Sharma',
      petName: 'Buddy',
      service: 'Dog Walking',
      provider: 'Rajesh Pet Care',
      date: '2024-01-15',
      time: '10:00 AM',
      duration: '30 min',
      status: 'Confirmed',
      price: 500.00,
      location: 'Lodhi Gardens, New Delhi',
      phone: '+91 98765 43210',
      notes: 'Buddy is very energetic and loves to play fetch',
      petType: 'Dog',
      urgency: 'Normal'
    },
    {
      id: 'BK002',
      customerName: 'Arjun Patel',
      petName: 'Whiskers',
      service: 'Pet Grooming',
      provider: 'Mumbai Pet Spa',
      date: '2024-01-15',
      time: '2:00 PM',
      duration: '2 hours',
      status: 'In Progress',
      price: 1800.00,
      location: 'Bandra West, Mumbai',
      phone: '+91 87654 32109',
      notes: 'Full grooming service including nail trim',
      petType: 'Cat',
      urgency: 'Normal'
    },
    {
      id: 'BK003',
      customerName: 'Sneha Reddy',
      petName: 'Max',
      service: 'Veterinary Checkup',
      provider: 'Dr. Kavya Nair',
      date: '2024-01-14',
      time: '3:30 PM',
      duration: '45 min',
      status: 'No Show',
      price: 2500.00,
      location: 'Jubilee Hills, Hyderabad',
      phone: '+91 76543 21098',
      notes: 'Annual checkup and vaccinations',
      petType: 'Dog',
      urgency: 'High'
    },
    {
      id: 'BK004',
      customerName: 'Vikram Singh',
      petName: 'Luna',
      service: 'Pet Sitting',
      provider: 'Meera Pet Services',
      date: '2024-01-13',
      time: '8:00 AM',
      duration: '8 hours',
      status: 'Completed',
      price: 1200.00,
      location: 'Customer Home, Gurgaon',
      phone: '+91 65432 10987',
      notes: 'All day pet sitting while owners at work',
      petType: 'Dog',
      urgency: 'Normal'
    },
    {
      id: 'BK005',
      customerName: 'Kavita Agarwal',
      petName: 'Charlie',
      service: 'Dog Training',
      provider: 'Bangalore Training Pro',
      date: '2024-01-16',
      time: '11:00 AM',
      duration: '1 hour',
      status: 'Cancelled',
      price: 1500.00,
      location: 'Koramangala, Bengaluru',
      phone: '+91 54321 09876',
      notes: 'Basic obedience training session',
      petType: 'Dog',
      urgency: 'Low'
    },
    {
      id: 'BK006',
      customerName: 'Rohit Gupta',
      petName: 'Bella',
      service: 'Pet Photography',
      provider: 'Pawsome Photos Delhi',
      date: '2024-01-17',
      time: '4:00 PM',
      duration: '2 hours',
      status: 'Disputed',
      price: 3000.00,
      location: 'Connaught Place, New Delhi',
      phone: '+91 43210 98765',
      notes: 'Professional pet photoshoot package',
      petType: 'Cat',
      urgency: 'Normal'
    },
    {
      id: 'BK007',
      customerName: 'Anita Desai',
      petName: 'Rocky',
      service: 'Emergency Vet',
      provider: 'Dr. Suresh Kumar',
      date: '2024-01-18',
      time: '9:15 AM',
      duration: '1 hour',
      status: 'Confirmed',
      price: 3500.00,
      location: 'Sector 18, Noida',
      phone: '+91 99887 76655',
      notes: 'Emergency consultation for stomach issues',
      petType: 'Dog',
      urgency: 'Emergency'
    },
    {
      id: 'BK008',
      customerName: 'Ravi Krishnan',
      petName: 'Mittens',
      service: 'Cat Boarding',
      provider: 'Cozy Paws Boarding',
      date: '2024-01-19',
      time: '6:00 PM',
      duration: '3 days',
      status: 'Confirmed',
      price: 2400.00,
      location: 'Indiranagar, Bengaluru',
      phone: '+91 88776 65544',
      notes: '3-day boarding while family is traveling',
      petType: 'Cat',
      urgency: 'Normal'
    },
    {
      id: 'BK009',
      customerName: 'Deepika Joshi',
      petName: 'Simba',
      service: 'Dental Cleaning',
      provider: 'Pet Dental Care Clinic',
      date: '2024-01-20',
      time: '1:30 PM',
      duration: '90 min',
      status: 'Confirmed',
      price: 2200.00,
      location: 'Powai, Mumbai',
      phone: '+91 77665 54433',
      notes: 'Professional dental cleaning and checkup',
      petType: 'Dog',
      urgency: 'Normal'
    },
    {
      id: 'BK010',
      customerName: 'Sanjay Mehta',
      petName: 'Fluffy',
      service: 'Behavioral Training',
      provider: 'Animal Behavior Expert',
      date: '2024-01-21',
      time: '10:30 AM',
      duration: '2 hours',
      status: 'In Progress',
      price: 2800.00,
      location: 'Vasant Kunj, New Delhi',
      phone: '+91 66554 43322',
      notes: 'Addressing aggressive behavior issues',
      petType: 'Dog',
      urgency: 'High'
    },
    {
      id: 'BK011',
      customerName: 'Meera Iyer',
      petName: 'Coco',
      service: 'Spa Treatment',
      provider: 'Luxury Pet Spa',
      date: '2024-01-22',
      time: '3:00 PM',
      duration: '3 hours',
      status: 'Confirmed',
      price: 4500.00,
      location: 'Banjara Hills, Hyderabad',
      phone: '+91 55443 32211',
      notes: 'Full spa package with massage and aromatherapy',
      petType: 'Cat',
      urgency: 'Low'
    },
    {
      id: 'BK012',
      customerName: 'Amit Sharma',
      petName: 'Tiger',
      service: 'Vaccination',
      provider: 'City Vet Clinic',
      date: '2024-01-23',
      time: '11:45 AM',
      duration: '30 min',
      status: 'Completed',
      price: 800.00,
      location: 'Malviya Nagar, Jaipur',
      phone: '+91 44332 21100',
      notes: 'Annual vaccination booster shots',
      petType: 'Dog',
      urgency: 'Normal'
    }
  ];

  // Filter and sort bookings
  const filteredAndSortedBookings = bookingsData
    .filter(booking => {
      const matchesSearch = 
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.provider.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || booking.status.toLowerCase().replace(' ', '').includes(filterStatus.toLowerCase());
      const matchesService = filterService === 'all' || booking.service.toLowerCase().includes(filterService.toLowerCase());
      
      return matchesSearch && matchesStatus && matchesService;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'date') {
        comparison = new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time);
      } else if (sortField === 'customer') {
        comparison = a.customerName.localeCompare(b.customerName);
      } else if (sortField === 'service') {
        comparison = a.service.localeCompare(b.service);
      } else if (sortField === 'price') {
        comparison = a.price - b.price;
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Handle sort click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400" />;
    return sortDirection === 'asc' ? <FaSortUp className="ml-1 text-indigo-600" /> : <FaSortDown className="ml-1 text-indigo-600" />;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'Confirmed': { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaCalendarCheck },
      'In Progress': { bg: 'bg-green-100', text: 'text-green-800', icon: FaClock },
      'Completed': { bg: 'bg-gray-100', text: 'text-gray-800', icon: FaCheck },
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-800', icon: FaCalendarTimes },
      'No Show': { bg: 'bg-orange-100', text: 'text-orange-800', icon: FaUserClock },
      'Disputed': { bg: 'bg-purple-100', text: 'text-purple-800', icon: FaExclamationCircle }
    };
    
    const config = statusConfig[status] || statusConfig['Confirmed'];
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="mr-1" />
        {status}
      </span>
    );
  };

  // Handle reschedule booking
  const handleReschedule = (booking) => {
    setSelectedBooking(booking);
    setShowRescheduleModal(true);
  };

  // Handle cancel booking
  const handleCancel = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      console.log('Cancelling booking:', bookingId);
      alert('Booking cancelled successfully!');
      // In a real app, you would update the booking status via API
    }
  };

  // Handle apply discount
  const handleApplyDiscount = (booking) => {
    setSelectedBooking(booking);
    setShowDiscountModal(true);
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    if (selectedBookings.length === 0) {
      alert('Please select bookings first');
      return;
    }
    
    console.log(`Performing ${action} on bookings:`, selectedBookings);
    alert(`${action} action would be performed on ${selectedBookings.length} bookings`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FaCalendarAlt className="text-indigo-600 text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Booking & Appointment Oversight</h1>
            </div>
            <p className="text-gray-500 mt-1">View all bookings in real-time and manage appointments</p>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={() => {
                // Export bookings to CSV
                const headers = ['Booking ID', 'Customer', 'Pet', 'Service', 'Provider', 'Date', 'Time', 'Status', 'Price'];
                const csvRows = [headers];
                
                filteredAndSortedBookings.forEach(booking => {
                  csvRows.push([
                    booking.id,
                    booking.customerName,
                    booking.petName,
                    booking.service,
                    booking.provider,
                    booking.date,
                    booking.time,
                    booking.status,
                    `₹${booking.price}`
                  ]);
                });
                
                const csvString = csvRows.map(row => row.join(',')).join('\n');
                const blob = new Blob([csvString], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('hidden', '');
                a.setAttribute('href', url);
                a.setAttribute('download', `bookings-report-${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              <FaDownload /> Export Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-xl font-bold text-gray-800">{bookingStats.totalBookings}</p>
              </div>
              <div className="bg-indigo-100 p-2 rounded-full">
                <FaCalendarAlt className="text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                <p className="text-xl font-bold text-blue-600">{bookingStats.upcomingBookings}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <FaCalendarCheck className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Today</p>
                <p className="text-xl font-bold text-green-600">{bookingStats.completedToday}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <FaCheck className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">No Shows</p>
                <p className="text-xl font-bold text-orange-600">{bookingStats.noShows}</p>
              </div>
              <div className="bg-orange-100 p-2 rounded-full">
                <FaUserClock className="text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cancellations</p>
                <p className="text-xl font-bold text-red-600">{bookingStats.cancellations}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <FaCalendarTimes className="text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Disputes</p>
                <p className="text-xl font-bold text-purple-600">{bookingStats.disputes}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <FaExclamationCircle className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings, customers, pets, providers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="noshow">No Show</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
            
            {/* Service Filter */}
            <div>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
              >
                <option value="all">All Services</option>
                <option value="walking">Dog Walking</option>
                <option value="grooming">Pet Grooming</option>
                <option value="veterinary">Veterinary</option>
                <option value="sitting">Pet Sitting</option>
                <option value="training">Dog Training</option>
                <option value="photography">Pet Photography</option>
                <option value="emergency">Emergency Vet</option>
                <option value="boarding">Cat Boarding</option>
                <option value="dental">Dental Cleaning</option>
                <option value="behavioral">Behavioral Training</option>
                <option value="spa">Spa Treatment</option>
                <option value="vaccination">Vaccination</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedBookings.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('Cancel')}
                  className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                >
                  Cancel Selected ({selectedBookings.length})
                </button>
                <button
                  onClick={() => handleBulkAction('Reschedule')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  Reschedule Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bookings Grid */}
        <div className="space-y-4">
          {/* Grid Header with Select All */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBookings(filteredAndSortedBookings.map(b => b.id));
                    } else {
                      setSelectedBookings([]);
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">
                  {selectedBookings.length > 0 ? `${selectedBookings.length} selected` : 'Select all bookings'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Sort by:</span>
                  <button
                    onClick={() => handleSort('date')}
                    className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${sortField === 'date' ? 'text-indigo-600 bg-indigo-50' : ''}`}
                  >
                    Date {getSortIcon('date')}
                  </button>
                  <button
                    onClick={() => handleSort('customer')}
                    className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${sortField === 'customer' ? 'text-indigo-600 bg-indigo-50' : ''}`}
                  >
                    Customer {getSortIcon('customer')}
                  </button>
                  <button
                    onClick={() => handleSort('price')}
                    className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${sortField === 'price' ? 'text-indigo-600 bg-indigo-50' : ''}`}
                  >
                    Price {getSortIcon('price')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings Cards Grid - Fixed 3x3 Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
            {filteredAndSortedBookings.slice(0, 9).map((booking) => {
              // Get urgency color
              const getUrgencyColor = (urgency) => {
                switch(urgency) {
                  case 'Emergency': return 'border-l-red-500 bg-red-50';
                  case 'High': return 'border-l-orange-500 bg-orange-50';
                  case 'Normal': return 'border-l-blue-500 bg-blue-50';
                  case 'Low': return 'border-l-green-500 bg-green-50';
                  default: return 'border-l-gray-500 bg-gray-50';
                }
              };

              // Get pet type icon
              const getPetIcon = (petType) => {
                return petType === 'Dog' ? '🐕' : '🐱';
              };

              return (
                <div key={booking.id} className={`bg-white rounded-xl shadow-lg border-l-4 ${getUrgencyColor(booking.urgency)} hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1`}>
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBookings([...selectedBookings, booking.id]);
                            } else {
                              setSelectedBookings(selectedBookings.filter(id => id !== booking.id));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-lg">{getPetIcon(booking.petType)}</span>
                        <div className="text-xs font-mono text-gray-400">#{booking.id}</div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    {/* Urgency Badge + Pet */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        booking.urgency === 'Emergency' ? 'bg-red-100 text-red-800' :
                        booking.urgency === 'High' ? 'bg-orange-100 text-orange-800' :
                        booking.urgency === 'Normal' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {booking.urgency === 'Emergency' && '🚨'} {booking.urgency}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        🐾 For: {booking.petName}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-4">
                    {/* Date & Time */}
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <FaCalendarAlt className="text-indigo-600 text-sm" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{booking.date}</div>
                        <div className="text-xs text-gray-500">{booking.time} • {booking.duration}</div>
                      </div>
                    </div>

                    {/* Customer & Pet */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {booking.customerName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{booking.customerName}</div>
                          <div className="text-xs text-gray-500">Pet: {booking.petName} ({booking.petType})</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        📞 {booking.phone}
                      </div>
                    </div>

                    {/* Service & Provider */}
                    <div className="space-y-2">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-semibold text-gray-900 mb-1">{booking.service}</div>
                        <div className="text-xs text-gray-600">{booking.provider}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          📍 {booking.location}
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-xl font-bold text-gray-900">₹{booking.price.toFixed(0)}</div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            alert(`Viewing details for booking ${booking.id}\n\nCustomer: ${booking.customerName}\nPet: ${booking.petName} (${booking.petType})\nService: ${booking.service}\nProvider: ${booking.provider}\nDate: ${booking.date} at ${booking.time}\nUrgency: ${booking.urgency}\nNotes: ${booking.notes}`);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FaEye className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleReschedule(booking)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Reschedule"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleApplyDiscount(booking)}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Apply Discount"
                        >
                          <FaPercent className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel Booking"
                        >
                          <FaTimes className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes Preview */}
                  {booking.notes && (
                    <div className="px-5 pb-4">
                      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border-l-2 border-gray-300">
                        <span className="font-semibold">💬 Notes:</span> {booking.notes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Info */}
          {filteredAndSortedBookings.length > 9 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="flex items-center justify-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing 9 of {filteredAndSortedBookings.length} appointments
                </div>
                <button 
                  onClick={() => {
                    alert(`This would show the next set of appointments. Total available: ${filteredAndSortedBookings.length}`);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                >
                  View All Appointments
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredAndSortedBookings.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FaCalendarAlt className="text-gray-300 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Reschedule Modal */}
        {showRescheduleModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Reschedule Booking</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Date & Time</label>
                  <p className="text-sm text-gray-600">{selectedBooking.date} at {selectedBooking.time}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    defaultValue={selectedBooking.date}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    defaultValue="10:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rescheduling</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                    placeholder="Enter reason for rescheduling..."
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert(`Booking ${selectedBooking.id} has been rescheduled successfully!`);
                    setShowRescheduleModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Reschedule Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discount Modal */}
        {showDiscountModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Apply Manual Discount</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Price</label>
                  <p className="text-lg font-semibold text-gray-800">${selectedBooking.price.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter discount amount"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Discount</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                    placeholder="Enter reason for discount..."
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert(`Discount has been applied to booking ${selectedBooking.id}!`);
                    setShowDiscountModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Apply Discount
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Appointments;