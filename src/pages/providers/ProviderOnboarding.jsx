import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { 
  FaHospital, 
  FaClipboardCheck, 
  FaArrowLeft, 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaDownload, 
  FaFileAlt, 
  FaIdCard, 
  FaGraduationCap, 
  FaStethoscope, 
  FaCut, 
  FaDog, 
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';

const ProviderOnboarding = ({ filterType = 'all' }) => {
  const api = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTypeState, setFilterTypeState] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  
  // Fetch providers
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      try {
        // Build query params
        const qs = new URLSearchParams();
        if (filterType && filterType !== 'all') {
          // Send the display name directly - backend will handle case-insensitive matching
          qs.set('type', filterType);
        }
        
        const url = `/admin/piq/providers${qs.toString() ? `?${qs.toString()}` : ''}`;
        const response = await api.get(url);
        
        if (!alive) return;
        // Backend returns { results: [...], page, limit, totalPages, totalResults }
        const providersData = response?.results || response || [];
        setProviders(Array.isArray(providersData) ? providersData : []);
        
        // Calculate stats from loaded data
        const total = providersData.length;
        const pending = providersData.filter(p => (p.status || p.serv_provider_status) === 'inactive').length;
        const approved = providersData.filter(p => (p.status || p.serv_provider_status) === 'active').length;
        const rejected = providersData.filter(p => (p.status || p.serv_provider_status) === 'rejected').length;
        setStats({ total, pending, approved, rejected });
      } catch (e) {
        console.error('Error loading providers:', e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [filterType]); // Removed 'api' from dependencies to prevent infinite loop
  
  // Map providers to application format (ONLY REAL DATA - NO STATIC DATA)
  const applicationsData = providers.map(p => {
    const rawStatus = (p.status || p.serv_provider_status || '').toLowerCase();
    const status = rawStatus === 'active' ? 'Approved'
      : rawStatus === 'inactive' ? 'Pending Review'
      : rawStatus === 'rejected' ? 'Rejected'
      : 'In Progress';

    const rawType = (p.type || p.serv_provider_type || '');
    const lowerType = rawType.toLowerCase();
    const typeMap = {
      veterinary: 'Veterinarian',
      veterinarian: 'Veterinarian',
      grooming: 'Groomer',
      groomer: 'Groomer',
      training: 'Trainer',
      trainer: 'Trainer',
      boarding: 'Boarding',
      'diagnostic services': 'Diagnostic Services',
      diagnostics: 'Diagnostic Services',
      'physical activity': 'Physical Activity',
      'pet sitter': 'Physical Activity',
      'pet sitting': 'Physical Activity',
    };
    const displayType = typeMap[lowerType] || rawType || 'Provider';

    return {
      id: p.id || p.service_provider_id,
      name: p.name || p.serv_provider_name || 'Unknown',
      email: p.email || p.serv_provider_email || '',
      phone: p.phone || p.serv_provider_phone_number || p.serv_provider_contact_nbr || '',
      type: displayType,
      specialty: p.specialty || p.provider_src || 'General',
      status,
      date: p.date || (p.created_at ? new Date(p.created_at).toLocaleDateString() : ''),
      documents: p.documents || (p.serv_provider_certificates ? String(p.serv_provider_certificates).split(',').map(s => s.trim()).filter(Boolean) : []),
      experience: p.experience || (p.serv_provider_experience || (p.serv_provider_exp_years ? `${p.serv_provider_exp_years} years` : 'Not specified')),
      address: p.location || p.address || p.serv_provider_location || '',
      notes: p.notes || p.serv_provider_desc || '',
      rawStatus,
      rawType,
    };
  });

  // Filter and sort applications
  const filteredAndSortedApplications = applicationsData
    .filter(app => {
      const matchesSearch = 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.specialty.toLowerCase().includes(searchTerm.toLowerCase());
      const effectiveFilterType = filterType !== 'all' ? filterType : filterTypeState;
      const matchesType = (effectiveFilterType && effectiveFilterType !== 'all') ? app.type === effectiveFilterType : (effectiveFilterType === 'all' || !effectiveFilterType);
      const matchesStatus = filterStatus === 'all' || app.status.toLowerCase().includes(filterStatus.toLowerCase());
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortField === 'experience') {
        const expA = parseInt(a.experience.split(' ')[0]);
        const expB = parseInt(b.experience.split(' ')[0]);
        comparison = expA - expB;
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

  // Handle view application
  const handleViewApplication = (application) => {
    setSelectedApplication(application);
  };

  // Get provider type icon
  const getProviderTypeIcon = (type) => {
    switch (type) {
      case 'Veterinarian':
        return <FaStethoscope className="text-indigo-600" />;
      case 'Groomer':
        return <FaCut className="text-pink-600" />;
      case 'Pet Sitter':
        return <FaDog className="text-amber-600" />;
      case 'Trainer':
        return <FaGraduationCap className="text-green-600" />;
      default:
        return <FaHospital className="text-indigo-600" />;
    }
  };

  // Handle application action (Approve/Reject)
  const handleApplicationAction = async (action, applicationId) => {
    if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} this provider?`)) {
      return;
    }

    try {
      const status = action === 'Approve' ? 'active' : 'rejected';
      
      // Update provider status via API
      await api.patch(`/admin/piq/providers/${applicationId}/status`, { 
        status: status 
      });
      
      // Refresh providers list
      const qs = new URLSearchParams();
      if (filterType && filterType !== 'all') {
        const typeMap = {
          'Veterinarian': 'veterinary',
          'Groomer': 'grooming',
          'Trainer': 'training',
          'Boarding': 'boarding',
          'Diagnostic Services': 'diagnostic services',
          'Physical Activity': 'physical activity'
        };
        qs.set('type', typeMap[filterType] || filterType.toLowerCase());
      }
      
      const url = `/admin/piq/providers${qs.toString() ? `?${qs.toString()}` : ''}`;
      const response = await api.get(url);
      const providersData = response?.results || response || [];
      
      setProviders(Array.isArray(providersData) ? providersData : []);
      
      // Recalculate stats
      const total = providersData.length;
      const pending = providersData.filter(p => (p.status || p.serv_provider_status) === 'inactive').length;
      const approved = providersData.filter(p => (p.status || p.serv_provider_status) === 'active').length;
      const rejected = providersData.filter(p => (p.status || p.serv_provider_status) === 'rejected').length;
      setStats({ total, pending, approved, rejected });
      
      // Close detail view if it was the updated provider
      if (selectedApplication && selectedApplication.id === applicationId) {
        setSelectedApplication(null);
      }
      
      alert(`Provider ${action === 'Approve' ? 'approved' : 'rejected'} successfully! ${action === 'Approve' ? 'They can now be seen by users.' : ''}`);
    } catch (error) {
      console.error('Error updating provider status:', error);
      alert('Failed to update provider status. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/providers" className="text-gray-500 hover:text-indigo-600">
              <FaArrowLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Provider Onboarding</h1>
              <p className="text-gray-500">Manage and approve new service provider applications</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={() => alert('Export functionality would be implemented here')}
            >
              <FaDownload /> Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{stats.total}</p>
              </div>
              <div className="bg-indigo-100 p-2 rounded-full">
                <FaClipboardCheck className="text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {stats.pending}
                </p>
              </div>
              <div className="bg-amber-100 p-2 rounded-full">
                <FaClipboardCheck className="text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-xl font-bold text-green-600 mt-1">
                  {stats.approved}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <FaCheck className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-xl font-bold text-red-600 mt-1">
                  {stats.rejected}
                </p>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <FaTimes className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-2">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
                {/* Search */}
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search applications..."
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
                    value={filterTypeState}
                    onChange={(e) => setFilterTypeState(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="veterinarian">Veterinarians</option>
                    <option value="groomer">Groomers</option>
                    <option value="pet sitter">Pet Sitters</option>
                    <option value="trainer">Trainers</option>
                  </select>
                  
                  <select
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Review</option>
                    <option value="in progress">In Progress</option>
                    <option value="incomplete">Incomplete</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">Provider Applications</h2>
                <div className="text-sm text-gray-500">
                  Showing {filteredAndSortedApplications.length} of {applicationsData.length}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                        <div className="flex items-center">
                          Date {getSortIcon('date')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                        <div className="flex items-center">
                          Status {getSortIcon('status')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedApplications.map((application) => (
                      <tr 
                        key={application.id} 
                        className={`hover:bg-gray-50 ${selectedApplication?.id === application.id ? 'bg-indigo-50' : ''}`}
                        onClick={() => handleViewApplication(application)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              {getProviderTypeIcon(application.type)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{application.name}</div>
                              <div className="text-sm text-gray-500">{application.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div>{application.type}</div>
                            <div className="text-xs text-gray-400">{application.specialty}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(application.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${application.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                              application.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-800' :
                              application.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              application.status === 'Incomplete' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'}`}>
                            {application.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center space-x-2">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900" 
                              title="View Application"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewApplication(application);
                              }}
                            >
                              <FaEye />
                            </button>
                            {application.status !== 'Approved' && application.status !== 'Rejected' && (
                              <button 
                                className="text-green-600 hover:text-green-900" 
                                title="Approve Application"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplicationAction('Approve', application.id);
                                }}
                              >
                                <FaCheck />
                              </button>
                            )}
                            {application.status !== 'Rejected' && (
                              <button 
                                className="text-red-600 hover:text-red-900" 
                                title="Reject Application"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplicationAction('Reject', application.id);
                                }}
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredAndSortedApplications.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No applications found matching your filters.</p>
                </div>
              )}
            </div>
          </div>

          {/* Application Details */}
          <div className="lg:col-span-1">
            {selectedApplication ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <h2 className="font-semibold text-gray-800">Application Details</h2>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setSelectedApplication(null)}
                  >
                    &times;
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                      {getProviderTypeIcon(selectedApplication.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{selectedApplication.name}</h3>
                      <p className="text-gray-500">{selectedApplication.type} - {selectedApplication.specialty}</p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mt-1
                        ${selectedApplication.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                          selectedApplication.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-800' :
                          selectedApplication.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          selectedApplication.status === 'Incomplete' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'}`}>
                        {selectedApplication.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Contact Information</h4>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-800">{selectedApplication.email}</p>
                        <p className="text-sm text-gray-800">{selectedApplication.phone}</p>
                        <p className="text-sm text-gray-800">{selectedApplication.address}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Experience</h4>
                      <p className="text-sm text-gray-800 mt-1">{selectedApplication.experience}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Application Date</h4>
                      <p className="text-sm text-gray-800 mt-1">{new Date(selectedApplication.date).toLocaleDateString()}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Documents Submitted</h4>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {selectedApplication.documents.map((doc, index) => (
                          <div key={index} className="flex items-center p-2 border border-gray-200 rounded-md">
                            <FaFileAlt className="text-indigo-500 mr-2" />
                            <span className="text-sm text-gray-800">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                      <p className="text-sm text-gray-800 mt-1">{selectedApplication.notes}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    {selectedApplication.status !== 'Approved' && selectedApplication.status !== 'Rejected' && (
                      <button 
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        onClick={() => handleApplicationAction('Approve', selectedApplication.id)}
                      >
                        <FaCheck /> Approve Application
                      </button>
                    )}
                    
                    {selectedApplication.status !== 'Rejected' && (
                      <button 
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        onClick={() => handleApplicationAction('Reject', selectedApplication.id)}
                      >
                        <FaTimes /> Reject Application
                      </button>
                    )}
                    
                    <button 
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      onClick={() => alert(`Request more information from ${selectedApplication.name}`)}
                    >
                      <FaClipboardCheck /> Request More Info
                    </button>
                    
                    <button 
                      className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      onClick={() => alert(`View all documents for ${selectedApplication.name}`)}
                    >
                      <FaEye /> View All Documents
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaClipboardCheck className="text-indigo-600 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Application Details</h3>
                <p className="text-gray-500 mb-4">Select an application to view its details</p>
                <div className="flex justify-center">
                  <button 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    onClick={() => handleViewApplication(filteredAndSortedApplications[0])}
                    disabled={filteredAndSortedApplications.length === 0}
                  >
                    View First Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProviderOnboarding;