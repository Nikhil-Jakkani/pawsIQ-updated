import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaSort, FaSortUp, FaSortDown, FaStar, FaStarHalfAlt, FaRegStar, FaEye, FaDownload, FaCheck, FaTimes, FaFlag, FaThumbsUp, FaThumbsDown, FaUserCircle } from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useApi from '../../hooks/useApi';

const ProviderPerformance = () => {
  const api = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statusDisplayMap = {
    published: { label: 'Published', badge: 'bg-green-100 text-green-800' },
    pending: { label: 'Pending Review', badge: 'bg-amber-100 text-amber-800' },
    'under review': { label: 'Under Review', badge: 'bg-amber-100 text-amber-800' },
    rejected: { label: 'Rejected', badge: 'bg-red-100 text-red-800' },
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

  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/admin/reviews');

        if (!isMounted) return;

        const items = response?.data ?? response?.items ?? [];
        const normalized = items.map((item) => {
          const reviewText = item.review_text || '';
          const title = reviewText
            ? reviewText.split('\n')[0].slice(0, 80) + (reviewText.length > 80 ? '…' : '')
            : 'Review';

          return {
            id: item.review_id,
            providerName: item.provider?.name || 'Unknown Provider',
            providerEmail: item.provider?.email || '—',
            serviceType: item.provider?.type || '—',
            customerName: item.customer?.name || 'Anonymous',
            customerEmail: item.customer?.email || '—',
            rating: Number(item.rating ?? 0),
            title,
            review: reviewText,
            date: item.reviewed_at,
            status: (item.status || 'pending').toLowerCase(),
            response: item.response || '',
            responseDate: item.response_date,
            helpful: item.helpful ?? 0,
            unhelpful: item.unhelpful ?? 0,
            flagged: Boolean(item.flagged),
            booking: item.booking || null,
          };
        });

        setReviews(normalized);
      } catch (err) {
        console.error('Failed to load provider reviews', err);
        if (isMounted) {
          setError(err?.message || 'Unable to load reviews');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [api]);

  const renderStarRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="text-amber-400" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<FaStarHalfAlt key={i} className="text-amber-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-amber-400" />);
      }
    }
    return <div className="flex">{stars}</div>;
  };

  const filteredAndSortedReviews = useMemo(() => {
    return reviews
      .filter((review) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          review.providerName.toLowerCase().includes(search) ||
          review.customerName.toLowerCase().includes(search) ||
          review.title.toLowerCase().includes(search) ||
          (review.review || '').toLowerCase().includes(search);

        const matchesRating =
          filterRating === 'all' || review.rating === Number(filterRating);

        const matchesStatus =
          filterStatus === 'all' || review.status === filterStatus.toLowerCase();

        return matchesSearch && matchesRating && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;

        if (sortField === 'date') {
          comparison = new Date(a.date || 0) - new Date(b.date || 0);
        } else if (sortField === 'rating') {
          comparison = a.rating - b.rating;
        } else if (sortField === 'providerName') {
          comparison = a.providerName.localeCompare(b.providerName);
        } else if (sortField === 'helpful') {
          comparison = a.helpful - b.helpful;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [reviews, searchTerm, filterRating, filterStatus, sortField, sortDirection]);

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

  // Handle view review details
  const handleViewReview = (review) => {
    setCurrentReview(review);
    setShowReviewModal(true);
  };

  // Handle review status change
  const handleStatusChange = (reviewId, newStatus) => {
    // In a real app, you would call an API to update the review status
    console.log(`Changing review ${reviewId} status to ${newStatus}`);
    alert(`Review status changed to ${newStatus}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/providers" className="text-gray-500 hover:text-indigo-600">
              <FaArrowLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Ratings & Reviews</h1>
              <p className="text-gray-500">Monitor and manage provider ratings and customer reviews</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={() => alert('Export functionality would be implemented here')}
            >
              <FaDownload /> Export Reviews
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
                placeholder="Search reviews..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Rating Filter */}
            <select
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            
            {/* Status Filter */}
            <select
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="pending">Pending Review</option>
              <option value="under review">Under Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Reviews Table */}
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('rating')}
                  >
                    <div className="flex items-center">
                      Rating {getSortIcon('rating')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date {getSortIcon('date')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('helpful')}
                  >
                    <div className="flex items-center">
                      Helpful {getSortIcon('helpful')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{review.providerName}</div>
                      <div className="text-xs text-gray-500">{review.serviceType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{review.customerName}</div>
                      <div className="text-xs text-gray-500">{review.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStarRating(review.rating)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{review.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{review.review}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {review.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {review.status === 'published' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Published</span>
                      ) : review.status === 'under review' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Under Review</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>
                      )}
                      {review.flagged && (
                        <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Flagged</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FaThumbsUp className="text-green-500" />
                        <span className="text-sm text-gray-900">{review.helpful}</span>
                        <FaThumbsDown className="text-red-500 ml-2" />
                        <span className="text-sm text-gray-900">{review.unhelpful}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewReview(review)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {review.status === 'under review' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(review.id, 'published')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve Review"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => handleStatusChange(review.id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                              title="Reject Review"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                        {!review.flagged && (
                          <button
                            onClick={() => alert(`Review ${review.id} flagged for review`)}
                            className="text-amber-600 hover:text-amber-900"
                            title="Flag Review"
                          >
                            <FaFlag />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Review Details Modal */}
        {showReviewModal && currentReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Review Details</h2>
                  <button 
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Provider Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-base font-medium text-gray-900">{currentReview.providerName}</p>
                      <p className="text-sm text-gray-500">{currentReview.providerEmail}</p>
                      <p className="text-sm text-gray-500 mt-1">Service: {currentReview.serviceType}</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Customer Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <FaUserCircle className="text-indigo-600" size={20} />
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-900">{currentReview.customerName}</p>
                          <p className="text-sm text-gray-500">{currentReview.customerEmail}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Review</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {renderStarRating(currentReview.rating)}
                        <span className="text-lg font-bold text-gray-900 ml-2">{currentReview.rating}/5</span>
                      </div>
                      <p className="text-sm text-gray-500">{currentReview.date}</p>
                    </div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">{currentReview.title}</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{currentReview.review}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FaThumbsUp className="text-green-500" />
                        <span>{currentReview.helpful} helpful</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaThumbsDown className="text-red-500" />
                        <span>{currentReview.unhelpful} unhelpful</span>
                      </div>
                    </div>
                  </div>
                </div>

                {currentReview.response && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Provider Response</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <p className="text-base font-medium text-gray-900">Response from {currentReview.providerName}</p>
                        <p className="text-sm text-gray-500">{currentReview.responseDate}</p>
                      </div>
                      <p className="text-sm text-gray-700">{currentReview.response}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Status</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-700">Current status:</p>
                      {currentReview.status === 'published' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Published</span>
                      ) : currentReview.status === 'under review' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Under Review</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>
                      )}
                      {currentReview.flagged && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Flagged</span>
                      )}
                    </div>
                    
                    {currentReview.status === 'under review' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            handleStatusChange(currentReview.id, 'published');
                            setShowReviewModal(false);
                          }}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-green-700 transition-colors"
                        >
                          <FaCheck size={12} /> Approve Review
                        </button>
                        <button
                          onClick={() => {
                            handleStatusChange(currentReview.id, 'rejected');
                            setShowReviewModal(false);
                          }}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-red-700 transition-colors"
                        >
                          <FaTimes size={12} /> Reject Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!currentReview.response && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Add Provider Response</h3>
                    <textarea
                      rows="4"
                      placeholder="Enter provider's response to this review..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
                    <button
                      className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      onClick={() => alert('Response would be saved and sent to the provider')}
                    >
                      Save Response
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProviderPerformance;