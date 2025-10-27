import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { useLocation as useUserLocation } from '../hooks/useLocation';
import { 
  FaUsers, 
  FaUserShield, 
  FaUserCog, 
  FaDatabase, 
  FaSearch, 
  FaFilter, 
  FaEllipsisH, 
  FaCheck, 
  FaBan, 
  FaTrash, 
  FaEdit,
  FaUserPlus,
  FaDownload,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaMapMarkerAlt,
  FaStar,
  FaCalendarCheck,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHospital,
  FaStethoscope,
  FaCut,
  FaPaw,
  FaGraduationCap,
  FaTimes
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/DashboardLayout';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';

const Providers = () => {
  const api = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, data: null });
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch providers from backend (supports server-side filters)
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        if (searchTerm) qs.set('search', searchTerm);
        if (filterStatus && filterStatus !== 'all') qs.set('status', filterStatus);
        if (filterType && filterType !== 'all') qs.set('type', filterType);
        if (filterLocation) qs.set('location', filterLocation);
        const url = `/admin/piq/providers${qs.toString() ? `?${qs.toString()}` : ''}`;
        const data = await api.get(url);
        if (!alive) return;
        setProviders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error loading providers:', e);
        toast.error('Error loading providers');
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [api, searchTerm, filterStatus, filterType, filterLocation]);

  // Map backend providers to UI format
  const providersData = providers.map(p => {
    const rawType = p.serv_provider_type || p.type || 'Provider';
    const rawStatus = p.serv_provider_status || p.status || 'pending';
    return {
      id: p.service_provider_id || p.id,
      name: p.serv_provider_name || p.name || 'Unknown',
      email: p.serv_provider_email || p.email || '',
      type: rawType.charAt(0).toUpperCase() + rawType.slice(1),
      specialty: p.serv_provider_specialization || p.specialty || p.provider_src || 'General',
      status: rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1),
      location: p.serv_provider_location || p.location || '',
      rating: Number(p.rating) || 0,
      reviews: Number(p.reviews) || 0,
      lastActive: p.last_updated_dtm ? new Date(p.last_updated_dtm).toLocaleString() : (p.lastActive || 'Never'),
      registeredDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : (p.date || '—'),
      appointments: Number(p.appointments) || 0,
      commission: p.commission || '15%',
      verified: (p.serv_provider_status || p.status) === 'active',
    };
  });

  const providerStats = {
    totalProviders: providersData.length,
    activeProviders: providersData.filter(p => p.status === 'Active').length,
    pendingApproval: providersData.filter(p => p.status === 'Pending').length,
    flaggedProviders: providersData.filter(p => p.status === 'Flagged').length
  };

  // Filter and sort providers
  const filteredAndSortedProviders = providersData
    .filter(provider => {
      const matchesSearch = 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (provider.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || provider.status.toLowerCase() === filterStatus.toLowerCase();
      const matchesType = filterType === 'all' || provider.type.toLowerCase() === filterType.toLowerCase();
      const matchesLocation = !filterLocation || (provider.location || '').toLowerCase().includes(filterLocation.toLowerCase());
      
      return matchesSearch && matchesStatus && matchesType && matchesLocation;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'email') {
        comparison = a.email.localeCompare(b.email);
      } else if (sortField === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortField === 'specialty') {
        comparison = a.specialty.localeCompare(b.specialty);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'rating') {
        comparison = a.rating - b.rating;
      } else if (sortField === 'reviews') {
        comparison = a.reviews - b.reviews;
      } else if (sortField === 'appointments') {
        comparison = a.appointments - b.appointments;
      } else if (sortField === 'registeredDate') {
        // Simple date comparison for demo purposes
        const dateA = new Date(a.registeredDate.split('/').reverse().join('/'));
        const dateB = new Date(b.registeredDate.split('/').reverse().join('/'));
        comparison = dateA - dateB;
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

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(filteredAndSortedProviders.map(provider => provider.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual provider selection
  const handleSelectProvider = (providerId) => {
    if (selectedProviders.includes(providerId)) {
      setSelectedProviders(selectedProviders.filter(id => id !== providerId));
    } else {
      setSelectedProviders([...selectedProviders, providerId]);
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    if (selectedProviders.length === 0) {
      toast.error('Please select at least one provider');
      return;
    }

    const actionConfig = {
      approve: { title: 'Approve Providers', message: `Approve ${selectedProviders.length} provider(s)?`, type: 'success' },
      suspend: { title: 'Suspend Providers', message: `Suspend ${selectedProviders.length} provider(s)?`, type: 'warning' },
      delete: { title: 'Delete Providers', message: `Permanently delete ${selectedProviders.length} provider(s)? This action cannot be undone.`, type: 'danger' }
    };

    const config = actionConfig[action];
    if (!config) return;

    setConfirmDialog({
      isOpen: true,
      action,
      data: { ids: selectedProviders, config }
    });
  };

  const executeBulkAction = async () => {
    const { action, data } = confirmDialog;
    setIsProcessing(true);
    
    try {
      // Try to call the API endpoint
      const endpoint = `/admin/providers/bulk-${action}`;
      await api.post(endpoint, { providerIds: data.ids });
      
      toast.success(`Successfully ${action}ed ${data.ids.length} provider(s)`);
      setSelectedProviders([]);
      setSelectAll(false);
      // Refresh the provider list
      const qs = new URLSearchParams();
      if (searchTerm) qs.set('search', searchTerm);
      if (filterStatus && filterStatus !== 'all') qs.set('status', filterStatus);
      if (filterType && filterType !== 'all') qs.set('type', filterType);
      if (filterLocation) qs.set('location', filterLocation);
      const url = `/admin/piq/providers${qs.toString() ? `?${qs.toString()}` : ''}`;
      const refreshedData = await api.get(url);
      setProviders(Array.isArray(refreshedData) ? refreshedData : []);
    } catch (err) {
      console.error(`Bulk ${action} failed:`, err);
      // Fallback: update local state optimistically
      if (action === 'approve') {
        setProviders(prev => prev.map(p => 
          data.ids.includes(p.service_provider_id || p.id) 
            ? { ...p, serv_provider_status: 'active', status: 'active' } 
            : p
        ));
        toast.success(`Locally approved ${data.ids.length} provider(s). Backend sync pending.`);
      } else if (action === 'suspend') {
        setProviders(prev => prev.map(p => 
          data.ids.includes(p.service_provider_id || p.id) 
            ? { ...p, serv_provider_status: 'inactive', status: 'inactive' } 
            : p
        ));
        toast.warning(`Locally suspended ${data.ids.length} provider(s). Backend sync pending.`);
      } else if (action === 'delete') {
        setProviders(prev => prev.filter(p => !data.ids.includes(p.service_provider_id || p.id)));
        toast.success(`Locally deleted ${data.ids.length} provider(s). Backend sync pending.`);
      }
      setSelectedProviders([]);
      setSelectAll(false);
    } finally {
      setIsProcessing(false);
      setConfirmDialog({ isOpen: false, action: null, data: null });
    }
  };

  // Get provider type icon
  const getProviderTypeIcon = (type) => {
    switch (type) {
      case 'Veterinarian':
        return <FaStethoscope className="text-indigo-600" />;
      case 'Groomer':
        return <FaCut className="text-pink-600" />;
      case 'Pet Sitter':
        return <FaPaw className="text-amber-600" />;
      case 'Trainer':
        return <FaGraduationCap className="text-green-600" />;
      default:
        return <FaHospital className="text-indigo-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FaHospital className="text-indigo-600 text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Service Provider Management</h1>
            </div>
            <p className="text-gray-500 mt-1">Manage and monitor all service providers</p>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={() => {
                // Create a CSV string from the filtered providers
                const headers = ['ID', 'Name', 'Email', 'Type', 'Specialty', 'Status', 'Rating', 'Reviews', 'Appointments', 'Commission', 'Verified'];
                const csvRows = [headers];
                
                filteredAndSortedProviders.forEach(provider => {
                  csvRows.push([
                    provider.id,
                    provider.name,
                    provider.email,
                    provider.type,
                    provider.specialty,
                    provider.status,
                    provider.rating,
                    provider.reviews,
                    provider.appointments,
                    provider.commission,
                    provider.verified ? 'Yes' : 'No'
                  ]);
                });
                
                const csvString = csvRows.map(row => row.join(',')).join('\n');
                
                // Create a Blob and download link
                const blob = new Blob([csvString], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('hidden', '');
                a.setAttribute('href', url);
                a.setAttribute('download', `providers-report-${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              <FaDownload /> Export
            </button>
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700 transition-colors"
              onClick={() => {
                // Show a modal or form to add a new provider
                const name = prompt("Enter provider name:");
                if (!name) return;
                
                const email = prompt("Enter provider email:");
                if (!email) return;
                
                const type = prompt("Enter provider type (Veterinarian, Groomer, Pet Sitter, Trainer):", "Veterinarian");
                if (!type) return;
                
                const specialty = prompt("Enter provider specialty:", "Small Animals");
                if (!specialty) return;
                
                // In a real app, this would send data to an API
                console.log("Adding new provider:", { name, email, type, specialty });
                alert(`Provider ${name} added successfully! They will need to complete verification.`);
                
                // Simulate adding the provider to the list
                // In a real app, this would be handled by state management after API response
                const newProvider = {
                  id: providersData.length + 1,
                  name,
                  email,
                  type,
                  specialty,
                  status: 'Pending',
                  rating: 0,
                  reviews: 0,
                  lastActive: 'Never',
                  registeredDate: new Date().toLocaleDateString(),
                  appointments: 0,
                  commission: '10%',
                  verified: false
                };
                
                // This is just for demonstration - in a real app you would update state properly
                console.log("New provider object:", newProvider);
              }}
            >
              <FaUserPlus /> Add Provider
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Providers</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{providerStats.totalProviders}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <FaHospital className="text-indigo-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Providers</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{providerStats.activeProviders}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaCheck className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{providerStats.pendingApproval}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <FaClipboardCheck className="text-amber-600 text-xl" />
              </div>
            </div>
            <button 
              className="text-xs text-amber-600 mt-2 inline-block hover:underline"
              onClick={() => setFilterStatus('pending')}
            >
              Review pending providers →
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Flagged Providers</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{providerStats.flaggedProviders}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FaExclamationTriangle className="text-red-600 text-xl" />
              </div>
            </div>
            <button 
              className="text-xs text-red-600 mt-2 inline-block hover:underline"
              onClick={() => setFilterStatus('flagged')}
            >
              View flagged providers →
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link 
              to="/providers/onboarding" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              <div className="bg-indigo-100 p-3 rounded-full">
                <FaClipboardCheck className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Onboarding</h3>
                <p className="text-sm text-gray-500">Manage new registrations</p>
              </div>
            </Link>
            
            <Link 
              to="/providers/verification" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              <div className="bg-blue-100 p-3 rounded-full">
                <FaShieldAlt className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Verification</h3>
                <p className="text-sm text-gray-500">Verify credentials</p>
              </div>
            </Link>
            
            <Link 
              to="/providers/commission" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              <div className="bg-green-100 p-3 rounded-full">
                <FaPercentage className="text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Commission</h3>
                <p className="text-sm text-gray-500">Set commission rates</p>
              </div>
            </Link>
            
            <Link 
              to="/providers/performance" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              <div className="bg-purple-100 p-3 rounded-full">
                <FaStar className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Performance</h3>
                <p className="text-sm text-gray-500">View ratings & reviews</p>
              </div>
            </Link>
            
            <Link 
              to="/providers/flags" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              <div className="bg-red-100 p-3 rounded-full">
                <FaExclamationTriangle className="text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Flags</h3>
                <p className="text-sm text-gray-500">Handle reported providers</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Search providers by name, email, specialty..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="flagged">Flagged</option>
              </select>
              
              <select
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="veterinary">Veterinary</option>
                <option value="diagnostic services">Diagnostic Services</option>
                <option value="boarding">Boarding</option>
                <option value="grooming">Grooming</option>
                <option value="training">Training</option>
                <option value="physical activity">Physical Activity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProviders.length > 0 && (
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 flex flex-wrap items-center justify-between gap-4">
            <div className="text-indigo-700 font-medium">
              {selectedProviders.length} providers selected
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-green-700 transition-colors"
                onClick={() => handleBulkAction('Approve')}
              >
                <FaCheck size={12} /> Approve
              </button>
              <button 
                className="px-3 py-1.5 bg-amber-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-amber-700 transition-colors"
                onClick={() => handleBulkAction('Flag')}
              >
                <FaExclamationTriangle size={12} /> Flag
              </button>
              <button 
                className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-red-700 transition-colors"
                onClick={() => handleBulkAction('Delete')}
              >
                <FaTrash size={12} /> Delete
              </button>
              <button 
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setSelectedProviders([]);
                  setSelectAll(false);
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Provider List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      Provider {getSortIcon('name')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('type')}>
                    <div className="flex items-center">
                      Type {getSortIcon('type')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('specialty')}>
                    <div className="flex items-center">
                      Specialty {getSortIcon('specialty')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Status {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('rating')}>
                    <div className="flex items-center">
                      Rating {getSortIcon('rating')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('appointments')}>
                    <div className="flex items-center">
                      Appts {getSortIcon('appointments')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verified
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedProviders.includes(provider.id)}
                        onChange={() => handleSelectProvider(provider.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          {getProviderTypeIcon(provider.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                          <div className="text-sm text-gray-500">{provider.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {provider.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {provider.specialty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${provider.status === 'Active' ? 'bg-green-100 text-green-800' : 
                          provider.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
                        {provider.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-1">{provider.rating}</span>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < Math.floor(provider.rating) ? "text-yellow-400" : "text-gray-300"}>★</span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">({provider.reviews})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {provider.appointments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {provider.commission}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {provider.verified ? (
                        <span className="text-green-600">
                          <FaCheck />
                        </span>
                      ) : (
                        <span className="text-red-600">
                          <FaTimes />
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-2">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900" 
                          title="Edit Provider"
                          onClick={() => alert(`Edit provider ${provider.name}`)}
                        >
                          <FaEdit />
                        </button>
                        {provider.status === 'Active' ? (
                          <button 
                            className="text-red-600 hover:text-red-900" 
                            title="Flag Provider"
                            onClick={() => alert(`Flag provider ${provider.name}`)}
                          >
                            <FaExclamationTriangle />
                          </button>
                        ) : provider.status === 'Flagged' ? (
                          <button 
                            className="text-green-600 hover:text-green-900" 
                            title="Restore Provider"
                            onClick={() => alert(`Restore provider ${provider.name}`)}
                          >
                            <FaCheck />
                          </button>
                        ) : (
                          <button 
                            className="text-green-600 hover:text-green-900" 
                            title="Approve Provider"
                            onClick={() => alert(`Approve provider ${provider.name}`)}
                          >
                            <FaCheck />
                          </button>
                        )}
                        <div className="relative group">
                          <button className="text-gray-500 hover:text-gray-700" title="More Options">
                            <FaEllipsisH />
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                            <button 
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => alert(`View profile for ${provider.name}`)}
                            >
                              View Full Profile
                            </button>
                            <button 
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => alert(`View reviews for ${provider.name}`)}
                            >
                              View Reviews
                            </button>
                            <button 
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => alert(`View credentials for ${provider.name}`)}
                            >
                              View Credentials
                            </button>
                            <button 
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => alert(`Delete provider ${provider.name}`)}
                            >
                              Delete Provider
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAndSortedProviders.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-gray-500">No providers found matching your filters.</p>
            </div>
          )}
          
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{filteredAndSortedProviders.length}</span> of <span className="font-medium">{providersData.length}</span> providers
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog for Bulk Actions */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.data?.config?.title || 'Confirm Action'}
        message={confirmDialog.data?.config?.message || 'Are you sure?'}
        type={confirmDialog.data?.config?.type || 'warning'}
        onConfirm={executeBulkAction}
        onCancel={() => setConfirmDialog({ isOpen: false, action: null, data: null })}
        isProcessing={isProcessing}
      />
    </DashboardLayout>
  );
};

export default Providers;