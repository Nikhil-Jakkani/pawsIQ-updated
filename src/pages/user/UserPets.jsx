import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPaw, FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaHeart, FaCalendarAlt, FaUser, FaClipboardList, FaFileMedical, FaSyringe, FaBirthdayCake, FaWeight, FaMars, FaVenus, FaCamera, FaEye, FaCalendarPlus } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import MedicalRecordsPopup from '../../components/user/MedicalRecordsPopup';
import VaccinationRecordsPopup from '../../components/user/VaccinationRecordsPopup';
import { PetIcon } from '../../components/layout/PetIcons';
const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserPets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { currentUser, authFetch, loading: authLoading } = useAuth();

  const [pets, setPets] = useState([]);
  // Loading state removed; pets are rendered instantly from cache
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

  // Cache key for storing user's pets for instant paint on refresh
  const petsCacheKey = React.useMemo(() => {
    if (!currentUser) return null;
    const uid = currentUser.id || currentUser.user_id || currentUser.email || 'me';
    return `pawsiq:pets:${uid}`;
  }, [currentUser]);

  // Hydrate pets from cache on component mount (instant paint)
  useEffect(() => {
    if (!petsCacheKey) return;
    try {
      const raw = localStorage.getItem(petsCacheKey);
      if (raw) {
        const cachedPets = JSON.parse(raw);
        if (Array.isArray(cachedPets) && cachedPets.length) {
          const sanitized = cachedPets
            .filter((p) => (p.status || '').toLowerCase() !== 'inactive')
            .map((p) => {
              const badLegacy = typeof p.image === 'string' && /\/user\/\d+\/pet\/\d+\//.test(p.image);
              return { ...p, image: badLegacy ? (p.profileImage || 'https://placehold.co/600x400?text=Pet') : p.image };
            });
          const sorted = [...sanitized].sort((a, b) => {
            const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return da - db;
          });
          setPets(sorted);
        }
      }
    } catch (e) {
      console.warn('Failed to read cached pets', e);
    }
  }, [petsCacheKey]);

  const imageCacheRef = useRef(new Map());

  // Refresh a pet image URL with proper error handling and caching
  const refreshImage = useCallback(async (petId, path) => {
    if (!path || !authFetch) return false;
    
    try {
      const qs = new URLSearchParams({ 
        bucket: 'pets-photos', 
        path, 
        expiresIn: String(60 * 60 * 24 * 6) // 6 days expiry
      }).toString();
      
      const urlRes = await authFetch(`${API_URL}/media/signed-url?${qs}`, {
        headers: { 'Cache-Control': 'no-cache' },
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
  }, [authFetch, API_URL]);

  const getSignedUrlForPath = async (path) => {
    if (!path) return null;
    const cached = imageCacheRef.current.get(path);
    const now = Date.now();
    if (cached && cached.expiry > now) return cached.url;

    const expiresInSec = 60 * 60 * 24 * 6; // 6 days
    try {
      const qs = new URLSearchParams({ bucket: 'pets-photos', path, expiresIn: String(expiresInSec) }).toString();
      const urlRes = await authFetch(`${API_URL}/media/signed-url?${qs}`);
      const urlPayload = await urlRes.json().catch(() => ({}));
      if (urlRes.ok && urlPayload?.url) {
        const expiry = now + expiresInSec * 1000;
        imageCacheRef.current.set(path, { url: urlPayload.url, expiry });
        // persist image cache
        try {
          const obj = {};
          imageCacheRef.current.forEach((val, key) => { obj[key] = val; });
          localStorage.setItem('petImageUrlCache', JSON.stringify(obj));
        } catch {}
        return urlPayload.url;
      }
    } catch (error) {
      console.error('Failed to fetch signed URL:', error);
    }
    return null;
  };

  // Fast synchronous cache read for image URLs (no network)
  const getCachedUrlIfFresh = (path) => {
    if (!path) return null;
    const now = Date.now();
    const cached = imageCacheRef.current.get(path);
    if (cached && cached.expiry > now && cached.url) return cached.url;
    return null;
  };

  // Fetch pets with loading and error states
  useEffect(() => {
    if (authLoading || !currentUser) return;

    const fetchPets = async () => {
      // setIsLoading(true); // loading removed
      setError(null);
      
      try {
        const userId = Number(currentUser?.user_id ?? currentUser?.id);
        if (!userId) throw new Error('Missing user id');
        const res = await authFetch(`${API_URL}/pets/user/${userId}`);
        const payload = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error((payload && payload.message) || 'Failed to load pets');

        const arr = Array.isArray(payload) ? payload : (payload?.pets || []);
        // Phase 1: map pet data using cached image URLs for instant paint
        let rawPets = arr
          .filter((p) => (p.status || '').toLowerCase() !== 'inactive')
          .map((p) => {
          const imagePath = p.pet_image || p.imagePath || '';
          const cachedUrl = getCachedUrlIfFresh(imagePath);
          const ageText = p.pet_birth_dtm
            ? (() => {
                const dob = new Date(p.pet_birth_dtm);
                const now = new Date();
                const years = Math.max(0, Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
                return `${years} years`;
              })()
            : (typeof p.age === 'number' ? `${p.age} years` : (p.pet_age != null ? `${p.pet_age} years` : 'Unknown'));

          return {
            id: Number(p.id || p.pet_id),
            name: p.name || p.pet_name || 'Pet',
            type: (p.type || p.pet_type || '').toString().toLowerCase(),
            breed: p.breed || p.pet_breed || '',
            age: ageText,
            weight: (p.weight || (p.pet_weight != null ? `${p.pet_weight} lbs` : 'Unknown')),
            gender: (p.gender || p.pet_gender || ''),
            birthday: p.birthday || p.pet_birth_dtm || p.pet_birthday || null,
            createdAt: p.createdAt || p.created_at || null,
            imagePath,
            image: cachedUrl || p.profileImage || p.image || 'https://placehold.co/600x400?text=Pet',
            lastCheckup: p.lastCheckup || p.last_checkup || new Date().toISOString().slice(0, 10),
            vaccinations: p.vaccinations || 'Unknown',
          };
        });

        // Enforce oldest-first order
        rawPets = rawPets.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return da - db;
        });

        // Paint immediately with cached/placeholder images
        setPets(rawPets);
        // Persist for instant paint on next load
        if (petsCacheKey) {
          try { localStorage.setItem(petsCacheKey, JSON.stringify(rawPets)); } catch {}
        }

        // Phase 2: fetch missing fresh signed URLs in background and patch state
        const missing = rawPets.filter((p) => p.imagePath && !getCachedUrlIfFresh(p.imagePath));
        if (missing.length) {
          missing.forEach(async (p) => {
            const url = await getSignedUrlForPath(p.imagePath);
            if (url) {
              setPets((prev) => prev.map((x) => (x.id === p.id ? { ...x, image: url } : x)));
              // Update persisted snapshot as well
              if (petsCacheKey) {
                try {
                  const snapshot = JSON.parse(localStorage.getItem(petsCacheKey) || '[]');
                  const updated = snapshot.map((x) => (x.id === p.id ? { ...x, image: url } : x));
                  localStorage.setItem(petsCacheKey, JSON.stringify(updated));
                } catch {}
              }
            }
          });
        }

      } catch (e) {
        console.error('Failed to load pets:', e);
        setError(e.message || 'An error occurred while loading pets');
        setPets([]);
      } finally {
        // setIsLoading(false); // loading removed
      }
    };

    fetchPets();
  }, [authLoading, currentUser, authFetch, API_URL, petsCacheKey]);

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
  const handleDeletePet = async (id) => {
    if (!window.confirm('Are you sure you want to remove this pet?')) {
      return;
    }

    try {
      const response = await authFetch(`${API_URL}/pets/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to delete pet');
      }

      setPets(pets.filter((pet) => pet.id !== id));
    } catch (error) {
      console.error('Error deleting pet:', error);
      alert('Failed to delete pet. Please try again.');
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
      const res = await authFetch(`${API_URL}/media/signed-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: 'pets-photos', entity: 'pet', entity_id: petId, file_ext: ext }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to get signed upload');

      const { path, token } = payload;
      // 2) upload to storage via signed URL token
      const { error: upErr } = await supabase.storage.from('pets-photos').uploadToSignedUrl(path, token, file);
      if (upErr) throw upErr;

      // 3) update pet image path on backend
      const upd = await authFetch(`${API_URL}/pets/${petId}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      const updPayload = await upd.json().catch(() => ({}));
      if (!upd.ok) throw new Error(updPayload?.message || 'Failed to update pet');

      // 4) get a signed view url and update UI
      const qs = new URLSearchParams({ bucket: 'pets-photos', path, expiresIn: String(60 * 60 * 24 * 6) }).toString();
      const urlRes = await authFetch(`${API_URL}/media/signed-url?${qs}`);

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

  const handleSubmitVaccinations = async ({ entries, createReminder, bookAppointment }) => {
    if (!selectedPetForVaccination || !currentUser) {
      throw new Error('Missing pet information or authentication');
    }

    const petId = selectedPetForVaccination.id;

    try {
      const batchPayload = {
        entries: entries.map((e) => ({
          vaccineName: e.vaccineName,
          recordDate: e.recordDate,
          nextDueDate: e.nextDueDate || null,
          notes: e.notes || '',
        })),
      };
      const batchRes = await authFetch(`${API_URL}/vaccines/pets/${petId}/vaccinations/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchPayload),
      });
      const batchJson = await batchRes.json().catch(() => ({}));
      if (!batchRes.ok) throw new Error(batchJson?.message || 'Failed to save vaccinations');
    } catch (err) {
      console.error('Vaccination batch save failed:', err);
      throw err;
    }

    for (const entry of entries) {
      if (!entry.file) continue;
      try {
        const basePayload = {
          recordType: 'vaccination',
          title: entry.vaccineName,
          description: entry.notes || '',
          recordDate: entry.recordDate,
          nextDueDate: entry.nextDueDate || null,
        };

        const res = await authFetch(`${API_URL}/pets/${petId}/health-records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(basePayload),
        });
        const created = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(created?.message || 'Failed to create vaccination health record');

        const up = await authFetch(`${API_URL}/pets/${petId}/health-records/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: entry.file.name, fileType: entry.file.type }),
        });
        const upPayload = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(upPayload?.message || 'Failed to get upload URL');
        const { signedUrl, path } = upPayload;
        const put = await fetch(signedUrl, { method: 'PUT', body: entry.file, headers: { 'Content-Type': entry.file.type } });
        if (!put.ok) throw new Error('File upload failed');

        await authFetch(`${API_URL}/health-records/${created.id}/file`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: path,
            fileName: entry.file.name,
            fileType: entry.file.type,
            fileSize: entry.file.size,
          }),
        });
      } catch (e) {
        console.warn('Failed to upload vaccination document:', e);
      }
    }

    for (const entry of entries) {
      if (!createReminder || !entry.nextDueDate) continue;
      try {
        const r = await authFetch(`${API_URL}/reminders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      } catch (e) {
        console.warn('Reminder creation failed:', e);
      }
    }

    if (bookAppointment) {
      navigate('/user/appointments/new', {
        state: {
          prefill: {
            petId,
            serviceType: 'vet',
            serviceId: 'vet2',
            reason: 'Vaccination',
          },
        },
      });
    }

    handleCloseVaccination();
  };

  const handleSubmitMedicalRecord = async (recordData) => {
    if (!selectedPetForMedical || !currentUser) {
      throw new Error('Missing pet information or authentication');
    }

    try {
      const response = await authFetch(`${API_URL}/pets/${selectedPetForMedical.id}/health-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: recordData.title,
          recordDate: recordData.recordDate,
          description: recordData.description,
          recordType: 'medical_condition',
          conditions: recordData.conditions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create medical record');
      }

      const createdRecord = await response.json();

      if (recordData.files && recordData.files.length > 0) {
        for (const file of recordData.files) {
          try {
            const uploadUrlResponse = await authFetch(`${API_URL}/pets/${selectedPetForMedical.id}/health-records/upload-url`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
              }),
            });

            if (uploadUrlResponse.ok) {
              const { signedUrl, path } = await uploadUrlResponse.json();
              
              const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                  'Content-Type': file.type,
                },
              });

              if (uploadResponse.ok) {
                await authFetch(`${API_URL}/health-records/${createdRecord.id}/file`, {
                  method: 'PUT',
                  headers: {
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
          }
        }
      }      
    } catch (error) {
      console.error('Error creating medical record:', error);
      throw error;
    }

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
                placeholder="Search pets by name or breed"
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
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {error ? (
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
            {filteredPets.map((pet) => {
              // Determine health status for styling
              const healthStatus = pet.healthStatus === 'Healthy' ? 'healthy' : 
                                 pet.healthStatus === 'Needs Attention' ? 'needs-attention' : 'critical';
              
              return (
                <div key={pet.id} className="pet-card group" style={{ backgroundColor: 'white', color: 'black' }}>
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

                    {/* Health Status Indicator */}
                    <div className={`pet-status-indicator pet-status-${healthStatus}`}>
                      <FaHeart className="inline mr-1" />
                      {pet.healthStatus}
                    </div>

                    {/* Pet Type Badge */}
                    <div className={`pet-type-badge pet-type-${pet.type}`}>
                      <PetIcon type={pet.type} className="inline mr-1" />
                      {pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="pet-quick-actions">
                      <button
                        onClick={() => navigate(`/user/pets/edit/${pet.id}`)}
                        className="pet-quick-btn pet-quick-btn-edit"
                        title="Edit Pet Profile"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        onClick={() => navigate(`/user/pets/${pet.id}/health-records`)}
                        className="pet-quick-btn pet-quick-btn-medical"
                        title="Medical Records"
                      >
                        <FaFileMedical className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleOpenVaccination(pet)}
                        className="pet-quick-btn"
                        title="Add Vaccination"
                      >
                        <FaSyringe className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDeletePet(pet.id)}
                        className="pet-quick-btn pet-quick-btn-delete"
                        title="Delete Pet"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>

                    {/* Change Photo Button */}
                    <div className="absolute bottom-3 left-3">
                      <input
                        id={`pet-upload-${pet.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (file) uploadPetImage(pet.id, file);
                          e.target.value = '';
                        }}
                      />
                      <label
                        htmlFor={`pet-upload-${pet.id}`}
                        className=" bg-white/90  text-xs font-medium px-3 py-2 rounded-full shadow-lg backdrop-filter backdrop-blur-sm"
                        style={{ color: '#145ae6' }}
                      >
                        <FaCamera className="inline mr-1" /> Change Photo
                      </label>
                    </div>
                  </div>

                  <div className="pet-card-content">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex-1 min-w-0">
                      <h3 className="pet-name">{pet.name}</h3>
                      <p className="pet-breed">{pet.breed}</p>
                      <p className="pet-age ">{pet.age}</p>
                    </div>
                  </div>

                    {/* Enhanced Info Grid */}
                    <div className="pet-info-grid">
                      <div className="pet-info-item">
                        <FaBirthdayCake className="pet-info-icon" />
                        <span>{pet.age}</span>
                      </div>
                      <div className="pet-info-item">
                        <FaWeight className="pet-info-icon" />
                        <span>{pet.weight}</span>
                      </div>
                      <div className="pet-info-item">
                        {pet.gender === 'male' ? (
                          <FaMars className="pet-info-icon" />
                        ) : (
                          <FaVenus className="pet-info-icon" />
                        )}
                        <span>{pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}</span>
                      </div>
                      <div className="pet-info-item">
                        <FaCalendarAlt className="pet-info-icon" />
                        <span className="truncate">{new Date(pet.lastCheckup).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="pet-card-buttons flex justify-center">
                      <button 
                        onClick={() => navigate(`/user/pets/${pet.id}`)}
                        className="px-4 py-2.5 rounded-lg text-xs font-medium -all duration-200 bg-white-700 text-gray " style={{ color: 'white' }}
                      >
                        <FaEye className="inline mr-2" />
                         View Profile
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
        authFetch={authFetch}
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