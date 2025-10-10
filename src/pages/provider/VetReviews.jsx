import React, { useEffect, useMemo, useState } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import VetLayout from './VetLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

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

const initialBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

const renderStars = (rating) => {
  const stars = [];
  for (let i = 1; i <= 5; i += 1) {
    if (i <= rating) {
      stars.push(<FaStar key={i} className="text-amber-400" />);
    } else if (i - 0.5 <= rating) {
      stars.push(<FaStarHalfAlt key={i} className="text-amber-400" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-amber-400" />);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
};

const VetReviews = () => {
  const { authFetch, tokens } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0, ratingBreakdown: initialBreakdown });
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [ratingFilter, setRatingFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchReviews = async (nextPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API_URL}/provider/reviews?page=${nextPage}&limit=20`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Unable to load reviews');
      }

      const payload = data?.data || {};
      const normalizedReviews = (payload.reviews || payload.items || []).map((review) => ({
        id: review.review_id,
        rating: Number(review.rating || 0),
        text: review.review_text || '',
        reviewedAt: review.reviewed_at,
        bookingId: review.booking_id,
        customerName: review.user?.user_full_name || 'Anonymous',
      }));

      setReviews(normalizedReviews);
      setSummary({
        averageRating: payload.summary?.averageRating || 0,
        totalReviews: payload.summary?.totalReviews || normalizedReviews.length,
        ratingBreakdown: { ...initialBreakdown, ...(payload.summary?.ratingBreakdown || {}) },
      });
      setPagination({
        page: payload.pagination?.page || nextPage,
        pages: payload.pagination?.pages || 1,
      });
      setPage(payload.pagination?.page || nextPage);
    } catch (err) {
      setError(err.message || 'Unable to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tokens?.access?.token) return;
    fetchReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.access?.token]);

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesRating = ratingFilter === 'all' || review.rating === Number(ratingFilter);
      const matchesSearch =
        !q ||
        review.customerName.toLowerCase().includes(q) ||
        review.text.toLowerCase().includes(q);
      return matchesRating && matchesSearch;
    });
  }, [reviews, ratingFilter, search]);

  const onPageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.pages || nextPage === page) return;
    fetchReviews(nextPage);
  };

  return (
    <VetLayout title="Reviews">
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900">{summary.averageRating.toFixed(1)}</span>
                {renderStars(summary.averageRating)}
              </div>
              <p className="text-xs text-gray-400 mt-1">Across {summary.totalReviews} reviews</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rating Breakdown</p>
              <div className="mt-2 space-y-1">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{rating} stars</span>
                    <span className="font-medium text-gray-900">{summary.ratingBreakdown[rating] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Filters</p>
              <div className="mt-2 space-y-3">
                <input
                  type="text"
                  placeholder="Search by customer or text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={ratingFilter}
                  onChange={(event) => setRatingFilter(event.target.value)}
                >
                  <option value="all">All ratings</option>
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Page {pagination.page} of {pagination.pages}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={loading || pagination.page <= 1}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={loading || pagination.page >= pagination.pages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading reviews…</div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No reviews match the current filters.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <li key={review.id} className="px-6 py-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{review.customerName}</span>
                        {renderStars(review.rating)}
                      </div>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{review.text || 'No written feedback provided.'}</p>
                    </div>
                    <div className="text-sm text-gray-500 text-right">
                      <div>Reviewed on {formatDate(review.reviewedAt)}</div>
                      {review.bookingId && <div className="text-xs text-gray-400">Booking #{review.bookingId}</div>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </VetLayout>
  );
};

export default VetReviews;
