import React, { useState } from 'react';
import { FaPlus, FaImage, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import VetLayout from './VetLayout';
import PortfolioItemCard from '../../components/provider/PortfolioItemCard';
import PortfolioItemForm from '../../components/provider/PortfolioItemForm';
import { useProviderPortfolio } from '../../hooks/useProviderPortfolio';

export default function VetPortfolio() {
  const { portfolioItems, loading, uploadImage, createItem, updateItem, deleteItem } = useProviderPortfolio();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [message, setMessage] = useState(null);

  const handleCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleSave = async (itemData) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.portfolio_id, itemData);
        setMessage({ type: 'success', text: 'Portfolio item updated successfully!' });
      } else {
        await createItem(itemData);
        setMessage({ type: 'success', text: 'Portfolio item added successfully!' });
      }
      setIsFormOpen(false);
      setEditingItem(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;

    try {
      await deleteItem(itemId);
      setMessage({ type: 'success', text: 'Portfolio item deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  return (
    <VetLayout title="Portfolio">
      <div className="space-y-6">
        {/* Message Banner */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Portfolio</h2>
              <p className="text-gray-600 mt-1">
                Showcase your work, success stories, and achievements
              </p>
            </div>
            {!isFormOpen && (
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <FaPlus />
                Add Portfolio Item
              </button>
            )}
          </div>
        </div>

        {/* Form Section */}
        {isFormOpen && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingItem ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}
            </h3>
            <PortfolioItemForm
              item={editingItem}
              onSave={handleSave}
              onCancel={handleCancel}
              uploadImage={uploadImage}
              loading={loading}
            />
          </div>
        )}

        {/* Portfolio Grid */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading && portfolioItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading portfolio...</p>
            </div>
          ) : portfolioItems.length === 0 ? (
            <div className="text-center py-12">
              <FaImage className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Portfolio Items Yet</h3>
              <p className="text-gray-600 mb-6">
                Start building your portfolio by adding photos of your work and achievements
              </p>
              {!isFormOpen && (
                <button
                  onClick={handleCreate}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <FaPlus />
                  Add Your First Item
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  All Items ({portfolioItems.length})
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Click on any item to edit or delete it
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioItems.map((item) => (
                  <PortfolioItemCard
                    key={item.portfolio_id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    editable={true}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Portfolio Tips</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Use high-quality images that showcase your best work</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Add descriptive titles and details to help clients understand your expertise</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Mark your most impressive work as "Featured" to highlight it</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Organize items using display order for better presentation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Regularly update your portfolio with recent work to keep it fresh</span>
            </li>
          </ul>
        </div>
      </div>
    </VetLayout>
  );
}
