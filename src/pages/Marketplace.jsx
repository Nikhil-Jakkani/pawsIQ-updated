import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import useApi from '../hooks/useApi';
import { useToast } from '../components/common/Toast';
import { 
  FaShoppingCart, 
  FaSearch, 
  FaFilter, 
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaDownload,
  FaCheck,
  FaTimes,
  FaClock,
  FaExclamationTriangle,
  FaBoxes,
  FaTags,
  FaPercent,
  FaUserCheck,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaImage,
  FaCogs,
  FaStore,
  FaUsers,
  FaChartLine,
  FaWarehouse,
  FaCreditCard,
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
  FaUndo,
  FaMinus,
  FaExchangeAlt,
  FaSpinner,
  FaTruck,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';

const Marketplace = () => {
  const api = useApi();
  const toast = useToast();

  // State for Products
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // State for Orders
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState('all');
  const [orderFilterType, setOrderFilterType] = useState('all');
  const [orderSortField, setOrderSortField] = useState('date');
  const [orderSortDirection, setOrderSortDirection] = useState('desc');
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [transactionsData, setTransactionsData] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // State for Stats
  const [marketplaceStats, setMarketplaceStats] = useState({
    totalProducts: 0,
    activeListings: 0,
    outOfStock: 0,
    pendingApproval: 0,
    totalSellers: 0,
    pendingSellerApprovals: 0
  });

  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayouts: 0,
    refundsIssued: 0,
    failedTransactions: 0,
    outstandingBalance: 0
  });

  // Modals and Tab Control
  const [showProductModal, setShowProductModal] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'tracking'
  
  // State for Order Tracking
  const [trackingData, setTrackingData] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(true);
  const [trackingSearch, setTrackingSearch] = useState('');

  // Fetch Products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch Transactions/Orders
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Fetch Marketplace Stats
  useEffect(() => {
    fetchMarketplaceStats();
  }, []);

  // Fetch Financial Stats
  useEffect(() => {
    fetchFinancialStats();
  }, []);

  // Fetch Tracking Data
  useEffect(() => {
    if (activeTab === 'tracking') {
      fetchTrackingData();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await api.get('/marketplace/products');
      const products = Array.isArray(data) ? data : data?.results || [];
      setProductsData(products);
    } catch (err) {
      console.error('Failed to load products:', err);
      toast.error('Failed to load products');
      setProductsData([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const data = await api.get('/marketplace/orders');
      const transactions = Array.isArray(data) ? data : data?.results || [];
      setTransactionsData(transactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      toast.error('Failed to load transactions');
      setTransactionsData([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchMarketplaceStats = async () => {
    try {
      const data = await api.get('/marketplace/stats');
      if (data) {
        setMarketplaceStats(data);
      }
    } catch (err) {
      console.error('Failed to load marketplace stats:', err);
    }
  };

  const fetchFinancialStats = async () => {
    try {
      const data = await api.get('/marketplace/financial-stats');
      if (data) {
        setFinancialStats(data);
      }
    } catch (err) {
      console.error('Failed to load financial stats:', err);
    }
  };

  const fetchTrackingData = async () => {
    setTrackingLoading(true);
    try {
      const data = await api.get('/marketplace/orders/tracking');
      const tracking = Array.isArray(data) ? data : data?.results || [];
      setTrackingData(tracking);
    } catch (err) {
      console.error('Failed to load tracking data:', err);
      toast.error('Failed to load tracking data');
      setTrackingData([]);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Filter and sort products
  const filteredAndSortedProducts = productsData
    .filter(product => {
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.seller?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || product.category?.toLowerCase() === filterCategory.toLowerCase();
      const matchesStatus = filterStatus === 'all' || product.status?.toLowerCase().replace(' ', '') === filterStatus.toLowerCase().replace(' ', '');
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortField === 'price') {
        comparison = (a.price || 0) - (b.price || 0);
      } else if (sortField === 'stock') {
        comparison = (a.stock || 0) - (b.stock || 0);
      } else if (sortField === 'sold') {
        comparison = (a.sold || 0) - (b.sold || 0);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Filter and sort transactions
  const filteredAndSortedTransactions = transactionsData
    .filter(transaction => {
      const matchesSearch = 
        transaction.customer?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        transaction.provider?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        transaction.id?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        transaction.service?.toLowerCase().includes(orderSearchTerm.toLowerCase());
      
      const matchesStatus = orderFilterStatus === 'all' || transaction.status?.toLowerCase() === orderFilterStatus.toLowerCase();
      const matchesType = orderFilterType === 'all' || transaction.type?.toLowerCase() === orderFilterType.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (orderSortField === 'date') {
        comparison = new Date(a.date || 0) - new Date(b.date || 0);
      } else if (orderSortField === 'customer') {
        comparison = (a.customer || '').localeCompare(b.customer || '');
      } else if (orderSortField === 'amount') {
        comparison = (a.amount || 0) - (b.amount || 0);
      } else if (orderSortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      
      return orderSortDirection === 'asc' ? comparison : -comparison;
    });

  // Filter tracking data
  const filteredTrackingData = trackingData.filter(track => 
    track.orderId?.toLowerCase().includes(trackingSearch.toLowerCase()) ||
    track.customerName?.toLowerCase().includes(trackingSearch.toLowerCase()) ||
    track.trackingNumber?.toLowerCase().includes(trackingSearch.toLowerCase())
  );

  // Handle sort clicks
  const handleProductSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleOrderSort = (field) => {
    if (orderSortField === field) {
      setOrderSortDirection(orderSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderSortField(field);
      setOrderSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field, isOrder = false) => {
    const currentField = isOrder ? orderSortField : sortField;
    const currentDirection = isOrder ? orderSortDirection : sortDirection;
    
    if (currentField !== field) return <FaSort className="ml-1 text-gray-400" />;
    return currentDirection === 'asc' ? <FaSortUp className="ml-1 text-indigo-600" /> : <FaSortDown className="ml-1 text-indigo-600" />;
  };

  // Get status badge
  const getStatusBadge = (status, type = 'product') => {
    let statusConfig = {};
    
    if (type === 'product') {
      statusConfig = {
        'Active': { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheck },
        'Out of Stock': { bg: 'bg-red-100', text: 'text-red-800', icon: FaExclamationTriangle },
        'Pending Approval': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaClock },
        'Inactive': { bg: 'bg-gray-100', text: 'text-gray-800', icon: FaTimes }
      };
    } else {
      statusConfig = {
        'Completed': { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheck },
        'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaClock },
        'Processing': { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaClock },
        'Failed': { bg: 'bg-red-100', text: 'text-red-800', icon: FaTimes },
        'Refunded': { bg: 'bg-purple-100', text: 'text-purple-800', icon: FaUndo }
      };
    }
    
    const config = statusConfig[status] || Object.values(statusConfig)[0];
    const IconComponent = config?.icon || FaCheck;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.bg} ${config?.text}`}>
        <IconComponent className="mr-1" />
        {status || 'Unknown'}
      </span>
    );
  };

  // Get type badge for transactions
  const getTypeBadge = (type) => {
    const typeConfig = {
      'Payment': { bg: 'bg-green-100', text: 'text-green-800', icon: FaArrowDown },
      'Payout': { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaArrowUp },
      'Refund': { bg: 'bg-red-100', text: 'text-red-800', icon: FaUndo },
      'Subscription': { bg: 'bg-purple-100', text: 'text-purple-800', icon: FaCreditCard }
    };
    
    const config = typeConfig[type] || typeConfig['Payment'];
    const IconComponent = config?.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.bg} ${config?.text}`}>
        <IconComponent className="mr-1" />
        {type}
      </span>
    );
  };

  // Export CSV
  const handleExportProducts = () => {
    const headers = ['Product ID', 'Name', 'Category', 'Seller', 'Price', 'Stock', 'Sold', 'Status'];
    const csvRows = [headers];
    
    filteredAndSortedProducts.forEach(product => {
      csvRows.push([
        product.id || '',
        product.name || '',
        product.category || '',
        product.seller || '',
        product.price || '',
        product.stock || '',
        product.sold || '',
        product.status || ''
      ]);
    });
    
    const csvString = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportOrders = () => {
    const headers = ['Order ID', 'Type', 'Customer', 'Provider', 'Service', 'Amount', 'Status', 'Date'];
    const csvRows = [headers];
    
    filteredAndSortedTransactions.forEach(txn => {
      csvRows.push([
        txn.id || '',
        txn.type || '',
        txn.customer || '',
        txn.provider || '',
        txn.service || '',
        txn.amount || '',
        txn.status || '',
        txn.date || ''
      ]);
    });
    
    const csvString = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FaShoppingCart className="text-indigo-600 text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Marketplace & Orders Management</h1>
            </div>
            <p className="text-gray-500 mt-1">Manage products, inventory, and customer orders</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button 
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                activeTab === 'products'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('products')}
            >
              <FaBoxes /> Products
            </button>
            <button 
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                activeTab === 'orders'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              <FaMoneyBillWave /> Orders
            </button>
            <button 
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                activeTab === 'tracking'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('tracking')}
            >
              <FaTruck /> Track Orders
            </button>
            {activeTab === 'products' && (
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2 hover:bg-green-700 transition-colors"
                onClick={() => setShowProductModal(true)}
              >
                <FaPlus /> Add Product
              </button>
            )}
          </div>
        </div>

        {/* PRODUCTS SECTION */}
        {activeTab === 'products' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Products</p>
                    <p className="text-xl font-bold text-gray-800">{marketplaceStats.totalProducts}</p>
                  </div>
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <FaBoxes className="text-indigo-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Listings</p>
                    <p className="text-xl font-bold text-green-600">{marketplaceStats.activeListings}</p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <FaStore className="text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                    <p className="text-xl font-bold text-red-600">{marketplaceStats.outOfStock}</p>
                  </div>
                  <div className="bg-red-100 p-2 rounded-full">
                    <FaExclamationTriangle className="text-red-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                    <p className="text-xl font-bold text-yellow-600">{marketplaceStats.pendingApproval}</p>
                  </div>
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <FaClock className="text-yellow-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Sellers</p>
                    <p className="text-xl font-bold text-blue-600">{marketplaceStats.totalSellers}</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FaUsers className="text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products, sellers..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="outofstock">Out of Stock</option>
                    <option value="pendingapproval">Pending Approval</option>
                  </select>
                </div>

                <button 
                  onClick={handleExportProducts}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <FaDownload /> Export
                </button>
              </div>
            </div>

            {/* Products Table */}
            {productsLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
                <FaSpinner className="animate-spin mx-auto text-indigo-600 text-3xl mb-4" />
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
                <FaBoxes className="mx-auto text-gray-300 text-4xl mb-4" />
                <p className="text-gray-500">No products found. Add your first product to get started.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                          onClick={() => handleProductSort('price')}
                        >
                          <div className="flex items-center">
                            Price {getSortIcon('price')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">#{product.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">₹{product.price}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.stock} units</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(product.status, 'product')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded">
                                <FaEye />
                              </button>
                              <button className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded">
                                <FaEdit />
                              </button>
                              <button className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded">
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ORDERS SECTION */}
        {activeTab === 'orders' && (
          <>
            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-xl font-bold text-green-600">₹{financialStats.totalRevenue?.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <FaChartLine className="text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                    <p className="text-xl font-bold text-blue-600">₹{financialStats.monthlyRevenue?.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FaMoneyBillWave className="text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending Payouts</p>
                    <p className="text-xl font-bold text-yellow-600">₹{financialStats.pendingPayouts?.toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <FaClock className="text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Refunds Issued</p>
                    <p className="text-xl font-bold text-red-600">₹{financialStats.refundsIssued?.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-100 p-2 rounded-full">
                    <FaUndo className="text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Failed Orders</p>
                    <p className="text-xl font-bold text-red-600">{financialStats.failedTransactions}</p>
                  </div>
                  <div className="bg-red-100 p-2 rounded-full">
                    <FaExclamationTriangle className="text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Outstanding Balance</p>
                    <p className="text-xl font-bold text-orange-600">₹{financialStats.outstandingBalance?.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-100 p-2 rounded-full">
                    <FaExchangeAlt className="text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search orders, customers..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={orderSearchTerm}
                      onChange={(e) => setOrderSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={orderFilterStatus}
                    onChange={(e) => setOrderFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <button 
                  onClick={handleExportOrders}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <FaDownload /> Export
                </button>
              </div>
            </div>

            {/* Orders Table */}
            {transactionsLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
                <FaSpinner className="animate-spin mx-auto text-indigo-600 text-3xl mb-4" />
                <p className="text-gray-500">Loading orders...</p>
              </div>
            ) : filteredAndSortedTransactions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
                <FaCreditCard className="mx-auto text-gray-300 text-4xl mb-4" />
                <p className="text-gray-500">No orders found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                          onClick={() => handleOrderSort('date')}
                        >
                          <div className="flex items-center">
                            Date {getSortIcon('date', true)}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer / Provider</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                          onClick={() => handleOrderSort('amount')}
                        >
                          <div className="flex items-center">
                            Amount {getSortIcon('amount', true)}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                          onClick={() => handleOrderSort('status')}
                        >
                          <div className="flex items-center">
                            Status {getSortIcon('status', true)}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{transaction.date}</div>
                            <div className="text-xs text-gray-400">#{transaction.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getTypeBadge(transaction.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{transaction.customer}</div>
                            <div className="text-sm text-gray-500">{transaction.provider}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{transaction.service}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{Math.abs(transaction.amount || 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(transaction.status, 'transaction')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded">
                                <FaEye />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ORDER TRACKING SECTION */}
        {activeTab === 'tracking' && (
          <>
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by order ID, tracking number, or customer name..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={trackingSearch}
                      onChange={(e) => setTrackingSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            {trackingLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
                <FaSpinner className="animate-spin mx-auto text-indigo-600 text-3xl mb-4" />
                <p className="text-gray-500">Loading tracking information...</p>
              </div>
            ) : filteredTrackingData.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
                <FaTruck className="mx-auto text-gray-300 text-4xl mb-4" />
                <p className="text-gray-500">No tracking information available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTrackingData.map((tracking) => (
                  <div key={tracking.orderId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Order #{tracking.orderId}</h3>
                        <p className="text-sm text-gray-500">Tracking: {tracking.trackingNumber || 'N/A'}</p>
                        <p className="text-sm text-gray-500 mt-1">Customer: {tracking.customerName}</p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        tracking.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        tracking.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                        tracking.status === 'Out for Delivery' ? 'bg-yellow-100 text-yellow-800' :
                        tracking.status === 'Pending' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tracking.status === 'Delivered' && <FaCheckCircle className="mr-2" />}
                        {tracking.status === 'In Transit' && <FaTruck className="mr-2" />}
                        {tracking.status === 'Pending' && <FaClock className="mr-2" />}
                        {tracking.status?.includes('Error') && <FaExclamationCircle className="mr-2" />}
                        {tracking.status}
                      </span>
                    </div>

                    {/* Shipment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Expected Delivery</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{tracking.estimatedDelivery || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Carrier</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{tracking.carrier || 'Standard Shipping'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Order Date</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{tracking.orderDate}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative">
                      <div className="space-y-4">
                        {tracking.timeline && tracking.timeline.map((event, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${
                                event.completed ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              {index < (tracking.timeline?.length || 0) - 1 && (
                                <div className={`w-0.5 h-12 ${event.completed ? 'bg-green-200' : 'bg-gray-200'}`} />
                              )}
                            </div>
                            <div className="pb-4">
                              <p className="font-medium text-gray-900">{event.status}</p>
                              <p className="text-sm text-gray-500">{event.timestamp}</p>
                              {event.location && (
                                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                  <FaMapMarkerAlt className="text-gray-400" /> {event.location}
                                </p>
                              )}
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {tracking.deliveryAddress && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Delivery Address</p>
                        <p className="text-sm text-gray-900">{tracking.deliveryAddress}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Marketplace;