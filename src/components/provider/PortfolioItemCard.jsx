import React from 'react';
import { FaEdit, FaTrash, FaStar } from 'react-icons/fa';

export default function PortfolioItemCard({ item, onEdit, onDelete, editable = true }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        
        {/* Featured Badge */}
        {item.is_featured && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <FaStar />
            Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {item.description}
          </p>
        )}

        {/* Actions */}
        {editable && (
          <div className="flex gap-2 pt-3 border-t">
            <button
              onClick={() => onEdit(item)}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <FaEdit />
              Edit
            </button>
            <button
              onClick={() => onDelete(item.portfolio_id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <FaTrash />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
