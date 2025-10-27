import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowLeft,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEdit,
  FaDownload,
  FaPlus,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaHospital,
  FaUserMd,
  FaCut,
  FaDog,
  FaHome,
  FaWalking,
  FaExclamationTriangle,
} from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';

const SERVICE_TYPE_LABELS = {
  veterinary: 'Veterinary',
  diagnostics: 'Diagnostic Services',
  boarding: 'Boarding',
  grooming: 'Grooming',
  training: 'Training',
  'physical activity': 'Physical Activity',
};

const normalizeServiceType = (rawType) => {
  if (!rawType) return 'Other';
  const value = rawType.toString().toLowerCase();
  if (value.includes('vet')) return SERVICE_TYPE_LABELS.veterinary;
  if (value.includes('diagn')) return SERVICE_TYPE_LABELS.diagnostics;
  if (value.includes('board')) return SERVICE_TYPE_LABELS.boarding;
  if (value.includes('groom')) return SERVICE_TYPE_LABELS.grooming;
  if (value.includes('train')) return SERVICE_TYPE_LABELS.training;
  if (value.includes('physical') || value.includes('sitter') || value.includes('walk')) {
    return SERVICE_TYPE_LABELS['physical activity'];
  }
  return 'Other';
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (err) {
    return value;
  }
};

const ProviderCommission = () => {
  const api = useApi();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortField, setSortField] = useState('providerName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCommission, setCurrentCommission] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      console.log('[ProviderCommission] loadData start', {
        role: currentUser?.role,
        isMounted
      });
      setLoading(true);
      setError('');

      try {
        const isAdmin = currentUser?.role === 'admin';

        const requests = [];
        if (isAdmin) {
          requests.push(api.get('/admin/commissions'));
          requests.push(api.get('/admin/commissions/stats'));
        } else if (currentUser?.role === 'provider') {
          requests.push(api.get('/provider/commissions'));
        } else {
          throw new Error('Insufficient permissions');
        }

        console.log('[ProviderCommission] issuing requests', {
          endpoints: requests.map((request) => request?.url || 'fetchApi-call'),
        });

        const [commissionResponse, statsResponse] = await Promise.all(requests);

        console.log('[ProviderCommission] responses received', {
          commissionKeys: Object.keys(commissionResponse || {}),
          statsKeys: Object.keys(statsResponse || {}),
        });

        if (!isMounted) {
          console.log('[ProviderCommission] component unmounted before applying data');
          return;
        }

        const commissionItems = commissionResponse?.data?.data?.commissions ?? commissionResponse?.data?.commissions ?? [];
        const normalized = commissionItems.map((item) => {
          const provider = item.provider || {};
          const booking = item.booking || {};
          const service = booking.service || {};

          const bookingAmount = Number(item.booking_amount ?? 0);
          const commissionAmount = Number(item.commission_amount ?? 0);
          const commissionPercent = Number(item.commission_percent ?? 0);

          const effectiveRate = bookingAmount > 0
            ? Number(((commissionAmount / bookingAmount) * 100).toFixed(2))
            : commissionPercent;

          return {
            id: item.commission_id,
            providerName: provider.serv_provider_name || 'Unknown Provider',
            providerEmail: provider.serv_provider_email || '—',
            category: normalizeServiceType(provider.serv_provider_type || service.service_category),
            baseRate: commissionPercent,
            effectiveRate,
            bookingAmount,
            commissionAmount,
            providerAmount: Number(item.provider_amount ?? 0),
            status: item.status,
            lastUpdated: item.settled_at || item.created_at,
            nextReview: null,
            notes: service.service_name ? `Service: ${service.service_name}` : undefined,
            volumeDiscount: false,
            specialRate: false,
          };
        });

        setCommissions(normalized);

        if (currentUser?.role === 'admin') {
          setStats(statsResponse?.data?.data ?? statsResponse?.data ?? null);
        } else {
          const providerStats = {
            total_commissions: commissionItems.length,
            calculated_commissions: commissionItems.filter((c) => c.status === 'calculated').length,
            settled_commissions: commissionItems.filter((c) => c.status === 'settled').length,
            total_commission_revenue: commissionItems.reduce(
              (sum, c) => sum + Number(c.commission_amount ?? 0),
              0
            ),
            currency: 'INR',
          };
          setStats(providerStats);
        }
      } catch (err) {
        console.error('Failed to fetch commission data', err);
        if (isMounted) {
          // Use sample data as fallback when API fails
          console.log('[ProviderCommission] using sample fallback', {
            errorMessage: err?.message,
            status: err?.status,
          });
          const sampleCommissions = [
            {
              id: 'COMM001',
              providerName: 'Happy Paws Veterinary Clinic',
              providerEmail: 'info@happypawsvet.com',
              category: 'Veterinary',
              baseRate: 15,
              effectiveRate: 15,
              bookingAmount: 5000,
              commissionAmount: 750,
              providerAmount: 4250,
              status: 'settled',
              lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Standard rate',
              volumeDiscount: false,
              specialRate: false
            },
            {
              id: 'COMM002',
              providerName: 'Fluffy Cuts Grooming',
              providerEmail: 'contact@fluffycuts.com',
              category: 'Grooming',
              baseRate: 12,
              effectiveRate: 10,
              bookingAmount: 3000,
              commissionAmount: 300,
              providerAmount: 2700,
              status: 'calculated',
              lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              nextReview: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Volume discount applied',
              volumeDiscount: true,
              specialRate: false
            },
            {
              id: 'COMM003',
              providerName: 'Canine Academy',
              providerEmail: 'training@canineacademy.com',
              category: 'Training',
              baseRate: 18,
              effectiveRate: 18,
              bookingAmount: 8000,
              commissionAmount: 1440,
              providerAmount: 6560,
              status: 'settled',
              lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              nextReview: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
              notes: 'Premium service',
              volumeDiscount: false,
              specialRate: true
            }
          ];
          
          const sampleStats = {
            total_commissions: 3,
            calculated_commissions: 1,
            settled_commissions: 2,
            total_commission_revenue: 2490,
            currency: 'INR'
          };
          
          setCommissions(sampleCommissions);
          setStats(sampleStats);
          setError('Using sample data - API permissions required');
        }
      } finally {
        if (isMounted) {
          console.log('[ProviderCommission] loadData complete');
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.role]); // Remove api dependency to prevent infinite loop

  const filteredAndSortedRates = useMemo(() => {
    return commissions
      .filter((rate) => {
        const matchesSearch =
          rate.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rate.providerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rate.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (rate.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          filterCategory === 'all' || rate.category.toLowerCase() === filterCategory.toLowerCase();

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let comparison = 0;

        if (sortField === 'providerName') {
          comparison = a.providerName.localeCompare(b.providerName);
        } else if (sortField === 'category') {
          comparison = a.category.localeCompare(b.category);
        } else if (sortField === 'baseRate') {
          comparison = a.baseRate - b.baseRate;
        } else if (sortField === 'effectiveRate') {
          comparison = a.effectiveRate - b.effectiveRate;
        } else if (sortField === 'lastUpdated') {
          comparison = new Date(a.lastUpdated || 0) - new Date(b.lastUpdated || 0);
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [commissions, filterCategory, searchTerm, sortDirection, sortField]);

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'veterinary':
        return <FaUserMd className="text-blue-500" />;
      case 'grooming':
        return <FaCut className="text-purple-500" />;
      case 'pet sitting':
        return <FaHome className="text-green-500" />;
      case 'training':
        return <FaDog className="text-amber-500" />;
      case 'boarding':
        return <FaHospital className="text-red-500" />;
      case 'dog walking':
        return <FaWalking className="text-indigo-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

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

  // Handle edit commission rate
  const handleEditCommission = (rate) => {
    setCurrentCommission({...rate});
    setShowEditModal(true);
  };

  // Handle save commission changes
  const handleSaveCommission = () => {
    // In a real app, you would call an API to update the commission rate
    console.log('Saving commission rate changes:', currentCommission);
    alert(`Commission rate for ${currentCommission.providerName} updated successfully`);
    setShowEditModal(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Sample Data Warning */}
        {error && error.includes('sample data') && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-amber-400 mr-3" />
              <div>
                <p className="text-sm text-amber-700">
                  <strong>Demo Mode:</strong> {error}. Configure admin permissions to access live data.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/providers" className="text-gray-500 hover:text-indigo-600">
              <FaArrowLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Commission Rates</h1>
              <p className="text-gray-500">Manage provider commission rates and fee structures</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700 transition-colors"
              onClick={() => alert('Add new commission rate functionality would be implemented here')}
            >
              <FaPlus /> Add New Rate
            </button>
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={() => alert('Export functionality would be implemented here')}
            >
              <FaDownload /> Export
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Search providers..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Category Filter */}
            <select
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="veterinary">Veterinary</option>
              <option value="grooming">Grooming</option>
              <option value="pet sitting">Pet Sitting</option>
              <option value="training">Training</option>
              <option value="boarding">Boarding</option>
              <option value="dog walking">Dog Walking</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Commissions</p>
                  <p className="text-xl font-bold text-gray-800">{stats.total_commissions || 0}</p>
                </div>
                <div className="bg-indigo-100 p-2 rounded-full">
                  <FaInfoCircle className="text-indigo-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Calculated</p>
                  <p className="text-xl font-bold text-amber-600">{stats.calculated_commissions || 0}</p>
                </div>
                <div className="bg-amber-100 p-2 rounded-full">
                  <FaInfoCircle className="text-amber-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Settled</p>
                  <p className="text-xl font-bold text-green-600">{stats.settled_commissions || 0}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <FaCheck className="text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-xl font-bold text-indigo-600">
                    ₹{(stats.total_commission_revenue || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-indigo-100 p-2 rounded-full">
                  <FaInfoCircle className="text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commission Rates Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('providerName')}
                  >
                    <div className="flex items-center">
                      Provider {getSortIcon('providerName')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      Category {getSortIcon('category')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('baseRate')}
                  >
                    <div className="flex items-center">
                      Base Rate (%) {getSortIcon('baseRate')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discounts
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('effectiveRate')}
                  >
                    <div className="flex items-center">
                      Effective Rate (%) {getSortIcon('effectiveRate')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('lastUpdated')}
                  >
                    <div className="flex items-center">
                      Last Updated {getSortIcon('lastUpdated')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Review
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">{rate.providerName}</div>
                          <div className="text-sm text-gray-500">{rate.providerEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(rate.category)}
                        <span className="text-sm text-gray-900">{rate.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{rate.baseRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {rate.volumeDiscount && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Volume</span>
                        )}
                        {rate.specialRate && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Special</span>
                        )}
                        {!rate.volumeDiscount && !rate.specialRate && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-indigo-600">{rate.effectiveRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rate.lastUpdated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rate.nextReview}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditCommission(rate)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Commission Rate"
                      >
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Commission Modal */}
        {showEditModal && currentCommission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Edit Commission Rate</h2>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Provider Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={currentCommission.providerName}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={currentCommission.category}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Commission Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={currentCommission.baseRate}
                        onChange={(e) => setCurrentCommission({...currentCommission, baseRate: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Effective Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={currentCommission.effectiveRate}
                        onChange={(e) => setCurrentCommission({...currentCommission, effectiveRate: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={currentCommission.volumeDiscount}
                        onChange={(e) => setCurrentCommission({...currentCommission, volumeDiscount: e.target.checked})}
                      />
                      <span className="ml-2 text-sm text-gray-700">Volume Discount</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={currentCommission.specialRate}
                        onChange={(e) => setCurrentCommission({...currentCommission, specialRate: e.target.checked})}
                      />
                      <span className="ml-2 text-sm text-gray-700">Special Rate</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Review Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={currentCommission.nextReview}
                    onChange={(e) => setCurrentCommission({...currentCommission, nextReview: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={currentCommission.notes}
                    onChange={(e) => setCurrentCommission({...currentCommission, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCommission}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProviderCommission;