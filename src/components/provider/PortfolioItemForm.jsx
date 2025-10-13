import React, { useState } from 'react';
import { FaSave, FaTimes, FaUpload, FaStar } from 'react-icons/fa';

export default function PortfolioItemForm({ item, onSave, onCancel, uploadImage, loading }) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    image_url: item?.image_url || '',
    display_order: item?.display_order || 0,
    is_featured: item?.is_featured || false,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(item?.image_url || null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      let finalImageUrl = formData.image_url;

      // Upload image if new file selected
      if (imageFile) {
        setUploading(true);
        finalImageUrl = await uploadImage(imageFile);
      }

      if (!finalImageUrl) {
        alert('Please select an image');
        return;
      }

      await onSave({
        ...formData,
        image_url: finalImageUrl,
      });
    } catch (error) {
      alert('Failed to save: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image *
        </label>
        
        {/* Image Preview */}
        <div className="mb-4">
          <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <FaUpload className="mx-auto text-4xl mb-2" />
                <p>No image selected</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <FaUpload />
          {imageFile ? 'Change Image' : 'Select Image'}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={uploading || loading}
          />
        </label>
        {imageFile && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {imageFile.name}
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="e.g., Successful Surgery, Happy Client"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          placeholder="Describe this portfolio item..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Display Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display Order
        </label>
        <input
          type="number"
          name="display_order"
          value={formData.display_order}
          onChange={handleChange}
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Lower numbers appear first. Use 0 for default ordering.
        </p>
      </div>

      {/* Featured */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_featured"
          name="is_featured"
          checked={formData.is_featured}
          onChange={handleChange}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="is_featured" className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FaStar className="text-yellow-500" />
          Mark as Featured
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || uploading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <FaTimes />
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <FaSave />
          {loading || uploading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}
