import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPaw, FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaHeart, FaCalendarAlt, FaUser, FaClipboardList, FaFileMedical } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserPets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { currentUser } = useAuth();
  const accessToken = currentUser?.tokens?.access?.token;
  const [pets, setPets] = useState([]);

  // Determine current view based on route
  const getCurrentView = () => {
    if (location.pathname.includes('/profiles')) return 'profiles';
    if (location.pathname.includes('/health')) return 'health';
    return 'overview';
  };

  // Refresh a pet image URL once if it fails (likely expired signed URL)
  const refreshImage = async (petId, path) => {
    if (!path) return;
    try {
      const qs = new URLSearchParams({ bucket: 'pets-photos', path, expiresIn: String(60 * 60 * 24 * 6) }).toString();
      const urlRes = await fetch(`${API_URL}/media/signed-url?${qs}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const urlPayload = await urlRes.json().catch(() => ({}));
      const signedUrl = urlPayload?.url;
      if (signedUrl) {
        setPets((prev) => prev.map((p) => (p.id === petId ? { ...p, image: signedUrl } : p)));
      }
    } catch (e) {
      // ignore; UI keeps previous image or placeholder
    }
  };



  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to load pets');
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
        setPets(mapped);
        // Resolve signed URLs for any stored image paths
        const withUrls = await Promise.all(
          mapped.map(async (pet) => {
            if (!pet.imagePath) return pet;
            try {
              const qs = new URLSearchParams({ bucket: 'pets-photos', path: pet.imagePath, expiresIn: String(60 * 60 * 24 * 6) }).toString();
              const urlRes = await fetch(`${API_URL}/media/signed-url?${qs}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const urlPayload = await urlRes.json().catch(() => ({}));
              if (urlRes.ok && urlPayload?.url) {
                return { ...pet, image: urlPayload.url };
              }
            } catch (error) {
              console.error('Failed to load pet image:', error);
            }
            return pet;
          })
        );
        setPets(withUrls);
      } catch (e) {
        console.error('Failed to load pets:', e);
        setPets([]);
      }
    })();
  }, [accessToken]);

  // Filter pets based on search term and filter type
  const filteredPets = pets.filter((pet) => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) || pet.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || pet.type === filterType;
    return matchesSearch && matchesFilter;
  });

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

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-pink-100 p-2 rounded-lg">
                <FaPaw className="text-pink-600 text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">My Pets</h1>
            </div>
            <p className="text-gray-500 mt-1">Manage your pet profiles and health records</p>
          </div>
          <button
            onClick={() => navigate('/user/pets/add')}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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

        {/* Pet Cards */}
        {filteredPets.length > 0 ? (
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
                      className="cursor-pointer bg-white/90 hover:bg-white text-pink-600 text-xs font-medium px-2 py-1 rounded shadow"
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
                        onClick={() => navigate(`/user/pets/edit/${pet.id}`)}
                        className="p-2 text-gray-500 hover:text-pink-600 transition-colors text-xs"
                        title="Edit Pet"
                      >
                        <FaFileMedical className="inline mr-1" /> Health Records
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
                      <FaCalendarAlt className="text-pink-500" />
                      <span className="pet-info-text">Last checkup: {new Date(pet.lastCheckup).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="pet-card-buttons">
                    <button 
                      onClick={() => navigate(`/user/pets/health/${pet.id}`)}
                      className="flex-1 bg-pink-100 hover:bg-pink-200 text-pink-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Health Records
                    </button>
                    <button 
                      onClick={() => navigate('/user/appointments/new')}
                      className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center border border-pink-200">
            <div className="bg-pink-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
              <FaPaw className="text-pink-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No pets found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' 
                ? "No pets match your search criteria. Try adjusting your filters."
                : "You haven't added any pets yet. Add your first pet to get started!"}
            </p>
            <button 
              onClick={() => navigate('/user/pets/add')}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <FaPlus />
              Add New Pet
            </button>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default UserPets;