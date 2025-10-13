import React, { useState, useRef } from 'react';
import { FaCamera, FaSpinner } from 'react-icons/fa';

const ImageUploader = ({ 
  currentUrl, 
  onUpload, 
  variant = 'profile', 
  label = 'Upload Photo',
  className = '',
  aspectRatio = '1/1',
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      await onUpload(file, variant);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className="relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 transition-colors cursor-pointer bg-gray-50"
        style={{ aspectRatio }}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img 
            src={preview} 
            alt={label} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FaCamera className="text-4xl mb-2" />
            <p className="text-sm">{label}</p>
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <FaSpinner className="text-white text-3xl animate-spin" />
          </div>
        )}
        
        <div className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg">
          <FaCamera />
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default ImageUploader;
