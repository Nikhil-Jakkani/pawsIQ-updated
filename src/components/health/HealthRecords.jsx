import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlus, FaFilePdf, FaFileImage, FaFileWord, FaTrash, FaDownload, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { vaccinationService } from '../../services/vaccinationService';
import PrescriptionSection from './PrescriptionSection';
const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const HealthRecords = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { currentUser, tokens, authFetch } = useAuth();
  const [records, setRecords] = useState([]);
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [vaccinations, setVaccinations] = useState([]);
  const [petVaccinations, setPetVaccinations] = useState([]);
  const [profileVaccinations, setProfileVaccinations] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    recordType: 'vaccination',
    vaccinationName: '',
    isCustomVaccination: false,
    customVaccinationName: '',
    recordDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    prescribedBy: '',
  });

  const recordTypes = [
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'general', label: 'General' },
    { value: 'deworming', label: 'Deworming' },
    { value: 'checkup', label: 'Checkup' },
    { value: 'lab_test', label: 'Lab Test' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'allergy', label: 'Allergy' },
    { value: 'imaging', label: 'Imaging' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'other', label: 'Other' },
  ];

  const fetchPetAndRecords = async () => {
    try {
      setLoading(true);
      setError('');
      if (!authFetch) throw new Error('Auth not ready');

      // Fetch pet details with fallback
      let petResponse = await authFetch(`${API_URL}/pets/${petId}`);
      let petData;
      if (petResponse.ok) {
        petData = await petResponse.json();
      } else {
        const profileRes = await authFetch(`${API_URL}/user/profile`);
        const profilePayload = await profileRes.json().catch(() => ({}));
        if (profileRes.ok) {
          const arr = Array.isArray(profilePayload?.pets) ? profilePayload.pets : [];
          const idNum = Number(petId);
          petData = arr.find(p => Number(p.pet_id ?? p.id) === idNum);
          if (petData?.vaccinations) {
            const normalizedVaccs = Array.isArray(petData.vaccinations)
              ? petData.vaccinations
              : typeof petData.vaccinations === 'string'
                ? petData.vaccinations.split(',').map(v => v.trim()).filter(Boolean)
                : [];
            setProfileVaccinations(normalizedVaccs);
          }
        }
        // If still not found, set a minimal pet object and continue without error
        if (!petData) {
          petData = { id: petId, name: 'Pet', pet_type: '', pet_breed: '' };
        }
      }
      const normalizedPet = {
        id: Number(petData.pet_id ?? petData.id ?? petId),
        name: petData.pet_name ?? petData.name ?? 'Pet',
        breed: petData.pet_breed ?? petData.breed ?? '',
        type: (petData.pet_type ?? petData.type ?? '').toLowerCase(),
        age: petData.pet_age != null ? `${petData.pet_age} years` : (petData.pet_birthday || petData.birthdate ? (() => {
          const d = new Date(petData.pet_birthday || petData.birthdate);
          if (isNaN(d.getTime())) return '';
          const years = Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
          return `${years} years`;
        })() : ''),
      };
      setPet(normalizedPet);

      // Fetch health records (with fallback)
      let recordsResponse = await authFetch(`${API_URL}/pets/${petId}/health-records`);
      let recordsData;
      if (recordsResponse.ok) {
        recordsData = await recordsResponse.json();
      } else {
        // fallback to a query endpoint if available
        const alt = await authFetch(`${API_URL}/health-records?petId=${encodeURIComponent(petId)}`);
        if (alt.ok) {
          recordsData = await alt.json();
        } else {
          // If both fail and status is 404/403, treat as no records instead of hard error
          if (recordsResponse.status === 404 || recordsResponse.status === 403 || alt.status === 404 || alt.status === 403) {
            recordsData = [];
          } else {
            const errorData = await recordsResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch health records');
          }
        }
      }
      const list = Array.isArray(recordsData) ? recordsData : (recordsData?.records || []);
      const normalized = list.map((r) => ({
        health_record_id: r.health_record_id ?? r.healthRecordId ?? r.id,
        pet_id: r.pet_id ?? r.petId,
        recordType: (r.record_type ?? r.recordType ?? '').toLowerCase(),
        title: r.title,
        description: r.description,
        recordDate: r.record_date ?? r.recordDate,
        nextDueDate: r.next_due_date ?? r.nextDueDate,
        file_path: r.file_path ?? r.filePath,
        fileName: r.file_name ?? r.fileName,
        fileType: r.file_type ?? r.fileType,
        fileSize: Number(r.file_size ?? r.fileSize ?? 0),
        fileUrl: r.fileUrl ?? null,
      }));
      setRecords(normalized);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      const url = await getFileUrl(record);
      if (url !== '#') {
        window.open(url, '_blank');
      } else {
        throw new Error('Could not generate download URL');
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    }
  };

  useEffect(() => {
    // Load vaccinations from backend API and pet-specific vaccinations
    const loadVaccinations = async () => {
      try {
        console.log('Loading vaccinations from backend API and pet database');

        // Get token
        const token = currentUser?.tokens?.access?.token || tokens?.access?.token;

        // Load available vaccines from master with pet type (if pet is loaded)
        const petType = pet?.type || '';
        console.log('Loading vaccines with petType:', petType);
        const availableVaccines = await vaccinationService.getAvailableVaccines(token, petType);
        console.log('Available vaccines loaded:', availableVaccines);
        setVaccinations(availableVaccines);

        // Load pet-specific vaccinations from PIQ_Pet_Vaccination table
        if (petId && token) {
          try {
            const petVaccinesList = await vaccinationService.getPetVaccinations(petId, token);
            console.log('Pet vaccinations from database:', petVaccinesList);
            if (petVaccinesList.length) {
              setPetVaccinations(petVaccinesList);
            } else if (profileVaccinations.length) {
              setPetVaccinations(profileVaccinations.map(name => ({ vaccination_name: name })));
            } else {
              setPetVaccinations([]);
            }
          } catch (err) {
            console.warn('Could not load pet vaccinations from database:', err);
            if (profileVaccinations.length) {
              setPetVaccinations(profileVaccinations.map(name => ({ vaccination_name: name })));
            } else {
              setPetVaccinations([]);
            }
          }
        }
      } catch (err) {
        console.error('Error loading vaccinations:', err);
        setVaccinations([]);
      }
    };

    // Only load vaccinations when we have a petId, currentUser, and pet is loaded with a type
    if (petId && currentUser && pet) {
      loadVaccinations();
    }
  }, [petId, currentUser, pet, profileVaccinations]);

  useEffect(() => {
    if (petId && currentUser) {
      fetchPetAndRecords();
    }
  }, [petId, currentUser]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, id } = e.target;
    setFormData(prev => {
      const updated = { ...prev };

      // Handle radio button for isCustomVaccination
      if (name === 'isCustomVaccination' && type === 'radio') {
        updated.isCustomVaccination = id === 'customVaccine';
        // Reset the other field when switching modes
        if (id === 'customVaccine') {
          updated.vaccinationName = '';
        } else {
          updated.customVaccinationName = '';
        }
      } else if (type === 'checkbox') {
        updated[name] = checked;
      } else {
        updated[name] = value;
      }
      
      // Validate recordDate - prevent future dates
      if (name === 'recordDate') {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate > today) {
          setError('Vaccination date cannot be in the future');
          return prev;
        }
        setError('');
      }
      
      // Auto-populate title with vaccination name if selecting a vaccination
      if ((name === 'vaccinationName' || name === 'customVaccinationName') && value && updated.recordType === 'vaccination') {
        updated.title = value;
      }

      return updated;
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Basic file type validation
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please upload a PDF, JPG, PNG, or DOCX file.');
        return;
      }

      // File size limit: 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setUploading(true);
      setError('');
      const accessToken = currentUser?.tokens?.access?.token || tokens?.access?.token;

      // Validate recordDate - prevent future dates
      const selectedDate = new Date(formData.recordDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        throw new Error('Vaccination date cannot be in the future');
      }

      // Determine vaccination name
      let vaccinationName = '';
      if (formData.recordType === 'vaccination') {
        if (formData.isCustomVaccination) {
          if (!formData.customVaccinationName.trim()) {
            throw new Error('Please enter a custom vaccination name');
          }
          vaccinationName = formData.customVaccinationName.trim();
        } else {
          if (!formData.vaccinationName.trim()) {
            throw new Error('Please select a vaccination');
          }
          vaccinationName = formData.vaccinationName;
        }
      }

      // 1. Get signed upload URL if a file is selected
      if (file) {
        const uploadUrlResponse = await fetch(
          `${API_URL}/pets/${petId}/health-records/upload-url`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
            }),
          }
        );

        if (!uploadUrlResponse.ok) {
          const errorData = await uploadUrlResponse.json();
          throw new Error(errorData.message || 'Failed to get upload URL');
        }

        const { signedUrl, path } = await uploadUrlResponse.json();

        // 2. Upload file to storage using the signed URL
        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('File upload failed');
        }

        // 3. Create health record with file details
        let description = formData.description;
        if (formData.recordType === 'prescription') {
          const prescriptionDetails = {
            medicationName: formData.medicationName || null,
            dosage: formData.dosage || null,
            frequency: formData.frequency || null,
            prescribedBy: formData.prescribedBy || null,
          };
          description = JSON.stringify({
            text: formData.description || '',
            prescriptionDetails,
          });
        }

        const recordData = {
          recordType: formData.recordType,
          title: formData.title || vaccinationName,
          description: description,
          recordDate: formData.recordDate,
          nextDueDate: formData.nextDueDate || null,
          filePath: path,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        };

        const createRecordResponse = await authFetch(
          `${API_URL}/pets/${petId}/health-records`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(recordData),
          }
        );

        if (!createRecordResponse.ok) {
          const errorData = await createRecordResponse.json();
          throw new Error(errorData.message || 'Failed to create health record');
        }

        // If vaccination, also save to pet vaccinations table
        if (formData.recordType === 'vaccination' && vaccinationName) {
          try {
            await vaccinationService.savePetVaccination(petId, {
              vaccination_name: vaccinationName,
              vaccine_given_date: formData.recordDate,
              vaccine_due_date: formData.nextDueDate,
            }, accessToken);
          } catch (err) {
            console.warn('Could not save vaccination to pet table:', err);
          }
        }

        // Refresh records
        await fetchPetAndRecords();
        setShowUploadModal(false);
        setFile(null);
        setFormData({
          title: '',
          description: '',
          recordType: 'vaccination',
          vaccinationName: '',
          isCustomVaccination: false,
          customVaccinationName: '',
          recordDate: new Date().toISOString().split('T')[0],
          nextDueDate: '',
          medicationName: '',
          dosage: '',
          frequency: '',
          prescribedBy: '',
        });
      } else {
        // No file provided: create record without file fields
        let description = formData.description;
        if (formData.recordType === 'prescription') {
          const prescriptionDetails = {
            medicationName: formData.medicationName || null,
            dosage: formData.dosage || null,
            frequency: formData.frequency || null,
            prescribedBy: formData.prescribedBy || null,
          };
          description = JSON.stringify({
            text: formData.description || '',
            prescriptionDetails,
          });
        }

        const recordData = {
          recordType: formData.recordType,
          title: formData.title || vaccinationName,
          description: description,
          recordDate: formData.recordDate,
          nextDueDate: formData.nextDueDate || null,
          filePath: '',
          fileName: '',
          fileType: '',
          fileSize: 0,
        };

        const createRecordResponse = await authFetch(
          `${API_URL}/pets/${petId}/health-records`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(recordData),
          }
        );

        if (!createRecordResponse.ok) {
          const errorData = await createRecordResponse.json();
          throw new Error(errorData.message || 'Failed to create health record');
        }

        // If vaccination, also save to pet vaccinations table
        if (formData.recordType === 'vaccination' && vaccinationName) {
          try {
            await vaccinationService.savePetVaccination(petId, {
              vaccination_name: vaccinationName,
              vaccine_given_date: formData.recordDate,
              vaccine_due_date: formData.nextDueDate,
            }, accessToken);
          } catch (err) {
            console.warn('Could not save vaccination to pet table:', err);
          }
        }

        await fetchPetAndRecords();
        setShowUploadModal(false);
        setFile(null);
        setFormData({
          title: '',
          description: '',
          recordType: 'vaccination',
          vaccinationName: '',
          isCustomVaccination: false,
          customVaccinationName: '',
          recordDate: new Date().toISOString().split('T')[0],
          nextDueDate: '',
        });
      }
    } catch (err) {
      console.error('Error saving health record:', err);
      setError(err.message || 'Failed to save health record');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authFetch(`${API_URL}/health-records/${recordId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete record');
      }

      // Refresh the records
      await fetchPetAndRecords();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting record:', err);
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFilePdf className="text-red-500" />;

    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FaFilePdf className="text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FaFileImage className="text-blue-500" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-700" />;
      default:
        return <FaFilePdf className="text-gray-500" />;
    }
  };

  const getFileUrl = async (record) => {
    if (!record.file_path) return '#';

    try {
      const qs = new URLSearchParams({
        path: record.file_path,
        bucket: 'health-records',
      });

      const response = await authFetch(`${API_URL}/media/signed-url?${qs}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to get file URL');
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return '#';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 1. Get signed upload URL
      const uploadUrlResponse = await authFetch(
        `${API_URL}/pets/${petId}/health-records/upload-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        }
      );

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json();
        throw new Error(errorData.message || 'Failed to get upload URL');
      }

      const { signedUrl, path } = await uploadUrlResponse.json();

      // 2. Upload file to storage using the signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      // 3. Create health record with file details
      const recordData = {
        ...formData,
        filePath: path,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };

      const recordResponse = await authFetch(
        `${API_URL}/pets/${petId}/health-records`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordData),
        }
      );

      if (!recordResponse.ok) {
        const errorData = await recordResponse.json();
        throw new Error(errorData.message || 'Failed to create health record');
      }

      // Refresh the records
      await fetchPetAndRecords();
      setShowUploadModal(false);
      setFile(null);
      setFormData({
        title: '',
        description: '',
        recordType: 'test_result',
        vaccinationName: '',
        recordDate: new Date().toISOString().split('T')[0],
        nextDueDate: '',
        medicationName: '',
        dosage: '',
        frequency: '',
        prescribedBy: '',
      });
    } catch (err) {
      setError(err.message);
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading && !records.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <FaArrowLeft className="mr-1" /> Back to Pets
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {pet ? `${pet.name}'s Health Records` : 'Health Records'}
            </h1>
            {pet && (
              <p className="text-sm text-gray-500 mt-1">
                {pet.breed} • {pet.age || 'N/A'}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaPlus className="mr-2" /> Add Record
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No health records</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading a health record.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaPlus className="-ml-1 mr-2 h-5 w-5" />
              New Record
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <PrescriptionSection 
            petId={petId}
            petName={pet?.name}
            records={records}
            onAddPrescription={() => {
              setFormData(prev => ({ ...prev, recordType: 'prescription' }));
              setShowUploadModal(true);
            }}
            onDeletePrescription={handleDelete}
          />

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Health Records</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {records.filter(r => (r.record_type ?? r.recordType ?? '').toLowerCase() !== 'prescription').length === 0 ? (
                <p className="text-center text-gray-500 py-8 col-span-full">No other health records</p>
              ) : (
                records.filter(r => (r.record_type ?? r.recordType ?? '').toLowerCase() !== 'prescription').map((record) => (
            <div key={record.health_record_id} className="border rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(record.fileName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {record.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {recordTypes.find(rt => rt.value === record.recordType)?.label || record.recordType}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {record.description}
                      </p>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Record date:</span> {record.recordDate ? new Date(record.recordDate).toLocaleDateString() : '-'}
                        </div>
                        <div>
                          <span className="text-gray-500">Next due:</span> {record.nextDueDate ? new Date(record.nextDueDate).toLocaleDateString() : '-'}
                        </div>
                        <div>
                          <span className="text-gray-500">File name:</span> {record.fileName || '-'}
                        </div>
                        <div>
                          <span className="text-gray-500">File type:</span> {record.fileType || '-'}
                        </div>
                        <div>
                          <span className="text-gray-500">File size:</span> {formatFileSize(record.fileSize || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(record)}
                      className="text-blue-500 hover:text-blue-700 mr-3 inline-block"
                      title="View"
                    >
                      <FaDownload />
                    </button>
                    <button
                      onClick={() => handleDelete(record.health_record_id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FaTrash className="-ml-0.5 mr-1.5 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Upload Health Record
                  </h3>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Title *
                          </label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            required
                            value={formData.title}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label htmlFor="recordType" className="block text-sm font-medium text-gray-700">
                            Record Type *
                          </label>
                          <select
                            id="recordType"
                            name="recordType"
                            value={formData.recordType}
                            onChange={handleInputChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                            {recordTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {formData.recordType === 'prescription' && (
                          <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">Prescription Details</h4>
                            <div>
                              <label htmlFor="medicationName" className="block text-sm font-medium text-gray-700">
                                Medication Name <span className="text-gray-400 text-xs">(optional)</span>
                              </label>
                              <input
                                type="text"
                                name="medicationName"
                                id="medicationName"
                                placeholder="e.g., Amoxicillin"
                                value={formData.medicationName}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">
                                  Dosage
                                </label>
                                <input
                                  type="text"
                                  name="dosage"
                                  id="dosage"
                                  placeholder="e.g., 500mg"
                                  value={formData.dosage}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                                  Frequency
                                </label>
                                <input
                                  type="text"
                                  name="frequency"
                                  id="frequency"
                                  placeholder="e.g., Twice daily"
                                  value={formData.frequency}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label htmlFor="prescribedBy" className="block text-sm font-medium text-gray-700">
                                Prescribed By
                              </label>
                              <input
                                type="text"
                                name="prescribedBy"
                                id="prescribedBy"
                                placeholder="e.g., Dr. John Smith"
                                value={formData.prescribedBy}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        )}

                        {formData.recordType === 'vaccination' && (
                          <div className="space-y-3">
                            <div>
                              <label htmlFor="vaccinationName" className="block text-sm font-medium text-gray-700 mb-2">
                                Select Vaccination *
                              </label>

                              {/* Show predefined vaccinations + pet's existing vaccinations */}
                              <div>
                                <div className="flex items-center mb-2">
                                  <input
                                    type="radio"
                                    id="predefinedVaccine"
                                    name="isCustomVaccination"
                                    checked={!formData.isCustomVaccination}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-indigo-600 cursor-pointer"
                                  />
                                  <label htmlFor="predefinedVaccine" className="ml-2 text-sm text-gray-700 cursor-pointer">
                                    Choose from available vaccinations
                                  </label>
                                </div>

                                {!formData.isCustomVaccination && (
                                  <select
                                    id="vaccinationName"
                                    name="vaccinationName"
                                    value={formData.vaccinationName}
                                    onChange={handleInputChange}
                                    required={!formData.isCustomVaccination && formData.recordType === 'vaccination'}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                  >
                                    <option value="">-- Select a vaccination --</option>
                                    {/* Show pet's existing vaccinations first */}
                                    {petVaccinations.length > 0 && (
                                      <optgroup label="Pet's Existing Vaccinations">
                                        {petVaccinations.map((vac) => (
                                          <option key={vac.vaccination_name} value={vac.vaccination_name}>
                                            {vac.vaccination_name}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                    {/* Show available vaccinations */}
                                    {vaccinations.length > 0 && (
                                      <optgroup label="Available Vaccinations">
                                        {vaccinations.map((vaccine) => (
                                          <option key={vaccine} value={vaccine}>
                                            {vaccine}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </select>
                                )}
                              </div>
                            </div>

                            {/* Custom vaccination option */}
                            <div className="border-t pt-3">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id="customVaccine"
                                  name="isCustomVaccination"
                                  checked={formData.isCustomVaccination}
                                  onChange={handleInputChange}
                                  className="h-4 w-4 text-indigo-600 cursor-pointer"
                                />
                                <label htmlFor="customVaccine" className="ml-2 text-sm text-gray-700 cursor-pointer">
                                  Add a custom vaccination
                                </label>
                              </div>

                              {formData.isCustomVaccination && (
                                <input
                                  type="text"
                                  name="customVaccinationName"
                                  placeholder="Enter vaccination name (e.g., Custom Vaccine, Experimental)"
                                  value={formData.customVaccinationName}
                                  onChange={handleInputChange}
                                  required={formData.isCustomVaccination && formData.recordType === 'vaccination'}
                                  className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="recordDate" className="block text-sm font-medium text-gray-700">
                              Record Date *
                            </label>
                            <input
                              type="date"
                              name="recordDate"
                              id="recordDate"
                              required
                              value={formData.recordDate}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">You can use today's date or earlier dates</p>
                          </div>
                          <div>
                            <label htmlFor="nextDueDate" className="block text-sm font-medium text-gray-700">
                              Next Due Date
                            </label>
                            <input
                              type="date"
                              name="nextDueDate"
                              id="nextDueDate"
                              value={formData.nextDueDate}
                              onChange={handleInputChange}
                              min={formData.recordDate}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">Must be on or after record date</p>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 48 48"
                                aria-hidden="true"
                              >
                                <path
                                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                >
                                  <span>Upload a file</span>
                                  <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PDF, JPG, PNG, DOCX up to 10MB
                              </p>
                              {file && (
                                <p className="text-sm text-gray-900">
                                  Selected: {file.name} ({formatFileSize(file.size)})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                          type="submit"
                          disabled={uploading}
                          className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm ${uploading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                          {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUploadModal(false)}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthRecords;
