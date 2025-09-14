import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaPaw, FaPlus, FaArrowRight, FaCalendarAlt, FaWeight, FaBirthdayCake, FaVenus, FaMars, FaHeart, FaEye, FaCalendarPlus } from 'react-icons/fa';
import { PetIcon } from '../layout/PetIcons';
import { useAuth } from '../../context/AuthContext';
const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const PetProfiles = () => {
  const { currentUser, tokens } = useAuth();
  const accessToken = tokens?.access?.token;

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshedRef = useRef(new Set());

  const refreshImageUrl = async (petId, imagePath) => {
    if (!imagePath || refreshedRef.current.has(petId)) return null;
    try {
      const qs = new URLSearchParams({ bucket: 'pets-photos', path: imagePath, expiresIn: String(60 * 60 * 24 * 6) }).toString();
      const urlRes = await fetch(`${API_URL}/media/signed-url?${qs}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const urlPayload = await urlRes.json().catch(() => ({}));
      if (urlRes.ok && urlPayload?.url) {
        refreshedRef.current.add(petId);
        return urlPayload.url;
      }
    } catch {}
    return null;
  };

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
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
          age: '3 years',
          weight: '20 lbs',
          gender: 'female',
          birthday: new Date().toISOString().slice(0, 10),
          imagePath: p.pet_image || '',
          image: 'https://placehold.co/600x400?text=Pet',
          lastCheckup: new Date().toISOString().slice(0, 10),
          vaccinations: 'Unknown',
        }));
        // resolve signed URLs for private images
        const withUrls = await Promise.all(
          mapped.map(async (pet) => {
            if (!pet.imagePath) return pet;
            try {
              const qs = new URLSearchParams({ bucket: 'pets-photos', path: pet.imagePath, expiresIn: String(60 * 60 * 24 * 6) }).toString();
              const urlRes = await fetch(`${API_URL}/media/signed-url?${qs}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const urlPayload = await urlRes.json().catch(() => ({}));
              if (urlRes.ok && urlPayload?.url) return { ...pet, image: urlPayload.url };
            } catch {}
            return pet;
          })
        );
        setPets(withUrls);
      } catch (e) {
        setError(e.message || 'Failed to load pets');
        setPets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-pink-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaPaw className="text-pink-600" />
          My Pets
        </h2>
        <div className="flex gap-2">
          <Link 
            to="/user/pets/add"
            className="text-sm font-medium text-pink-600 hover:text-pink-700 flex items-center gap-1 px-3 py-1 bg-pink-50 rounded-full"
          >
            <FaPlus size={12} /> Add Pet
          </Link>
          <Link 
            to="/user/pets"
            className="text-sm font-medium text-pink-600 hover:text-pink-700 flex items-center gap-1"
          >
            View All <FaArrowRight size={12} />
          </Link>
        </div>
      </div>
      
      <div className="pet-grid grid">
        {pets.map((pet) => {
          // Determine health status for styling
          const healthStatus = pet.healthStatus === 'Healthy' ? 'healthy' : 
                             pet.healthStatus === 'Needs Attention' ? 'needs-attention' : 'critical';
          
          return (
            <div 
              key={pet.id}
              className="pet-card group"
            >
              <div className="pet-card-image">
                <img 
                  src={pet.image} 
                  alt={pet.name} 
                  className="w-full h-full object-cover"
                  onError={async (e) => {
                    const newUrl = await refreshImageUrl(pet.id, pet.imagePath);
                    if (newUrl) {
                      setPets((prev) => prev.map((p) => (p.id === pet.id ? { ...p, image: newUrl } : p)));
                    }
                  }}
                />

                {/* Health Status Indicator */}
                <div className={`pet-status-indicator pet-status-${healthStatus}`}>
                  <FaHeart className="inline mr-1" />
                  {pet.healthStatus || 'Healthy'}
                </div>

                {/* Pet Type Badge */}
                <div className={`pet-type-badge pet-type-${pet.type}`}>
                  <PetIcon type={pet.type} className="inline mr-1" />
                  {pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}
                </div>
              </div>
              
              <div className="pet-card-content">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex-1 min-w-0">
                    <h3 className="pet-name">{pet.name}</h3>
                    <p className="pet-breed">{pet.breed}</p>
                    <p className="pet-age mt-1">{pet.age}</p>
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
                
                <div className="pet-card-buttons">
                  <Link 
                    to={`/user/pets/${pet.id}`}
                    className="flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 bg-slate-700 text-white hover:bg-slate-800 hover:shadow-md hover:scale-105 text-center"
                  >
                    <FaEye className="inline mr-1.5" />
                    View Profile
                  </Link>
                  <Link 
                    to={`/user/appointments/new?petId=${pet.id}`}
                    className="flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:scale-105 text-center"
                  >
                    <FaCalendarPlus className="inline mr-1.5" />
                    Book Appointment
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Add Pet Card */}
        <Link 
          to="/user/pets/add"
          className="border border-dashed border-pink-300 rounded-lg flex flex-col items-center justify-center p-6 hover:bg-pink-50 transition-colors h-full"
        >
          <div className="bg-pink-100 rounded-full p-4 mb-4">
            <FaPlus className="text-pink-600 text-xl" />
          </div>
          <h3 className="font-semibold text-gray-800 text-lg">Add a New Pet</h3>
          <p className="text-sm text-gray-600 text-center mt-2">
            Add your pet's profile to manage their health records and appointments
          </p>
        </Link>
      </div>
    </div>
  );
};

export default PetProfiles;