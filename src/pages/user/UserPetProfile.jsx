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
            className="p-2 bg-white rounded-full shadow-sm border border-gray-200 text-gray-500 hover:text-pink-600 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-pink-100 p-2 rounded-lg">
                <FaPaw className="text-pink-600 text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Pet Profile</h1>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{pet.name}</h2>
                  <p className="text-gray-500">{pet.breed || 'Unknown breed'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/user/pets/edit/${pet.id}`)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: '#145ae6' }}
                  >
                    <FaEdit className="inline mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => navigate(`/user/pets/${pet.id}/health-records`)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: '#6b7280' }}
                  >
                    <FaFileMedical className="inline mr-1" /> Health Records
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Type</div>
                  <div className="text-gray-900 font-medium capitalize">{pet.type || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Gender</div>
                  <div className="text-gray-900 font-medium capitalize">{pet.gender || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Birth Date</div>
                  <div className="text-gray-900 font-medium flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-400" />
                    {pet.birthdate ? String(pet.birthdate).split('T')[0] : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Weight</div>
                  <div className="text-gray-900 font-medium">{pet.weight ? `${pet.weight} kg` : '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Color</div>
                  <div className="text-gray-900 font-medium">{pet.color || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Age Group</div>
                  <div className="text-gray-900 font-medium capitalize">{pet.ageGroup || '-'}</div>
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
