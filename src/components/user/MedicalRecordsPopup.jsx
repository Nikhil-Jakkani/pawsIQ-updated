import React, { useState, useRef } from 'react';
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
  FaAllergies,
  FaSpinner
} from 'react-icons/fa';
import { healthRecordService } from '../../services/healthRecordService';
import { useAuth } from '../../context/AuthContext';

const MedicalRecordsPopup = ({ 
  isOpen, 
  onClose, 
  petId, 
  petName = "your pet", 
  authFetch,
  onRecordAdded 
}) => {
  const fileInputRef = useRef(null);
  const { tokens } = useAuth();
  const accessToken = tokens?.access?.token;

  const [formData, setFormData] = useState({
    title: '',
    recordDate: new Date().toISOString().split('T')[0],
    description: '',
    recordType: 'vaccination',
    selectedConditions: [],
    customConditions: [],
    files: []
  });
  
  const [newCustomCondition, setNewCustomCondition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    const validFiles = [];
    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setError(`File "${file.name}" is not a supported format. Please use PDF, JPG, PNG, or DOCX files.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        setError(`File "${file.name}" is too large. Max size is 5MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...validFiles]
      }));
      setError('');
    }

    // reset input value so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset previous states
    setError('');
    setSuccess('');
    setUploadProgress(0);
    
    if (!petId) {
      setError('No pet selected. Please select a pet first.');
      return;
    }
    
    if (!formData.title.trim()) {
      setError('Please provide a title for this record');
      return;
    }
    
    if (formData.files.length === 0) {
      setError('Please upload at least one file');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setUploadProgress(10);
      
      const uploadedFiles = [];
      
      for (const file of formData.files) {
        setUploadProgress(prev => Math.min(prev + 10, 70));
        
        try {
          const { signedUrl, path, publicUrl, token } = await healthRecordService.getSignedUploadUrl(
            petId,
            file.name,
            file.type,
            accessToken
          );
          
          if (!path || !token) {
            throw new Error('Failed to get upload URL');
          }
          
          // Upload the file to Supabase using the signed upload token
          await healthRecordService.uploadFile(path, token, file);
          
          uploadedFiles.push({
            path,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            publicUrl
          });
        } catch (fileError) {
          console.error('Error uploading file:', fileError);
          throw new Error(`Failed to upload file ${file.name}: ${fileError.message}`);
        }
      }
      
      setUploadProgress(80);
      
      // Create health record for each uploaded file
      for (const file of uploadedFiles) {
        const recordData = {
          title: formData.title,
          description: formData.description,
          recordType: formData.recordType,
          recordDate: formData.recordDate,
          conditions: [
            ...formData.selectedConditions.map(id => 
              commonConditions.find(c => c.id === id)?.name || id
            ),
            ...formData.customConditions
          ].join(', '),
          filePath: file.path,
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          fileUrl: file.publicUrl
        };
        
        const response = await healthRecordService.createHealthRecord(petId, recordData, accessToken);
      }
      
      setUploadProgress(100);
      setSuccess('Health record added successfully!');
      
      // Notify parent component and close after delay
      if (onRecordAdded) {
        onRecordAdded();
      }
      
      // Reset form and close after delay
      setTimeout(() => {
        setFormData({
          title: '',
          recordDate: new Date().toISOString().split('T')[0],
          description: '',
          recordType: 'test_result',
          selectedConditions: [],
          customConditions: [],
          files: []
        });
        setSuccess('');
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Error uploading health record:', err);
      setError(err.message || 'Failed to upload health record. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
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

  const removeFile = (index) => {
    const newFiles = [...formData.files];
    newFiles.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      files: newFiles
    }));
  };

  if (!isOpen) return null;
  
  // Show loading state
  if (isSubmitting) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
          <div className="mb-4">
            <FaSpinner className="animate-spin text-blue-500 text-4xl mx-auto" />
          </div>
          <p className="text-lg font-medium mb-2">Uploading files...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{Math.round(uploadProgress)}% complete</p>
        </div>
      </div>
    );
  }
  
  if (!accessToken) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-red-500 mb-4">
            <FaExclamationTriangle className="inline-block mr-2" />
            Authentication required
          </div>
          <p className="mb-4">You need to be logged in to add medical records.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Add Medical Record for {petName}</h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
                <FaExclamationTriangle className="mr-2" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
                <FaCheck className="mr-2" />
                {success}
              </div>
            )}
            
            {isSubmitting && uploadProgress > 0 && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1 text-right">
                  {uploadProgress}% {uploadProgress < 100 ? 'Uploading...' : 'Completed!'}
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Record Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Record Type *</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md disabled:opacity-50"
                  value={formData.recordType}
                  onChange={(e) => setFormData({...formData, recordType: e.target.value})}
                  disabled={isSubmitting}
                >
                  <option value="vaccination">Vaccination</option>
                  <option value="general">General</option>
                  <option value="deworming">Deworming</option>
                  <option value="checkup">Checkup</option>
                  <option value="lab_test">Lab Test</option>
                  <option value="prescription">Prescription</option>
                  <option value="surgery">Surgery</option>
                  <option value="allergy">Allergy</option>
                  <option value="imaging">Imaging</option>
                  <option value="invoice">Invoice</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Other</option>
                </select>
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md h-24 disabled:opacity-50"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Add any additional details about this record..."
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medical Files *</label>
                  <div 
                    className={`border-2 border-dashed ${isSubmitting ? 'border-gray-200' : 'border-gray-300 hover:border-blue-400'} rounded-lg p-6 text-center transition-colors cursor-pointer`}
                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                  >
                    <FaUpload className={`mx-auto ${isSubmitting ? 'text-gray-300' : 'text-gray-400'} text-3xl mb-2`} />
                    <p className={`text-sm ${isSubmitting ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      {isSubmitting ? 'Uploading...' : 'Drag & drop files here, or click to select files'}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Supported formats: PDF, JPG, PNG, DOCX (Max 5MB per file)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </div>
                  
                  {formData.files.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({formData.files.length}):</h4>
                      <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {formData.files.map((file, index) => (
                          <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                            <div className="flex items-center min-w-0">
                              <FaFileMedical className="text-blue-500 mr-2 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm text-gray-700 truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              disabled={isSubmitting}
                              title="Remove file"
                            >
                              <FaTimes className="text-sm" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex-1 sm:flex-none"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 flex-1 sm:flex-none flex items-center justify-center ${
                    isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : 'Save Medical Record'}
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