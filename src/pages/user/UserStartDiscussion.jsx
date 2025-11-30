import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTimes } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';

const UserStartDiscussion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'advice',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'advice', label: 'Advice & Questions' },
    { value: 'nutrition', label: 'Pet Nutrition' },
    { value: 'training', label: 'Training & Behavior' },
    { value: 'health', label: 'Health & Wellness' },
    { value: 'events', label: 'Events & Meetups' },
    { value: 'success-stories', label: 'Success Stories' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Description is required';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = 'Description must be at least 10 characters';
    } else if (formData.content.trim().length > 5000) {
      newErrors.content = 'Description must be less than 5000 characters';
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'Please add at least one tag';
    } else if (formData.tags.length > 5) {
      newErrors.tags = 'Maximum 5 tags allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    
    if (!tag) {
      setErrors(prev => ({
        ...prev,
        tagInput: 'Tag cannot be empty'
      }));
      return;
    }

    if (tag.length > 20) {
      setErrors(prev => ({
        ...prev,
        tagInput: 'Tag must be less than 20 characters'
      }));
      return;
    }

    if (formData.tags.includes(tag)) {
      setErrors(prev => ({
        ...prev,
        tagInput: 'Tag already added'
      }));
      return;
    }

    if (formData.tags.length >= 5) {
      setErrors(prev => ({
        ...prev,
        tagInput: 'Maximum 5 tags allowed'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag]
    }));
    setTagInput('');
    setErrors(prev => ({
      ...prev,
      tagInput: ''
    }));
  };

  const handleRemoveTag = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      console.log('Submitting discussion:', formData);
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success - navigate back to community
      navigate('/user/community', { 
        state: { 
          success: true, 
          message: 'Discussion posted successfully!' 
        } 
      });
    } catch (error) {
      console.error('Error submitting discussion:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to post discussion. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/user/community')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go back"
          >
            <FaArrowLeft className="text-gray-600 text-xl" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Start a Discussion</h1>
            <p className="text-gray-500 mt-1">Share your thoughts, questions, and experiences with the pet community</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Global Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.submit}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discussion Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="What's your discussion about? (5-200 characters)"
              maxLength="200"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                errors.title
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-pet-purple-500 focus:border-pet-purple-500'
              }`}
            />
            <div className="flex justify-between items-start mt-2">
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.title.length}/200
              </p>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pet-purple-500 focus:border-pet-purple-500 transition-all duration-300"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Choose the most relevant category for your discussion
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags <span className="text-red-500">*</span> (1-5 tags)
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    if (errors.tagInput) {
                      setErrors(prev => ({
                        ...prev,
                        tagInput: ''
                      }));
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag and press Enter (e.g., dogs, training, health)"
                  maxLength="20"
                  disabled={formData.tags.length >= 5}
                  className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.tagInput
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-pet-purple-500 focus:border-pet-purple-500'
                  } ${formData.tags.length >= 5 ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={formData.tags.length >= 5 || !tagInput.trim()}
                  className="px-4 py-3 bg-pet-purple-500 hover:bg-pet-purple-600 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FaPlus /> Add
                </button>
              </div>

              {errors.tagInput && (
                <p className="text-sm text-red-500">{errors.tagInput}</p>
              )}

              {/* Tags Display */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-pet-purple-100 to-pet-pink-100 text-pet-purple-700 rounded-full text-sm font-medium border border-pet-purple-200"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        className="text-pet-purple-600 hover:text-pet-purple-800 transition-colors"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.tags && (
                <p className="text-sm text-red-500">{errors.tags}</p>
              )}
            </div>
          </div>

          {/* Description/Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Share your thoughts, questions, or experiences. Be detailed and clear to get better responses. (10-5000 characters)"
              maxLength="5000"
              rows="10"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
                errors.content
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-pet-purple-500 focus:border-pet-purple-500'
              }`}
            />
            <div className="flex justify-between items-start mt-2">
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.content.length}/5000
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="p-4 bg-pet-purple-50 border border-pet-purple-200 rounded-lg">
            <h3 className="font-semibold text-pet-purple-900 mb-2">💡 Tips for a great discussion:</h3>
            <ul className="text-sm text-pet-purple-800 space-y-1 ml-4 list-disc">
              <li>Be specific and provide context</li>
              <li>Use appropriate tags to reach the right audience</li>
              <li>Be respectful and friendly to all community members</li>
              <li>Proofread before posting</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/user/community')}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pet-purple-500 to-pet-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Discussion'}
            </button>
          </div>
        </form>
      </div>
    </UserLayout>
  );
};

export default UserStartDiscussion;