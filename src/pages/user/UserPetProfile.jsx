import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPaw, FaArrowLeft, FaCalendarAlt, FaUser, FaEdit, FaFileMedical } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserPetProfile = () => {
  const navigate = useNavigate();
  const { petId } = useParams();
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pet, setPet] = useState(null);

  useEffect(() => {
    if (!authFetch || !petId) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // Try direct endpoint first
        let res = await authFetch(`${API_URL}/pets/${petId}`);
        let data;
        if (res.ok) {
          data = await res.json();
        } else {
          // Fallback: fetch from user profile list
          const profRes = await authFetch(`${API_URL}/user/profile`);
          const prof = await profRes.json().catch(() => ({}));
          if (!profRes.ok) throw new Error('Failed to load pet');
          const list = Array.isArray(prof?.pets) ? prof.pets : [];
          const idNum = Number(petId);
          data = list.find((p) => Number(p.pet_id ?? p.id) === idNum);
          if (!data) throw new Error('Pet not found');
        }

        const normalized = {
          id: Number(data.pet_id ?? data.id ?? petId),
          name: data.pet_name ?? data.name ?? 'Pet',
          type: (data.pet_type ?? data.type ?? '').toLowerCase(),
          breed: data.pet_breed ?? data.breed ?? '',
          gender: data.pet_gender ?? data.gender ?? '',
          birthdate: (data.pet_birth_dtm ?? data.birthdate ?? ''),
          weight: data.pet_weight ?? data.weight ?? '',
          color: data.pet_colour ?? data.color ?? '',
          imagePath: data.pet_image || '',
          ageGroup: data.age_group ?? data.ageGroup ?? '',
        };
        setPet(normalized);
      } catch (e) {
        console.error('Failed to load pet profile:', e);
        setError(e.message || 'Failed to load pet');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authFetch, petId]);

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pet profile...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/user/pets')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft /> Back
          </button>
          <div>
            <div className="flex items-center gap-3">
              <img src="/7.png" alt="PawsIQ Logo" className="w-8 h-8 rounded-full object-cover" />
              <h1 className="text-2xl font-bold text-gray-900">Pet Profile</h1>
            </div>
            <p className="text-gray-500 mt-1">View your pet's information</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {pet && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Card header with image and quick actions */}
            <div className="p-6">
              <div className="flex items-start gap-5">
                <div className="w-24 h-24 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                  {pet.imagePath ? (
                    <img src={pet.imagePath} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <FaPaw className="text-gray-400 text-4xl" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">{pet.name}</h2>
                      <p className="text-gray-500">{pet.breed || 'Unknown breed'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/user/pets/edit/${pet.id}`)}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
                      >
                        <FaEdit className="inline mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => navigate(`/user/pets/${pet.id}/health-records`)}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
                      >
                        <FaFileMedical className="inline mr-1" /> Health Records
                      </button>
                    </div>
                  </div>

                  {/* Key facts row */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Type</div>
                      <div className="text-gray-900 font-medium capitalize">{pet.type || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Gender</div>
                      <div className="text-gray-900 font-medium capitalize">{pet.gender || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Birth Date</div>
                      <div className="text-gray-900 font-medium flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-400" />
                        {pet.birthdate ? String(pet.birthdate).split('T')[0] : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Weight</div>
                      <div className="text-gray-900 font-medium">{pet.weight ? `${pet.weight} kg` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Color</div>
                      <div className="text-gray-900 font-medium">{pet.color || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Age Group</div>
                      <div className="text-gray-900 font-medium capitalize">{pet.ageGroup || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default UserPetProfile;
