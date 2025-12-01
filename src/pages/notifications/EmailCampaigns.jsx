import React, { useState } from 'react';
import { FaEnvelope, FaSearch, FaFilter, FaCheck, FaClock, FaExclamationCircle } from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';

const EmailCampaigns = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: '',
    subject: '',
    template: 'blank',
    audience: 'all',
    schedule: 'now',
    scheduledTime: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit logic will be implemented
    console.log('Campaign submitted:', formData);
    setFormData({
      campaignName: '',
      subject: '',
      template: 'blank',
      audience: 'all',
      schedule: 'now',
      scheduledTime: ''
    });
    setShowForm(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FaEnvelope className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Email Campaigns</h1>
              <p className="text-gray-500">Create and manage email marketing campaigns</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Campaign
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Email Campaign</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    name="campaignName"
                    value={formData.campaignName}
                    onChange={handleInputChange}
                    placeholder="e.g., Summer Promotion"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audience
                  </label>
                  <select
                    name="audience"
                    value={formData.audience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Subscribers</option>
                    <option value="users">Pet Owners Only</option>
                    <option value="providers">Service Providers Only</option>
                    <option value="active">Active Users (Last 30 days)</option>
                    <option value="inactive">Inactive Users (30+ days)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Email subject line"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select
                  name="template"
                  value={formData.template}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="blank">Blank Template</option>
                  <option value="welcome">Welcome Email</option>
                  <option value="promotion">Promotion</option>
                  <option value="reminder">Reminder</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send
                  </label>
                  <select
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="now">Now</option>
                    <option value="scheduled">Schedule for later</option>
                  </select>
                </div>
                {formData.schedule === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Time
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required={formData.schedule === 'scheduled'}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Campaign
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Campaign Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Audience</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Metrics</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <p className="text-gray-500">No email campaigns yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create your first campaign to get started</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmailCampaigns;