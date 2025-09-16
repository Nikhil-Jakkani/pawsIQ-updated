import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPaw, FaArrowLeft, FaCalendarAlt, FaEdit, FaFileMedical, FaSave, FaTimes, FaCheckCircle, FaTimesCircle, FaMicrochip, FaWeight, FaPalette, FaBirthdayCake, FaVenusMars, FaExclamationTriangle, FaStethoscope, FaPills, FaUtensils, FaUserMd, FaStickyNote, FaCopy } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition';
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
  const [pet, setPet] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Basic form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    breed: '',
    gender: '',
    birthdate: '',
    weight: '',
    color: '',
    ageGroup: 'adult',
    microchipped: false,
    microchipNumber: '',
    neutered: false,
    medications: '',
    dietaryNeeds: '',
    vetName: '',
    vetPhone: '',
    notes: '',
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
    'Chronic pain',
  ];

  const fetchHealthOptions = async () => {
    setLoadingMeta(true);
    try {
      const endpoints = [`${API_URL}/pets/options`, `${API_URL}/pets/metadata`, `${API_URL}/metadata/pets`];
      let options = null;
      for (const url of endpoints) {
        try {
          const res = await authFetch(url);
          const data = await res.json().catch(() => ({}));
          if (res.ok && data) {
            options = data;
            break;
          }
        } catch {}
      }
      const allergiesFromApi = Array.isArray(options?.allergies) ? options.allergies : fallbackAllergies;
      const medFromApi = Array.isArray(options?.medicalConditions) ? options.medicalConditions : fallbackMedicalConditions;
      setAllergiesOptions(allergiesFromApi);
      setMedicalConditionsOptions(medFromApi);
    } finally {
      setLoadingMeta(false);
    }
  };

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
          medicalConditions:
            typeof data.medical_conditions === 'string'
              ? data.medical_conditions
              : Array.isArray(data.medical_conditions)
              ? data.medical_conditions.join(', ')
              : '',
          medications: data.medications || '',
          dietaryNeeds: data.dietary_needs || '',
          vetName: data.vet_name || '',
          vetPhone: data.vet_phone || '',
          notes: data.notes || '',
        };

        setPet(normalized);
        setFormData({
          name: normalized.name,
          type: normalized.type,
          breed: normalized.breed,
          gender: normalized.gender,
          birthdate: normalized.birthdate ? String(normalized.birthdate).split('T')[0] : '',
          weight: normalized.weight,
          color: normalized.color,
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
        const initMedical = normalized.medicalConditions
          ? normalized.medicalConditions.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        setSelectedAllergies(initAllergies);
        setSelectedMedicalConditions(initMedical);

        // Fetch options
        await fetchHealthOptions();
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

      // Build payload similar to UserEditPet.jsx
      const payload = {
        name: formData.name?.trim(),
        type: formData.type || undefined,
        breed: formData.breed || undefined,
        gender: formData.gender || undefined,
        birthdate: formData.birthdate || undefined,
        color: formData.color || undefined,
        ageGroup: formData.ageGroup || undefined,
        microchipped: !!formData.microchipped,
        microchipNumber: formData.microchipNumber || undefined,
        neutered: !!formData.neutered,
        allergies: allAllergies.length > 0 ? allAllergies.join(', ') : undefined,
        medicalConditions: allMedical.length > 0 ? allMedical.join(', ') : undefined,
        medications: formData.medications || undefined,
        dietaryNeeds: formData.dietaryNeeds || undefined,
        vetName: formData.vetName || undefined,
        vetPhone: formData.vetPhone || undefined,
        notes: formData.notes || undefined,
        vaccinations: [],
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

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-pink-600"></div>
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
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
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
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                  {pet.imagePath ? (
                    <img src={pet.imagePath} alt={pet.name} className="h-full w-full object-cover" />
                  ) : (
                    <FaPaw className="text-4xl text-gray-400" />
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
                          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                        >
                          <FaEdit className="mr-1 inline" /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/user/pets/${pet.id}/health-records`)}
                        className="rounded-lg bg-gray-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                      >
                        <FaFileMedical className="mr-1 inline" /> Health Records
                      </button>
                    </div>
                  </div>

                  {/* CONTENT */}
                  {!isEditing ? (
                    <div className="mt-6 space-y-8">
                      {/* Hero meta row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {pet.type && <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700 ring-1 ring-pink-200 capitalize">{pet.type}</span>}
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
                      </div>

                      <div className="grid gap-8 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        {/* Basic info */}
                        <div className="pt-0 md:pt-1 md:pr-6">
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className={sectionTitleCls}>Basic Profile</h3>
                            <span className={sectionDescCls}>Overview</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <Field label="Type" value={pet.type || '-'} icon={<FaPaw className="text-pink-500" />} />
                            <Field label="Gender" value={pet.gender || '-'} icon={<FaVenusMars className="text-blue-500" />} />
                            <Field label="Breed" value={pet.breed || '-'} icon={<FaStethoscope className="text-gray-500" />} />
                            <Field
                              label="Birth Date"
                              icon={<FaBirthdayCake className="text-amber-500" />}
                              value={
                                <span className="inline-flex items-center gap-2">
                                  <FaCalendarAlt className="text-gray-400" />
                                  {pet.birthdate ? String(pet.birthdate).split('T')[0] : '-'}
                                </span>
                              }
                            />
                            <Field label="Weight" value={pet.weight ? `${pet.weight} kg` : '-'} icon={<FaWeight className="text-gray-500" />} />
                            <Field label="Color" value={pet.color || '-'} icon={<FaPalette className="text-gray-500" />} />
                            <Field label="Age Group" value={pet.ageGroup || '-'} icon={<FaCalendarAlt className="text-gray-500" />} />
                          </div>
                        </div>

                        {/* Health info */}
                        <div className="pt-6 md:pt-1 md:pl-6">
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className={sectionTitleCls}>Health Information</h3>
                            <span className={sectionDescCls}>Medical basics</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                            <Field label="Microchipped" value={pet.microchipped ? 'Yes' : 'No'} icon={pet.microchipped ? <FaCheckCircle className="text-green-600" /> : <FaTimesCircle className="text-gray-400" />} />
                            <Field
                              label="Microchip Number"
                              icon={<FaMicrochip className="text-gray-600" />}
                              value={
                                pet.microchipNumber ? (
                                  <span className="inline-flex items-center gap-2 flex-wrap">
                                    <span className="font-mono break-all">{pet.microchipNumber}</span>
                                    <button
                                      type="button"
                                      onClick={() => navigator.clipboard?.writeText?.(pet.microchipNumber)}
                                      className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                                      title="Copy"
                                    >
                                      <FaCopy />
                                    </button>
                                  </span>
                                ) : (
                                  '-' 
                                )
                              }
                            />
                            <Field label="Neutered/Spayed" value={pet.neutered ? 'Yes' : 'No'} icon={pet.neutered ? <FaCheckCircle className="text-green-600" /> : <FaTimesCircle className="text-gray-400" />} />
                            <div className="col-span-2">
                              <Field label="Allergies" icon={<FaExclamationTriangle className="text-amber-500" />} value={pet.allergies ? <Chips value={pet.allergies} /> : '-'} />
                            </div>
                            <div className="col-span-2">
                              <Field label="Medical Conditions" icon={<FaStethoscope className="text-blue-600" />} value={pet.medicalConditions ? <Chips value={pet.medicalConditions} /> : '-'} />
                            </div>
                            <div className="col-span-2">
                              <Field label="Medications" icon={<FaPills className="text-purple-600" />} value={pet.medications || '-'} />
                            </div>
                            <div className="col-span-2">
                              <Field label="Dietary Needs" icon={<FaUtensils className="text-rose-600" />} value={pet.dietaryNeeds || '-'} />
                            </div>
                            <div className="col-span-2">
                              <Field label="Veterinarian" icon={<FaUserMd className="text-emerald-600" />} value={`${pet.vetName || '-'}${pet.vetPhone ? ` (${pet.vetPhone})` : ''}`} />
                            </div>
                            <div className="col-span-2">
                              <Field label="Notes" icon={<FaStickyNote className="text-gray-500" />} value={pet.notes || '-'} />
                            </div>
                          </div>
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
                            <input name="weight" value={formData.weight} onChange={handleChange} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Color</label>
                            <input name="color" value={formData.color} onChange={handleChange} className={inputCls} />
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
                            <input id="microchipped" type="checkbox" name="microchipped" checked={formData.microchipped} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                            <label htmlFor="microchipped" className="text-sm text-gray-700">Microchipped</label>
                          </div>
                          <div>
                            <label className={labelCls}>Microchip Number</label>
                            <input name="microchipNumber" value={formData.microchipNumber} onChange={handleChange} className={inputCls} />
                          </div>
                          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5">
                            <input id="neutered" type="checkbox" name="neutered" checked={formData.neutered} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                            <label htmlFor="neutered" className="text-sm text-gray-700">Neutered/Spayed</label>
                          </div>

                          {/* Allergies */}
                          <div className="sm:col-span-2">
                            <label className={labelCls}>Allergies</label>
                            <div className="max-h-48 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {(loadingMeta ? fallbackAllergies : allergiesOptions).map((opt) => (
                                  <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-2 py-2 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
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
                                  <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-2 py-2 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
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
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky action bar for edit mode */}
            {isEditing && (
              <div className="sticky bottom-0 left-0 right-0 border-t bg-white/90 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="mx-auto flex max-w-6xl justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <FaTimes className="mr-1 inline" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
                  >
                    <FaSave className="mr-1 inline" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
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