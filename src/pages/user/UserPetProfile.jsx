import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPaw, FaArrowLeft, FaCalendarAlt, FaEdit, FaFileMedical, FaSave, FaTimes, FaCheckCircle, FaTimesCircle, FaMicrochip, FaWeight, FaPalette, FaBirthdayCake, FaVenusMars, FaExclamationTriangle, FaStethoscope, FaPills, FaUtensils, FaUserMd, FaStickyNote, FaCopy, FaTrash, FaCamera, FaPlus } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
const sectionTitleCls = 'text-base font-semibold text-gray-900';
const sectionDescCls = 'text-sm text-gray-500';

const UserPetProfile = () => {
  const navigate = useNavigate();
  const { petId } = useParams();
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Extra lists
  const [vaccinations, setVaccinations] = useState([]);
  const [allergiesList, setAllergiesList] = useState([]);
  const [conditionsList, setConditionsList] = useState([]);
  const [pet, setPet] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  // Basic form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    breed: '',
    gender: '',
    birthdate: '',
    weight: '',
    color: '',
    bloodGroup: '',
    ageGroup: 'adult',
    microchipped: false,
    microchipNumber: '',
    neutered: false,
    medications: '',
    dietaryNeeds: '',
    vetName: '',
    vetPhone: '',
    notes: '',
    vaccinations: [],
  });

  // Health options from backend (with fallback)
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [allergiesOptions, setAllergiesOptions] = useState([]);
  const [medicalConditionsOptions, setMedicalConditionsOptions] = useState([]);

  // Selected health info
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [customAllergies, setCustomAllergies] = useState('');
  const [selectedMedicalConditions, setSelectedMedicalConditions] = useState([]);
  const [customMedicalConditions, setCustomMedicalConditions] = useState('');

  // Fallback lists (aligned with UserEditPet.jsx)
  const fallbackAllergies = [
    'Food allergies (chicken, beef, dairy, grains)',
    'Environmental allergies (pollen, dust mites, mold)',
    'Flea allergies',
    'Contact allergies (shampoos, fabrics, cleaning products)',
    'Seasonal allergies',
    'Medication allergies (antibiotics, vaccines)',
    'Insect bite allergies',
    'Grass allergies',
    'Tree pollen allergies',
    'Wheat/grain allergies',
    'Soy allergies',
    'Egg allergies',
    'Fish allergies',
    'Preservative allergies',
  ];

  const fallbackMedicalConditions = [
    'Arthritis',
    'Hip dysplasia',
    'Heart disease',
    'Diabetes',
    'Kidney disease',
    'Liver disease',
    'Epilepsy/Seizures',
    'Skin conditions (dermatitis, eczema)',
    'Eye conditions (cataracts, glaucoma)',
    'Ear infections (chronic)',
    'Dental disease',
    'Obesity',
    'Thyroid disorders',
    'Cancer',
    'Respiratory issues (asthma, bronchitis)',
    'Digestive issues (IBD, pancreatitis)',
    'Urinary tract issues',
    'Behavioral issues (anxiety, aggression)',
    'Mobility issues',
  ];

  const fetchHealthOptions = async () => {
    // Use fallbacks directly; backend metadata endpoints are not implemented.
    setLoadingMeta(true);
    try {
      setAllergiesOptions(fallbackAllergies);
      setMedicalConditionsOptions(fallbackMedicalConditions);
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleVaccinationChange = (index, field, value) => {
    setFormData((prev) => {
      const list = [...(prev.vaccinations || [])];
      list[index] = { ...(list[index] || {}), [field]: value };
      return { ...prev, vaccinations: list };
    });
  };

  const addVaccinationRow = () => {
    setFormData((prev) => ({
      ...prev,
      vaccinations: [...(prev.vaccinations || []), { vaccination_name: '', vaccine_given_date: '', vaccine_due_date: '', vaccine_status: '' }],
    }));
  };

  const removeVaccinationRow = (index) => {
    setFormData((prev) => {
      const list = [...(prev.vaccinations || [])];
      list.splice(index, 1);
      return { ...prev, vaccinations: list };
    });
  };

  useEffect(() => {
    const combined = [...selectedAllergies];
    if (customAllergies.trim()) combined.push(customAllergies.trim());
    setAllergiesList(combined);
  }, [selectedAllergies, customAllergies]);

  useEffect(() => {
    const combined = [...selectedMedicalConditions];
    if (customMedicalConditions.trim()) combined.push(customMedicalConditions.trim());
    setConditionsList(combined);
  }, [selectedMedicalConditions, customMedicalConditions]);
  
  useEffect(() => {
    if (!authFetch || !petId) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch pet data
        let res = await authFetch(`${API_URL}/pets/${petId}`);

        let data;
        if (res.ok) {
          data = await res.json();
        } else {
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
          birthdate: data.pet_birth_dtm ?? data.birthdate ?? '',
          weight: data.pet_weight ?? data.weight ?? '',
          color: data.pet_colour ?? data.color ?? '',
          bloodGroup: data.pet_blood_grp ?? data.bloodGroup ?? '',
          imagePath: data.pet_image || '',
          ageGroup: data.age_group ?? data.ageGroup ?? 'adult',
          microchipped: !!data.microchipped,
          microchipNumber: data.microchip_number || '',
          neutered: !!data.neutered,
          allergies:
            typeof data.allergies === 'string'
              ? data.allergies
              : Array.isArray(data.allergies)
              ? data.allergies.join(', ')
              : '',
          otherAllergies: data.other_allergies || '',
          medicalConditions:
            typeof data.medical_conditions === 'string'
              ? data.medical_conditions
              : Array.isArray(data.medical_conditions)
              ? data.medical_conditions.join(', ')
              : '',
          otherMedicalConditions: data.other_medical_conditions || '',
          medications: data.current_medications || data.medications || '',
          dietaryNeeds: data.dietary_needs || '',
          vetName: data.vet_name || '',
          vetPhone: data.vet_phone || '',
          notes: data.notes || '',
                  };

        setPet(normalized);
        // Initialize custom fields from consolidated data
        setCustomAllergies(normalized.otherAllergies || '');
        setCustomMedicalConditions(normalized.otherMedicalConditions || '');
        // Try to resolve signed URL for image if path exists
        try {
          if (normalized.imagePath) {
            const qs = new URLSearchParams({ bucket: 'pets-photos', path: normalized.imagePath, expiresIn: String(60 * 60 * 24 * 6) }).toString();
            const urlRes = await authFetch(`${API_URL}/media/signed-url?${qs}`);
            const urlPayload = await urlRes.json().catch(() => ({}));
            if (urlRes.ok && urlPayload?.url) {
              setImageUrl(urlPayload.url);
            } else {
              // if stored path is already a full URL, try using it
              if (/^https?:\/\//i.test(normalized.imagePath)) setImageUrl(normalized.imagePath);
              else setImageUrl('');
            }
          } else {
            setImageUrl('');
          }
        } catch (_) {
          setImageUrl('');
        }
        setFormData({
          name: normalized.name,
          type: normalized.type,
          breed: normalized.breed,
          gender: normalized.gender,
          birthdate: normalized.birthdate ? String(normalized.birthdate).split('T')[0] : '',
          weight: normalized.weight,
          color: normalized.color,
          bloodGroup: normalized.bloodGroup || '',
          ageGroup: normalized.ageGroup || 'adult',
          microchipped: normalized.microchipped,
          microchipNumber: normalized.microchipNumber,
          neutered: normalized.neutered,
          medications: normalized.medications,
          dietaryNeeds: normalized.dietaryNeeds,
          vetName: normalized.vetName,
          vetPhone: normalized.vetPhone,
          notes: normalized.notes,
        });

        // Initialize selected health info from pet strings
        const initAllergies = normalized.allergies
          ? normalized.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        if (normalized.otherAllergies) initAllergies.push(normalized.otherAllergies);
        const initMedical = normalized.medicalConditions
          ? normalized.medicalConditions.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        if (normalized.otherMedicalConditions) initMedical.push(normalized.otherMedicalConditions);
        setSelectedAllergies(initAllergies);
        setSelectedMedicalConditions(initMedical);
        // Fetch options
        await fetchHealthOptions();

        // Fetch vaccinations, allergies, conditions for this pet
        try {
          const [vRes, aRes, cRes] = await Promise.all([
            authFetch(`${API_URL}/vaccines/pets/${petId}/vaccinations`).catch(() => null),
            authFetch(`${API_URL}/pets/${petId}/allergies`).catch(() => null),
            authFetch(`${API_URL}/pets/${petId}/conditions`).catch(() => null),
          ]);
          if (vRes && vRes.ok) {
            const list = await vRes.json().catch(() => []);
            const vacList = Array.isArray(list) ? list : [];
            setVaccinations(vacList);
            // Also update formData with vaccinations
            setFormData(prev => ({ ...prev, vaccinations: vacList }));
          }
          if (aRes && aRes.ok) {
            const payload = await aRes.json().catch(() => ({}));
            // ✅ FIX: Properly separate selected (checkboxes) from custom (text input)
            const selected = Array.isArray(payload?.selected_allergies) ? payload.selected_allergies : [];
            const custom = payload?.other_allergies ? String(payload.other_allergies) : '';
            setSelectedAllergies(selected);
            setCustomAllergies(custom);
            // Merge and set the display list
            const mergedAllergies = [...selected];
            if (custom) mergedAllergies.push(custom);
            console.log('✅ Loaded Allergies from API:', { selected, custom });
          }
          if (cRes && cRes.ok) {
            const payload = await cRes.json().catch(() => ({}));
            // ✅ FIX: Properly separate selected (checkboxes) from custom (text input)
            const selected = Array.isArray(payload?.selected_conditions) ? payload.selected_conditions : [];
            const custom = payload?.other_conditions ? String(payload.other_conditions) : '';
            setSelectedMedicalConditions(selected);
            setCustomMedicalConditions(custom);
            // Merge and set the display list
            const mergedConditions = [...selected];
            if (custom) mergedConditions.push(custom);
            console.log('✅ Loaded Conditions from API:', { selected, custom });
          }        } catch (e) {
          console.warn('Failed to fetch health lists', e);
        }
      } catch (e) {
        console.error('Failed to load pet profile:', e);
        setError(e.message || 'Failed to load pet');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authFetch, petId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleSelection = (list, setList, item) => {
    setList((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Combine selected + custom entries
      const allAllergies = [...selectedAllergies];
      if (customAllergies.trim()) allAllergies.push(customAllergies.trim());

      const allMedical = [...selectedMedicalConditions];
      if (customMedicalConditions.trim()) allMedical.push(customMedicalConditions.trim());

      // Clean vaccinations - remove empty entries
      const cleanedVaccinations = (formData.vaccinations || [])
        .filter((v) => v.vaccination_name && v.vaccination_name.trim())
        .map((v) => ({
          vaccination_name: v.vaccination_name.trim(),
          vaccine_given_date: v.vaccine_given_date || '',
          vaccine_due_date: v.vaccine_due_date || '',
          vaccine_status: v.vaccine_status || '',
        }));

      // Build payload for new consolidated health tables (keep legacy fields too)
      const payload = {
        name: formData.name?.trim(),
        type: formData.type || undefined,
        breed: formData.breed || undefined,
        gender: formData.gender || undefined,
        birthdate: formData.birthdate || undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        color: formData.color || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        ageGroup: formData.ageGroup || undefined,
        microchipped: !!formData.microchipped,
        microchipNumber: formData.microchipNumber && formData.microchipNumber.toString().trim() ? formData.microchipNumber.toString() : undefined,
        neutered: !!formData.neutered,
        // Legacy strings for backward-compat
        allergies: allAllergies.length > 0 ? allAllergies.join(', ') : undefined,
        medicalConditions: allMedical.length > 0 ? allMedical.join(', ') : undefined,
        medications: formData.medications || undefined,
        dietaryNeeds: formData.dietaryNeeds || undefined,
        // New consolidated fields
        selected_allergies: selectedAllergies,
        other_allergies: customAllergies?.trim() || undefined,
        selected_conditions: selectedMedicalConditions,
        other_conditions: customMedicalConditions?.trim() || undefined,
        current_medications: formData.medications || undefined,
        dietary_needs: formData.dietaryNeeds || undefined,
        vetName: formData.vetName || undefined,
        vetPhone: formData.vetPhone || undefined,
        notes: formData.notes || undefined,
        vaccinations: cleanedVaccinations,
        region: 'India',
      };

      const res = await authFetch(`${API_URL}/pets/${petId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to update pet');

      // Refresh pet state and exit edit mode
      setPet((prev) => ({
        ...prev,
        ...formData,
        allergies: allAllergies.join(', '),
        medicalConditions: allMedical.join(', '),
      }));
      setIsEditing(false);
    } catch (e) {
      setError(e.message || 'Failed to update pet');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (pet) {
      setFormData({
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
        gender: pet.gender,
        birthdate: pet.birthdate ? String(pet.birthdate).split('T')[0] : '',
        weight: pet.weight,
        color: pet.color,
        bloodGroup: pet.bloodGroup || '',
        ageGroup: pet.ageGroup || 'adult',
        microchipped: !!pet.microchipped,
        microchipNumber: pet.microchipNumber || '',
        neutered: !!pet.neutered,
        medications: pet.medications || '',
        dietaryNeeds: pet.dietaryNeeds || '',
        vetName: pet.vetName || '',
        vetPhone: pet.vetPhone || '',
        notes: pet.notes || '',
      });
      const initAllergies = pet.allergies ? pet.allergies.split(',').map((s) => s.trim()).filter(Boolean) : [];
      const initMedical = pet.medicalConditions
        ? pet.medicalConditions.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      setSelectedAllergies(initAllergies);
      setSelectedMedicalConditions(initMedical);
      setCustomAllergies('');
      setCustomMedicalConditions('');
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!pet) return;
    const confirmed = window.confirm('Are you sure you want to delete this pet? This will archive the pet and can affect reminders.');
    if (!confirmed) return;
    try {
      setDeleting(true);
      const res = await authFetch(`${API_URL}/pets/${pet.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.message || 'Failed to delete pet');
      }
      navigate('/user/pets');
    } catch (e) {
      setError(e.message || 'Failed to delete pet');
    } finally {
      setDeleting(false);
    }
  };

  // Upload/change image
  const handleImageChange = async (e) => {
    try {
      if (!pet) return;
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        alert('Please upload a JPG, PNG, or WEBP image');
        return;
      }
      // 1) get signed upload
      const up = await authFetch(`${API_URL}/media/signed-upload`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: 'pets-photos', entity: 'pet', entity_id: pet.id, file_ext: ext })
      });
      const upJson = await up.json().catch(() => ({}));
      if (!up.ok) throw new Error(upJson?.message || 'Failed to get signed upload');
      const { path, token } = upJson;
      // 2) upload file to signed URL using Supabase client
      const { error: upErr } = await supabase.storage.from('pets-photos').uploadToSignedUrl(path, token, file);
      if (upErr) throw upErr;
      // 3) update pet image path on backend
      const upd = await authFetch(`${API_URL}/pets/${pet.id}/image`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) });
      const updJson = await upd.json().catch(() => ({}));
      if (!upd.ok) throw new Error(updJson?.message || 'Failed to update pet image');
      // 4) get signed URL for viewing
      const qs = new URLSearchParams({ bucket: 'pets-photos', path, expiresIn: String(60 * 60 * 24 * 6) }).toString();
      const urlRes = await authFetch(`${API_URL}/media/signed-url?${qs}`);
      const urlPayload = await urlRes.json().catch(() => ({}));
      if (urlRes.ok && urlPayload?.url) setImageUrl(urlPayload.url);
    } catch (err) {
      alert(err?.message || 'Failed to change photo');
    } finally {
      try { e.target.value = ''; } catch {}
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading pet profile...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className={`space-y-6 max-w-6xl mx-auto px-2 sm:px-4 ${isEditing ? 'pb-24' : ''}`}>
        {/* Top header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/user/pets')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-700 "
          >
            <FaArrowLeft /> Back
          </button>
          <div>
            <div className="flex items-center gap-3">
              <img src="/7.png" alt="PawsIQ Logo" className="h-8 w-8 rounded-full object-cover" />
              <h1 className="text-2xl font-bold text-gray-900">Pet Profile</h1>
              {isEditing && (
                <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Editing</span>
              )}
            </div>
            <p className="mt-1 text-gray-500">View and edit your pet's information</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {pet && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Card header */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                  {imageUrl || pet.imagePath ? (
                    <img src={imageUrl || pet.imagePath} alt={pet.name} className="h-full w-full object-cover" />
                  ) : (
                    <img src="/7.png" alt="Default Pet" className="h-full w-full object-cover" />
                  )}
                  {isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={() => { try { document.getElementById('petPhotoInput')?.click(); } catch (_) {} }}
                        className="absolute bottom-1 right-1 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-gray-700 shadow ring-1 ring-gray-300 hover:bg-white"
                        title="Change photo"
                      >
                        <FaEdit />
                      </button>
                      <input id="petPhotoInput" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-6">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">{pet.name}</h2>
                      <p className="text-gray-500">{pet.breed || 'Unknown breed'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition "
                        >
                          <FaEdit className="mr-1 inline" /> Edit
                        </button>
                      )}
                      {!isEditing && (
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                        >
                          <FaTrash className="mr-1 inline" /> Delete
                        </button>
                      )}
                      {!isEditing && (
                        <>
                          <button
                            onClick={() => navigate(`/user/pets/${pet.id}/health-records`)}
                            className="rounded-lg bg-gray-600 px-3 py-2 text-sm font-medium text-white transition "
                          >
                            <FaFileMedical className="mr-1 inline" /> Health Records
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* CONTENT */}
                  {!isEditing ? (
                    <div className="mt-6 space-y-8">
                      {/* Hero meta row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {pet.type && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200 capitalize">{pet.type}</span>}
                        {pet.gender && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200 capitalize">{pet.gender}</span>}
                        {pet.ageGroup && <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200 capitalize">{pet.ageGroup}</span>}
                        {pet.weight ? (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 whitespace-nowrap">{pet.weight} kg</span>
                        ) : null}
                        {pet.color ? (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 whitespace-nowrap">{pet.color}</span>
                        ) : null}
                        {pet.birthdate && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 whitespace-nowrap">
                            <FaCalendarAlt className="text-amber-500" /> {String(pet.birthdate).split('T')[0]}
                          </span>
                        )}
                        {pet.bloodGroup && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200 whitespace-nowrap">
                            <FaStethoscope className="text-red-500" /> {pet.bloodGroup}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                          <table className="min-w-full divide-y divide-gray-200">
                            <tbody className="bg-white divide-y divide-gray-200">
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Type</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.type || '-'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Gender</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.gender || '-'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Breed</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.breed || '-'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Birth Date</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.birthdate ? String(pet.birthdate).split('T')[0] : '-'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Weight</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.weight ? `${pet.weight} kg` : '-'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Color</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.color || '-'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Blood Group</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.bloodGroup || '-'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Age Group</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.ageGroup || '-'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Health Information</h3>
                          <table className="min-w-full divide-y divide-gray-200">
                            <tbody className="bg-white divide-y divide-gray-200">
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Microchipped</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.microchipped ? 'Yes' : 'No'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Microchip Number</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.microchipNumber || '-'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Neutered/Spayed</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.neutered ? 'Yes' : 'No'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Medications</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.medications || '-'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Dietary Needs</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.dietaryNeeds || '-'}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Veterinarian</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{`${pet.vetName || '-'}${pet.vetPhone ? ` (${pet.vetPhone})` : ''}`}</td>
                              </tr>
                              <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">Notes</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{pet.notes || '-'}</td>
                              </tr>
                              
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form className="mt-6 space-y-10">
                      {/* Basic Profile */}
                      <section>
                        <header className="mb-4">
                          <h3 className={sectionTitleCls}>Basic Profile</h3>
                          <p className={sectionDescCls}>Update your pet's core information</p>
                        </header>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className={labelCls}>Name</label>
                            <input name="name" value={formData.name} onChange={handleChange} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} className={inputCls}>
                              <option value="">Select</option>
                              <option value="dog">Dog</option>
                              <option value="cat">Cat</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Breed</label>
                            <input name="breed" value={formData.breed} onChange={handleChange} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className={inputCls}>
                              <option value="">Select</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Birth Date</label>
                            <input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Weight (kg)</label>
                            <input type="number" step="0.1" min="0" name="weight" value={formData.weight} onChange={handleChange} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Color</label>
                            <input name="color" value={formData.color} onChange={handleChange} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Blood Group</label>
                            <input name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={inputCls} placeholder="e.g., DEA 1.1+, A, B, AB, Unknown" />
                          </div>
                          <div>
                            <label className={labelCls}>Age Group</label>
                            <select name="ageGroup" value={formData.ageGroup} onChange={handleChange} className={inputCls}>
                              <option value="puppy">Puppy/Kitten</option>
                              <option value="adult">Adult</option>
                              <option value="senior">Senior</option>
                            </select>
                          </div>
                        </div>
                      </section>

                      {/* Health Information */}
                      <section>
                        <header className="mb-4">
                          <h3 className={sectionTitleCls}>Health Information</h3>
                          <p className={sectionDescCls}>Allergies, conditions, and care details</p>
                        </header>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5">
                            <input id="microchipped" type="checkbox" name="microchipped" checked={formData.microchipped} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="microchipped" className="text-sm text-gray-700">Microchipped</label>
                          </div>
                          <div>
                            <label className={labelCls}>Microchip Number</label>
                            <input name="microchipNumber" value={formData.microchipNumber} onChange={handleChange} className={inputCls} />
                          </div>
                          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5">
                            <input id="neutered" type="checkbox" name="neutered" checked={formData.neutered} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="neutered" className="text-sm text-gray-700">Neutered/Spayed</label>
                          </div>

                          {/* Allergies */}
                          <div className="sm:col-span-2">
                            <label className={labelCls}>Allergies</label>
                            <div className="max-h-48 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {(loadingMeta ? fallbackAllergies : allergiesOptions).map((opt) => (
                                  <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-2 py-2 shadow-sm ring-1 ring-gray-200 ">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      checked={selectedAllergies.includes(opt)}
                                      onChange={() => toggleSelection(selectedAllergies, setSelectedAllergies, opt)}
                                    />
                                    <span className="text-sm text-gray-700">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <input
                              placeholder="Add custom allergy"
                              value={customAllergies}
                              onChange={(e) => setCustomAllergies(e.target.value)}
                              className={`${inputCls} mt-2`}
                            />
                          </div>

                          {/* Medical conditions */}
                          <div className="sm:col-span-2">
                            <label className={labelCls}>Medical Conditions</label>
                            <div className="max-h-48 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {(loadingMeta ? fallbackMedicalConditions : medicalConditionsOptions).map((opt) => (
                                  <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-2 py-2 shadow-sm ring-1 ring-gray-200 ">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      checked={selectedMedicalConditions.includes(opt)}
                                      onChange={() => toggleSelection(selectedMedicalConditions, setSelectedMedicalConditions, opt)}
                                    />
                                    <span className="text-sm text-gray-700">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <input
                              placeholder="Add custom medical condition"
                              value={customMedicalConditions}
                              onChange={(e) => setCustomMedicalConditions(e.target.value)}
                              className={`${inputCls} mt-2`}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className={labelCls}>Medications</label>
                            <input name="medications" value={formData.medications} onChange={handleChange} className={inputCls} />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelCls}>Dietary Needs</label>
                            <input name="dietaryNeeds" value={formData.dietaryNeeds} onChange={handleChange} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Veterinarian Name</label>
                            <input name="vetName" value={formData.vetName} onChange={handleChange} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Veterinarian Phone</label>
                            <input name="vetPhone" value={formData.vetPhone} onChange={handleChange} className={inputCls} />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelCls}>Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} className={`${inputCls} min-h-[100px]`} />
                          </div>
                        </div>
                      </section>

                      {/* Vaccinations Section */}
                      <section>
                        <header className="mb-4 flex items-center justify-between">
                          <div>
                            <h3 className={sectionTitleCls}>Vaccination History</h3>
                            <p className={sectionDescCls}>Update your pet's vaccination records</p>
                          </div>
                          <button
                            type="button"
                            onClick={addVaccinationRow}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                          >
                            <FaPlus /> Add Vaccination
                          </button>
                        </header>
                        <div className="space-y-4">
                          {(formData.vaccinations || []).map((v, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-4 rounded-lg border border-gray-200 p-4 bg-white">
                              <div>
                                <label className={labelCls}>Vaccine Name</label>
                                <input
                                  type="text"
                                  value={v.vaccination_name || ''}
                                  onChange={(e) => handleVaccinationChange(idx, 'vaccination_name', e.target.value)}
                                  className={inputCls}
                                  placeholder="e.g., Rabies"
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Given Date</label>
                                <input
                                  type="date"
                                  value={v.vaccine_given_date ? String(v.vaccine_given_date).slice(0, 10) : ''}
                                  onChange={(e) => handleVaccinationChange(idx, 'vaccine_given_date', e.target.value)}
                                  className={inputCls}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Next Due</label>
                                <input
                                  type="date"
                                  value={v.vaccine_due_date ? String(v.vaccine_due_date).slice(0, 10) : ''}
                                  onChange={(e) => handleVaccinationChange(idx, 'vaccine_due_date', e.target.value)}
                                  className={inputCls}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Status</label>
                                <select
                                  value={v.vaccine_status || ''}
                                  onChange={(e) => handleVaccinationChange(idx, 'vaccine_status', e.target.value)}
                                  className={inputCls}
                                >
                                  <option value="">Select</option>
                                  <option value="completed">Completed</option>
                                  <option value="pending">Pending</option>
                                  <option value="overdue">Overdue</option>
                                </select>
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => removeVaccinationRow(idx)}
                                  className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition"
                                >
                                  <FaTimes className="inline mr-1" /> Remove
                                </button>
                              </div>
                            </div>
                          ))}
                          {(!formData.vaccinations || formData.vaccinations.length === 0) && (
                            <p className="text-sm text-gray-500 text-center py-4">No vaccinations added yet. Click "Add Vaccination" to add one.</p>
                          )}
                        </div>
                      </section>
                      {/* Form actions at the end of the page (no sticky overlay) */}
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white transition disabled:opacity-60"
                        >
                          <FaTimes className="mr-1 inline" /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
                        >
                          <FaSave className="mr-1 inline" /> {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Vaccinations, Allergies, Conditions Sections */}
            {!isEditing && (
              <div className="p-6 border-t border-gray-100 space-y-8">
                <section>
                  <h3 className="text-lg font-semibold mb-2">Vaccination History</h3>
                  {vaccinations.length === 0 ? (
                    <p className="text-sm text-gray-500">No vaccinations recorded.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Vaccine</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Given</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Next Due</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Status</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {vaccinations.map((v, idx) => (
                           <tr key={v.id || idx}>
                             <td className="px-4 py-2 text-sm text-gray-800">{v.vaccination_name || v.name}</td>
                             <td className="px-4 py-2 text-sm text-gray-500">{v.vaccine_given_date || v.date ? String(v.vaccine_given_date || v.date).slice(0, 10) : '-'}</td>
                             <td className="px-4 py-2 text-sm text-gray-500">{v.vaccine_due_date || v.next_due_date ? String(v.vaccine_due_date || v.next_due_date).slice(0, 10) : '-'}</td>
                             <td className="px-4 py-2 text-sm text-gray-500 capitalize">{v.vaccine_status || v.status || '-'}</td>
                           </tr>
                         ))}
                       </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">Allergies</h3>
                  {allergiesList.length === 0 ? (
                    <p className="text-sm text-gray-500">No allergies recorded.</p>
                  ) : (
                    <div className="text-sm text-gray-700">{allergiesList.join(', ')}</div>
                  )}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">Medical Conditions</h3>
                  {conditionsList.length === 0 ? (
                    <p className="text-sm text-gray-500">No medical conditions recorded.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Sr. No</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Name of condition</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Document (uploaded)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {conditionsList.map((c, index) => (
                            <tr key={c}>
                              <td className="px-4 py-2 text-sm text-gray-800 text-left">{index + 1}</td>
                              <td className="px-4 py-2 text-sm text-gray-800 text-left">{c}</td>
                              <td className="px-4 py-2 text-sm text-gray-500 text-left">-</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </div>
      
    </UserLayout>
  );
};

const Field = ({ label, value, icon }) => (
  <div>
    <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-1">
      {icon ? <span className="inline-flex items-center">{icon}</span> : null}
      <span>{label}</span>
    </div>
    <div className="mt-0.5 font-medium text-gray-900 break-words whitespace-pre-wrap">{value}</div>
  </div>
);

const Chips = ({ value }) => {
  const items = Array.isArray(value)
    ? value
    : String(value)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  if (items.length === 0) return '-';
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <span key={it} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
          {it}
        </span>
      ))}
    </div>
  );
};

export default UserPetProfile;