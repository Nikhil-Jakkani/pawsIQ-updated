import React, { useState } from 'react';
import { 
  FaTimes, 
  FaPlus, 
  FaFileMedical, 
  FaUpload, 
  FaTrash,
  FaCheck,
  FaExclamationTriangle,
  FaHeartbeat,
  FaSyringe,
  FaPills,
  FaStethoscope,
  FaEye,
  FaTooth,
  FaBone,
  FaAllergies
} from 'react-icons/fa';

const MedicalRecordsPopup = ({ isOpen, onClose, onSubmit, petName = "your pet" }) => {
  const [formData, setFormData] = useState({
    title: '',
    recordDate: new Date().toISOString().split('T')[0],
    description: '',
    selectedConditions: [],
    customConditions: [],
    files: []
  });
  
  const [newCustomCondition, setNewCustomCondition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Common medical conditions with icons and categories
  const commonConditions = [
    // Vaccinations
    { id: 'rabies', name: 'Rabies Vaccination', icon: <FaSyringe />, category: 'Vaccination', color: 'bg-green-100 text-green-800' },
    { id: 'dhpp', name: 'DHPP Vaccination', icon: <FaSyringe />, category: 'Vaccination', color: 'bg-green-100 text-green-800' },
    { id: 'bordetella', name: 'Bordetella Vaccination', icon: <FaSyringe />, category: 'Vaccination', color: 'bg-green-100 text-green-800' },
    { id: 'fvrcp', name: 'FVRCP Vaccination (Cats)', icon: <FaSyringe />, category: 'Vaccination', color: 'bg-green-100 text-green-800' },
    
    // Common Health Issues
    { id: 'allergies', name: 'Allergies', icon: <FaAllergies />, category: 'Health Issue', color: 'bg-red-100 text-red-800' },
    { id: 'ear_infection', name: 'Ear Infection', icon: <FaStethoscope />, category: 'Health Issue', color: 'bg-red-100 text-red-800' },
    { id: 'skin_condition', name: 'Skin Condition', icon: <FaExclamationTriangle />, category: 'Health Issue', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'dental_cleaning', name: 'Dental Cleaning', icon: <FaTooth />, category: 'Dental', color: 'bg-blue-100 text-blue-800' },
    { id: 'eye_exam', name: 'Eye Examination', icon: <FaEye />, category: 'Examination', color: 'bg-purple-100 text-purple-800' },
    
    // Treatments
    { id: 'flea_treatment', name: 'Flea Treatment', icon: <FaPills />, category: 'Treatment', color: 'bg-orange-100 text-orange-800' },
    { id: 'deworming', name: 'Deworming', icon: <FaPills />, category: 'Treatment', color: 'bg-orange-100 text-orange-800' },
    { id: 'heartworm_prevention', name: 'Heartworm Prevention', icon: <FaHeartbeat />, category: 'Prevention', color: 'bg-pink-100 text-pink-800' },
    
    // Surgery/Procedures
    { id: 'spay_neuter', name: 'Spay/Neuter', icon: <FaStethoscope />, category: 'Surgery', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'microchip', name: 'Microchip Implantation', icon: <FaStethoscope />, category: 'Procedure', color: 'bg-gray-100 text-gray-800' },
    { id: 'xray', name: 'X-Ray', icon: <FaBone />, category: 'Diagnostic', color: 'bg-teal-100 text-teal-800' },
    { id: 'blood_work', name: 'Blood Work', icon: <FaFileMedical />, category: 'Diagnostic', color: 'bg-teal-100 text-teal-800' }
  ];

  const handleConditionToggle = (conditionId) => {
    setFormData(prev => ({
      ...prev,
      selectedConditions: prev.selectedConditions.includes(conditionId)
        ? prev.selectedConditions.filter(id => id !== conditionId)
        : [...prev.selectedConditions, conditionId]
    }));
  };

  const handleAddCustomCondition = () => {
    if (newCustomCondition.trim() && !formData.customConditions.includes(newCustomCondition.trim())) {
      setFormData(prev => ({
        ...prev,
        customConditions: [...prev.customConditions, newCustomCondition.trim()]
      }));
      setNewCustomCondition('');
    }
  };

  const handleRemoveCustomCondition = (condition) => {
    setFormData(prev => ({
      ...prev,
      customConditions: prev.customConditions.filter(c => c !== condition)
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError(`File "${file.name}" is not a supported format. Please use PDF, JPG, PNG, or DOCX files.`);
        return false;
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 10MB size limit.`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...validFiles]
      }));
      setError('');
    }
  };

  const handleRemoveFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a title for this medical record.');
      return;
    }

    if (formData.selectedConditions.length === 0 && formData.customConditions.length === 0) {
      setError('Please select at least one medical condition or add a custom condition.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Combine selected and custom conditions
      const allConditions = [
        ...formData.selectedConditions.map(id => 
          commonConditions.find(c => c.id === id)?.name || id
        ),
        ...formData.customConditions
      ];

      const recordData = {
        title: formData.title,
        recordDate: formData.recordDate,
        description: formData.description,
        conditions: allConditions,
        files: formData.files
      };

      await onSubmit(recordData);
      
      // Reset form
      setFormData({
        title: '',
        recordDate: new Date().toISOString().split('T')[0],
        description: '',
        selectedConditions: [],
        customConditions: [],
        files: []
      });
      
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save medical record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      case 'doc':
      case 'docx':
        return '📝';
      default:
        return '📎';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <FaFileMedical className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Add Medical Record</h2>
                  <p className="text-blue-100 text-sm">Record medical information for {petName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-red-400 mr-2" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaFileMedical className="text-blue-600" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Record Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., Annual Checkup, Vaccination Record"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.recordDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, recordDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Additional notes about this medical record..."
                  />
                </div>
              </div>

              {/* Medical Conditions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaStethoscope className="text-green-600" />
                  Medical Conditions *
                </h3>
                
                {/* Common Conditions */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Select Common Conditions:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {commonConditions.map((condition) => (
                      <div
                        key={condition.id}
                        onClick={() => handleConditionToggle(condition.id)}
                        className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                          formData.selectedConditions.includes(condition.id)
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${condition.color}`}>
                            {condition.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 text-sm">{condition.name}</span>
                              {formData.selectedConditions.includes(condition.id) && (
                                <FaCheck className="text-blue-600 text-sm" />
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{condition.category}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Conditions */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Add Custom Conditions:</h4>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newCustomCondition}
                      onChange={(e) => setNewCustomCondition(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomCondition())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter a custom medical condition..."
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCondition}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <FaPlus className="text-sm" />
                      Add
                    </button>
                  </div>
                  
                  {/* Display Custom Conditions */}
                  {formData.customConditions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.customConditions.map((condition, index) => (
                        <div
                          key={index}
                          className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          <span>{condition}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomCondition(condition)}
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUpload className="text-orange-600" />
                  Medical Documents (Optional)
                </h3>
                
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <FaUpload className="mx-auto text-4xl text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                        Click to upload files
                      </label>
                      {' '}or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, JPG, PNG, DOCX files up to 10MB each
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Uploaded Files */}
                {formData.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(file.name)}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Save Medical Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordsPopup;