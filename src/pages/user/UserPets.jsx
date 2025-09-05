import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPaw, FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaHeart, FaCalendarAlt, FaUser, FaClipboardList, FaFileMedical, FaSyringe } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import MedicalRecordsPopup from '../../components/user/MedicalRecordsPopup';
import VaccinationRecordsPopup from '../../components/user/VaccinationRecordsPopup';
const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserPets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { currentUser } = useAuth();
  const accessToken = currentUser?.tokens?.access?.token;
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMedicalRecordsPopup, setShowMedicalRecordsPopup] = useState(false);
  const [selectedPetForMedical, setSelectedPetForMedical] = useState(null);
  const [showVaccinationPopup, setShowVaccinationPopup] = useState(false);
  const [selectedPetForVaccination, setSelectedPetForVaccination] = useState(null);

  // Determine current view based on route
  const getCurrentView = () => {
    if (location.pathname.includes('/profiles')) return 'profiles';
    if (location.pathname.includes('/health')) return 'health';
    return 'overview';
  };

  // Refresh a pet image URL with proper error handling and caching
  const refreshImage = useCallback(async (petId, path) => {
    if (!path) return false;
    
    try {
      const qs = new URLSearchParams({ 
        bucket: 'pets-photos', 
        path, 
        expiresIn: String(60 * 60 * 24 * 6) // 6 days expiry
      }).toString();
      
      const urlRes = await fetch(`${API_URL}/media/signed-url?${qs}`, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache'
        },
      });
      
      if (!urlRes.ok) {
        throw new Error(`Failed to refresh image: ${urlRes.statusText}`);
      }
      
      const urlPayload = await urlRes.json();
      const signedUrl = urlPayload?.url;
      
      if (signedUrl) {
        setPets(prev => 
          prev.map(p => p.id === petId ? { ...p, image: signedUrl } : p)
        );
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error(`Error refreshing image for pet ${petId}:`, error);
      return false;
    }
  }, [accessToken, API_URL]);



  // Fetch pets with loading and error states
  useEffect(() => {
    if (!accessToken) return;

    const fetchPets = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData?.message || 'Failed to load pets');
        }
        
        const data = await res.json();
        const mapped = (data?.pets || []).map((p) => ({
          id: Number(p.pet_id),
          name: p.pet_name || 'Pet',
          type: (p.pet_type || '').toLowerCase(),
          breed: p.pet_breed || '',
          age: '0 years',
          imagePath: p.pet_image || '',
          image: 'https://placehold.co/600x400?text=Pet',
          healthStatus: '',
          lastCheckup: new Date().toISOString().slice(0, 10),
          upcomingAppointments: 0,
        }));

        // Process images in parallel and update state once
        const withUrls = await Promise.all(
          mapped.map(async (pet) => {
            if (!pet.imagePath) return pet;
            
            try {
              const qs = new URLSearchParams({ 
                bucket: 'pets-photos', 
                path: pet.imagePath, 
                expiresIn: String(60 * 60 * 24 * 6) 
              }).toString();
              
              const urlRes = await fetch(`${API_URL}/media/signed-url?${qs}`, {
                headers: { 
                  Authorization: `Bearer ${accessToken}`,
                  'Cache-Control': 'no-cache'
                },
              });
              
              if (!urlRes.ok) {
                console.warn(`Failed to get signed URL for pet ${pet.id}`);
                return pet;
              }
              
              const urlPayload = await urlRes.json();
              return { ...pet, image: urlPayload?.url || pet.image };
              
            } catch (error) {
              console.error(`Error loading image for pet ${pet.id}:`, error);
              return pet;
            }
          })
        );
        
        setPets(withUrls);
        
      } catch (e) {
        console.error('Failed to load pets:', e);
        setError(e.message || 'An error occurred while loading pets');
        setPets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPets();
  }, [accessToken, API_URL]);

  // Memoize filtered pets to prevent unnecessary re-renders
  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = pet.name.toLowerCase().includes(searchLower) || 
                          (pet.breed && pet.breed.toLowerCase().includes(searchLower));
      const matchesFilter = filterType === 'all' || pet.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [pets, searchTerm, filterType]);

  // Delete pet handler
  const handleDeletePet = (id) => {
    if (window.confirm('Are you sure you want to remove this pet?')) {
      setPets(pets.filter((pet) => pet.id !== id));
    }
  };

  // Upload image flow
  const uploadPetImage = async (petId, file) => {
    if (!file) return;
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      alert('Please upload a JPG, PNG, or WEBP image');
      return;
    }
    try {
      // 1) get signed upload
      const res = await fetch(`${API_URL}/media/signed-upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucket: 'pets-photos', entity: 'pet', entity_id: petId, file_ext: ext }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to get signed upload');

      const { path, token } = payload;
      // 2) upload to storage via signed URL token
      const { error: upErr } = await supabase.storage.from('pets-photos').uploadToSignedUrl(path, token, file);
      if (upErr) throw upErr;

      // 3) update pet image path on backend
      const upd = await fetch(`${API_URL}/pets/${petId}/image`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      const updPayload = await upd.json().catch(() => ({}));
      if (!upd.ok) throw new Error(updPayload?.message || 'Failed to update pet');

      // 4) get a signed view url and update UI
      const qs = new URLSearchParams({ bucket: 'pets-photos', path, expiresIn: String(60 * 60 * 24 * 6) }).toString();
      const urlRes = await fetch(`${API_URL}/media/signed-url?${qs}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const urlPayload = await urlRes.json().catch(() => ({}));
      const signedUrl = urlPayload?.url;

      setPets((prev) =>
        prev.map((p) => (p.id === petId ? { ...p, imagePath: path, image: signedUrl || p.image } : p))
      );
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Upload failed');
    }
  };

  // Handle opening medical records popup
  const handleOpenMedicalRecords = (pet) => {
    setSelectedPetForMedical(pet);
    setShowMedicalRecordsPopup(true);
  };

  // Handle closing medical records popup
  const handleCloseMedicalRecords = () => {
    setShowMedicalRecordsPopup(false);
    setSelectedPetForMedical(null);
  };

  // Vaccination popup handlers
  const handleOpenVaccination = (pet) => {
    setSelectedPetForVaccination(pet);
    setShowVaccinationPopup(true);
  };

  const handleCloseVaccination = () => {
    setShowVaccinationPopup(false);
    setSelectedPetForVaccination(null);
  };

  // Handle submitting medical record
  const handleSubmitMedicalRecord = async (recordData) => {
    if (!selectedPetForMedical || !accessToken) {
      throw new Error('Missing pet information or authentication');
    }

    try {
      // Create the medical record
      const response = await fetch(`${API_URL}/pets/${selectedPetForMedical.id}/health-records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: recordData.title,
          recordDate: recordData.recordDate,
          description: recordData.description,
          recordType: 'medical_condition',
          conditions: recordData.conditions,
          // Files will be handled separately if provided
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create medical record');
      }

      const createdRecord = await response.json();

      // Handle file uploads if any files were provided
      if (recordData.files && recordData.files.length > 0) {
        for (const file of recordData.files) {
          try {
            // Get signed upload URL
            const uploadUrlResponse = await fetch(`${API_URL}/pets/${selectedPetForMedical.id}/health-records/upload-url`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
              }),
            });

            if (uploadUrlResponse.ok) {
              const { signedUrl, path } = await uploadUrlResponse.json();
              
              // Upload file
              const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                  'Content-Type': file.type,
                },
              });

              if (uploadResponse.ok) {
                // Update the record with file information
                await fetch(`${API_URL}/health-records/${createdRecord.id}/file`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    filePath: path,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                  }),
                });
              }
            }
          } catch (fileError) {
            console.error('Error uploading file:', fileError);
            // Continue with other files even if one fails
          }
        }
      }

      // Show success message or update UI as needed
      console.log('Medical record created successfully');
      
    } catch (error) {
      console.error('Error creating medical record:', error);
      throw error;
    }
  };

  // Handle vaccination submission (multiple entries)
  const handleSubmitVaccinations = async ({ entries, createReminder, bookAppointment }) => {
    if (!selectedPetForVaccination || !accessToken) {
      throw new Error('Missing pet information or authentication');
    }

    const petId = selectedPetForVaccination.id;

    // Helper to create one vaccination record
    const createOneRecord = async (entry) => {
      const basePayload = {
        recordType: 'vaccination',
        title: entry.vaccineName,
        description: entry.notes || '',
        recordDate: entry.recordDate,
        nextDueDate: entry.nextDueDate || null,
      };

      // 1) Create record without file
      const res = await fetch(`${API_URL}/pets/${petId}/health-records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(basePayload),
      });
      const created = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(created?.message || 'Failed to create vaccination record');

      // 2) If file provided, get signed URL, upload, then attach to record
      if (entry.file) {
        const up = await fetch(`${API_URL}/pets/${petId}/health-records/upload-url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileName: entry.file.name, fileType: entry.file.type }),
        });
        const upPayload = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(upPayload?.message || 'Failed to get upload URL');
        const { signedUrl, path } = upPayload;
        const put = await fetch(signedUrl, { method: 'PUT', body: entry.file, headers: { 'Content-Type': entry.file.type } });
        if (!put.ok) throw new Error('File upload failed');

        // attach to record
        await fetch(`${API_URL}/health-records/${created.id}/file`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath: path,
            fileName: entry.file.name,
            fileType: entry.file.type,
            fileSize: entry.file.size,
          }),
        });
      }

      // 3) Optionally create reminder for nextDueDate
      if (createReminder && entry.nextDueDate) {
        const r = await fetch(`${API_URL}/reminders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            pet_id: petId,
            title: `${entry.vaccineName} booster due`,
            reminder_type: 'vaccination',
            due_date: new Date(entry.nextDueDate).toISOString(),
            priority: 'normal',
            notes: entry.notes || undefined,
          }),
        });
        const rj = await r.json().catch(() => ({}));
        if (!r.ok) console.warn('Failed to create reminder', rj);
      }

      return created;
    };

    // Create all records sequentially (to keep logic simple and respect order)
    for (const entry of entries) {
      await createOneRecord(entry);
    }

    // After all saved, optionally navigate to appointment booking
    if (bookAppointment) {
      // Pre-fill vaccination booking for this pet
      navigate('/user/appointments/new', {
        state: {
          prefill: {
            petId,
            serviceType: 'vet',
            serviceId: 'vet2', // our mapping uses vet2 -> Vaccination in UserBookAppointment
            reason: 'Vaccination',
          },
        },
      });
    }

    // Close modal
    handleCloseVaccination();
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaPaw className="text-2xl" style={{ color: '#145ae6' }} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">My Pets</h1>
            </div>
            <p className="text-gray-500 mt-1">Manage your pet profiles and health records</p>
          </div>
          <button
            onClick={() => navigate('/user/pets/add')}
            className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            style={{ backgroundColor: '#145ae6' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0f4bc7'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#145ae6'}
          >
            <FaPlus />
            Add New Pet
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search pets by name or breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-gray-300"
                style={{ '--tw-ring-color': '#145ae6' }}
                onFocus={(e) => e.target.style.borderColor = '#145ae6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-gray-300"
                style={{ '--tw-ring-color': '#145ae6' }}
                onFocus={(e) => e.target.style.borderColor = '#145ae6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="all">All Pets</option>
                <option value="dog">Dogs</option>
                <option value="cat">Cats</option>
                <option value="bird">Birds</option>
                <option value="rabbit">Rabbits</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : filteredPets.length > 0 ? (
          <div className="pet-grid grid">
            {filteredPets.map((pet) => (
              <div key={pet.id} className="pet-card">
                <div className="pet-card-image">
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (e.currentTarget.dataset.refreshed) return;
                      e.currentTarget.dataset.refreshed = '1';
                      refreshImage(pet.id, pet.imagePath);
                    }}
                  />

                  <div className="absolute bottom-2 right-2">
                    <input
                      id={`pet-upload-${pet.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (file) uploadPetImage(pet.id, file);
                        // reset input so selecting same file again still triggers change
                        e.target.value = '';
                      }}
                    />
                    <label
                      htmlFor={`pet-upload-${pet.id}`}
                      className="cursor-pointer bg-white/90 hover:bg-white text-xs font-medium px-2 py-1 rounded shadow"
                      style={{ color: '#145ae6' }}
                    >
                      Change Photo
                    </label>
                  </div>
                  <div className="absolute top-0 right-0 bg-white bg-opacity-90 m-2 px-2 py-1 rounded-lg text-sm font-medium text-gray-700">
                    {pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}
                  </div>
                </div>
                <div className="pet-card-content">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="pet-name">{pet.name}</h3>
                      <p className="pet-breed">{pet.breed}</p>
                      <p className="text-gray-500 text-sm">{pet.age}</p>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      <button
                        onClick={() => handleOpenMedicalRecords(pet)}
                        className="p-2 text-gray-500 transition-colors text-xs"
                        style={{ '--hover-color': '#145ae6' }}
                        onMouseEnter={(e) => e.target.style.color = '#145ae6'}
                        onMouseLeave={(e) => e.target.style.color = '#6b7280'}
                        title="Add Medical Record"
                      >
                        <FaFileMedical className="inline mr-1" /> Add Medical Record
                      </button>
                      <button
                        onClick={() => handleDeletePet(pet.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                      >
                        <FaTrash className="inline mr-1" /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FaHeart className={pet.healthStatus === 'Healthy' ? 'text-green-500' : 'text-yellow-500'} />
                      <span className="pet-info-text">{pet.healthStatus}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt style={{ color: '#145ae6' }} />
                      <span className="pet-info-text">Last checkup: {new Date(pet.lastCheckup).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="pet-card-buttons">
                    <button 
                      onClick={() => handleOpenMedicalRecords(pet)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: '#e3f2fd', 
                        color: '#145ae6' 
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#bbdefb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#e3f2fd'}
                    >
                      Add Medical Record
                    </button>
                    <button 
                      onClick={() => navigate('/user/appointments/new')}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ 
                        backgroundColor: '#e3f2fd', 
                        color: '#145ae6' 
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#bbdefb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#e3f2fd'}
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center" style={{ border: '1px solid #145ae6' }}>
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#e3f2fd' }}>
              <FaPaw className="text-2xl" style={{ color: '#145ae6' }} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No pets found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' 
                ? "No pets match your search criteria. Try adjusting your filters."
                : "You haven't added any pets yet. Add your first pet to get started!"}
            </p>
            <button 
              onClick={() => navigate('/user/pets/add')}
              className="text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              style={{ backgroundColor: '#145ae6' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0f4bc7'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#145ae6'}
            >
              <FaPlus />
              Add New Pet
            </button>
          </div>
        )}
      </div>

      {/* Medical Records Popup */}
      <MedicalRecordsPopup
        isOpen={showMedicalRecordsPopup}
        onClose={handleCloseMedicalRecords}
        petId={selectedPetForMedical?.id}
        petName={selectedPetForMedical?.name || 'your pet'}
        accessToken={accessToken}
      />

      {/* Vaccination Records Popup */}
      <VaccinationRecordsPopup
        isOpen={showVaccinationPopup}
        onClose={handleCloseVaccination}
        onSubmit={handleSubmitVaccinations}
        petName={selectedPetForVaccination?.name || 'your pet'}
        petType={selectedPetForVaccination?.type || 'dog'}
      />
    </UserLayout>
  );
};

export default UserPets;