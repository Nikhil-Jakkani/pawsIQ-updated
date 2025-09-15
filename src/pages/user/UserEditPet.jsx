import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPaw, FaArrowLeft, FaUpload, FaCalendarAlt, FaDog, FaCat, FaSyringe, FaShieldAlt, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserEditPet = () => {
  const navigate = useNavigate();
  const { petId } = useParams();
  const { tokens, currentUser, authFetch } = useAuth();
  const accessToken = tokens?.access?.token;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    breed: '',
    gender: '',
    birthdate: '',
    weight: '',
    color: '',
    microchipped: false,
    microchipNumber: '',
    neutered: false,
    allergies: [],
    customAllergies: '',
    medicalConditions: [],
    customMedicalConditions: '',
    medications: '',
    dietaryNeeds: '',
    vetName: '',
    vetPhone: '',
    notes: '',
    ageGroup: 'adult',
    vaccinations: [],
  });
  
  // State for breeds
  const [breeds, setBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);

  // Pet type options with icons - only cat, dog, and other
  const petTypes = [
    { value: 'dog', label: 'Dog', icon: <FaDog /> },
    { value: 'cat', label: 'Cat', icon: <FaCat /> },
    { value: 'other', label: 'Other', icon: <FaPaw /> }
  ];
  
  // Age group options
  const ageGroups = [
    { value: 'puppy', label: 'Puppy/Kitten' },
    { value: 'adult', label: 'Adult' },
    { value: 'senior', label: 'Senior' }
  ];

  // Common allergies options
  const commonAllergies = [
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
    'Preservative allergies'
  ];

  // Common medical conditions options
  const commonMedicalConditions = [
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
    'Chronic pain'
  ];

  // Fetch breeds based on pet type (ensure alphabetical sorting)
  const fetchBreeds = async (petType) => {
    const defaultBreeds = ['Mixed Breed', 'Unknown', 'Crossbreed'].sort((a, b) => a.localeCompare(b));

    if (!petType || petType === 'other') {
      setBreeds(defaultBreeds);
      return;
    }
    
    setLoadingBreeds(true);
    try {
      const response = await authFetch(`${API_URL}/pets/breeds/${petType}`);
      const data = await response.json();
      if (response.ok && Array.isArray(data.breeds)) {
        const sorted = [...new Set([
          ...defaultBreeds,
          ...data.breeds.filter(Boolean).map(String)
        ])].sort((a, b) => a.localeCompare(b));
        setBreeds(sorted);
      } else {
        setBreeds(defaultBreeds);
      }
    } catch (error) {
      console.error('Error fetching breeds:', error);
      setBreeds(defaultBreeds);
    } finally {
      setLoadingBreeds(false);
    }
  };

  // Load pet data
  useEffect(() => {
    const loadPetData = async () => {
      if (!petId || !authFetch) return;
      setIsLoading(true);
      try {
        // Try direct pet endpoint first
        let petRes = await authFetch(`${API_URL}/pets/${petId}`);
        let petData;
        if (petRes.ok) {
          petData = await petRes.json();
        } else {
          // Fallback to user profile pets list
          const profRes = await authFetch(`${API_URL}/user/profile`);
          const prof = await profRes.json().catch(() => ({}));
          if (!profRes.ok) throw new Error('Failed to load pet data');
          const list = Array.isArray(prof?.pets) ? prof.pets : [];
          const idNum = Number(petId);
          petData = list.find(p => Number(p.pet_id ?? p.id) === idNum);
          if (!petData) throw new Error('Pet not found');
        }

        const mappedType = (petData.pet_type || petData.type || '').toLowerCase();
        // Map the pet data to form data
        setFormData({
          name: petData.pet_name || petData.name || '',
          type: mappedType,
          breed: petData.pet_breed || petData.breed || '',
          gender: petData.pet_gender || petData.gender || '',
          birthdate: (petData.pet_birth_dtm || petData.birthdate || '').split ? (petData.pet_birth_dtm || petData.birthdate || '').split('T')[0] : (petData.pet_birth_dtm || petData.birthdate || ''),
          weight: petData.pet_weight ?? petData.weight ?? '',
          color: petData.pet_colour || petData.color || '',
          microchipped: petData.microchipped || false,
          microchipNumber: petData.microchip_number || '',
          neutered: petData.neutered || false,
          allergies: petData.allergies ? petData.allergies.split(', ') : [],
          customAllergies: '',
          medicalConditions: petData.medical_conditions ? petData.medical_conditions.split(', ') : [],
          customMedicalConditions: '',
          medications: petData.medications || '',
          dietaryNeeds: petData.dietary_needs || '',
          vetName: petData.vet_name || '',
          vetPhone: petData.vet_phone || '',
          notes: petData.notes || '',
          ageGroup: petData.age_group || petData.ageGroup || 'adult',
          vaccinations: petData.vaccinations || [],
        });

        // Fetch breeds for the pet type
        if (mappedType) {
          await fetchBreeds(mappedType);
        }

      } catch (error) {
        console.error('Error loading pet data:', error);
        alert('Failed to load pet data');
        navigate('/user/pets');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPetData();
  }, [petId, authFetch, navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // If pet type changes, fetch breeds and reset breed selection
    if (name === 'type') {
      fetchBreeds(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        breed: '' // Reset breed when type changes
      }));
    }
  };

  // Handle allergy checkbox changes
  const handleAllergyChange = (allergy, isChecked) => {
    setFormData(prev => ({
      ...prev,
      allergies: isChecked 
        ? [...prev.allergies, allergy]
        : prev.allergies.filter(item => item !== allergy)
    }));
  };

  // Handle medical condition checkbox changes
  const handleMedicalConditionChange = (condition, isChecked) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: isChecked 
        ? [...prev.medicalConditions, condition]
        : prev.medicalConditions.filter(item => item !== condition)
    }));
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!accessToken) throw new Error('You must be logged in to edit a pet.');

      // Combine selected allergies with custom allergies
      const allAllergies = [...formData.allergies];
      if (formData.customAllergies.trim()) {
        allAllergies.push(formData.customAllergies.trim());
      }

      // Combine selected medical conditions with custom conditions
      const allMedicalConditions = [...formData.medicalConditions];
      if (formData.customMedicalConditions.trim()) {
        allMedicalConditions.push(formData.customMedicalConditions.trim());
      }

      const payload = {
        name: formData.name.trim(),
        type: formData.type || undefined,
        breed: formData.breed || undefined,
        gender: formData.gender || undefined,
        birthdate: formData.birthdate || undefined,
        color: formData.color || undefined,
        ageGroup: formData.ageGroup || undefined,
        microchipped: formData.microchipped,
        microchipNumber: formData.microchipNumber || undefined,
        neutered: formData.neutered,
        allergies: allAllergies.length > 0 ? allAllergies.join(', ') : undefined,
        medicalConditions: allMedicalConditions.length > 0 ? allMedicalConditions.join(', ') : undefined,
        medications: formData.medications || undefined,
        dietaryNeeds: formData.dietaryNeeds || undefined,
        vetName: formData.vetName || undefined,
        vetPhone: formData.vetPhone || undefined,
        notes: formData.notes || undefined,
        vaccinations: formData.vaccinations,
        region: "India"
      };

      const res = await authFetch(`${API_URL}/pets/${petId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to update pet');

      navigate('/user/pets');
    } catch (err) {
      alert(err?.message || 'Failed to update pet');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pet data...</p>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="min-h-screen bg-white">
        <div className="space-y-8">
          {/* Enhanced Header Section */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/user/pets')}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <FaArrowLeft /> Back
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <img src="/7.png" alt="PawsIQ Logo" className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-semibold text-gray-900">Edit Pet Profile</h1>
                    <span className="text-gray-500 text-sm">— Update your pet's information and keep their profile current</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Enhanced Pet Photo Upload */}
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative group">
                <div className="w-40 h-40 rounded-3xl overflow-hidden bg-gray-50 border-4 border-dashed border-gray-300 flex items-center justify-center relative transition-all duration-300 group-hover:border-gray-400 group-hover:shadow">
                  {previewImage ? (
                    <img src={previewImage} alt="Pet preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <FaPaw className="text-gray-400 text-5xl mx-auto mb-2" />
                      <p className="text-gray-500 text-sm font-medium">Add Photo</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="pet-photo" 
                    accept="image/*" 
                    className="opacity-0 absolute inset-0 cursor-pointer" 
                    onChange={handleImageChange}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-3xl flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <FaUpload className="text-white text-2xl" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gray-800 p-2 rounded-full shadow">
                  <FaUpload className="text-white text-sm" />
                </div>
              </div>
              <label htmlFor="pet-photo" className="mt-6 flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl cursor-pointer hover:bg-gray-900 transition-all duration-200 shadow">
                <FaUpload className="text-lg" />
                <span className="font-medium">Upload Pet Photo</span>
              </label>
              <p className="text-gray-500 text-sm mt-2">Click to upload a photo of your pet</p>
            </div>
            
            {/* Basic Information */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gray-800 p-2 rounded-xl">
                  <FaPaw className="text-white text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Basic Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Pet Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter pet name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Pet Type*
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {petTypes.map((type) => (
                      <div key={type.value}>
                        <label 
                          className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                            ${formData.type === type.value 
                              ? 'bg-gray-900 border-gray-900 text-white shadow' 
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700'}`}
                        >
                          <div>
                            <div className="text-2xl mb-2">
                              {type.icon}
                            </div>
                            <span className="text-sm font-medium">{type.label}</span>
                          </div>
                          <input
                            type="radio"
                            name="type"
                            value={type.value}
                            checked={formData.type === type.value}
                            onChange={handleChange}
                            className="sr-only"
                            required
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                  
                <div>
                  <label htmlFor="breed" className="block text-sm font-semibold text-gray-700 mb-2">
                    Breed
                  </label>
                  <select
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    disabled={loadingBreeds || !formData.type}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                  >
                    <option value="">
                      {loadingBreeds ? 'Loading breeds...' : formData.type ? 'Select breed' : 'Select pet type first'}
                    </option>
                    {breeds.map((breed) => (
                      <option key={breed} value={breed}>
                        {breed}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="birthdate" className="block text-sm font-semibold text-gray-700 mb-2">
                    Birth Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaCalendarAlt className="text-pink-400 text-lg" />
                    </div>
                    <input
                      type="date"
                      id="birthdate"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleChange}
                      className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="weight" className="block text-sm font-semibold text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter weight"
                  />
                </div>
                
                <div>
                  <label htmlFor="color" className="block text-sm font-semibold text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter color"
                  />
                </div>
              </div>
            </div>
            
            {/* Health Information */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gray-800 p-2 rounded-xl">
                  <FaShieldAlt className="text-white text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Health Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-green-300 transition-all duration-200">
                  <input
                    type="checkbox"
                    id="microchipped"
                    name="microchipped"
                    checked={formData.microchipped}
                    onChange={handleChange}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded-lg"
                  />
                  <label htmlFor="microchipped" className="ml-3 block text-sm font-semibold text-gray-700">
                    Microchipped
                  </label>
                </div>
                
                {formData.microchipped && (
                  <div>
                    <label htmlFor="microchipNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                      Microchip Number
                    </label>
                    <input
                      type="text"
                      id="microchipNumber"
                      name="microchipNumber"
                      value={formData.microchipNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      placeholder="Enter microchip number"
                    />
                  </div>
                )}
                
                <div className="flex items-center p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-green-300 transition-all duration-200">
                  <input
                    type="checkbox"
                    id="neutered"
                    name="neutered"
                    checked={formData.neutered}
                    onChange={handleChange}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded-lg"
                  />
                  <label htmlFor="neutered" className="ml-3 block text-sm font-semibold text-gray-700">
                    Spayed/Neutered
                  </label>
                </div>
                
                {/* Allergies Section */}
                <div className="md:col-span-2">
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    Allergies
                  </label>
                  <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-600 mb-4">Select any allergies that apply to your pet:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                      {commonAllergies.map((allergy, index) => (
                        <label key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.allergies.includes(allergy)}
                            onChange={(e) => handleAllergyChange(allergy, e.target.checked)}
                            className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded-lg mt-0.5 flex-shrink-0"
                          />
                          <span className="text-sm text-gray-700 font-medium">{allergy}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label htmlFor="customAllergies" className="block text-sm font-semibold text-gray-700 mb-2">
                        Other allergies (please specify):
                      </label>
                      <input
                        type="text"
                        id="customAllergies"
                        name="customAllergies"
                        value={formData.customAllergies}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                        placeholder="Enter any other allergies not listed above"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Medical Conditions Section */}
                <div className="md:col-span-2">
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    Medical Conditions
                  </label>
                  <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-600 mb-4">Select any medical conditions that apply to your pet:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                      {commonMedicalConditions.map((condition, index) => (
                        <label key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.medicalConditions.includes(condition)}
                            onChange={(e) => handleMedicalConditionChange(condition, e.target.checked)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg mt-0.5 flex-shrink-0"
                          />
                          <span className="text-sm text-gray-700 font-medium">{condition}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label htmlFor="customMedicalConditions" className="block text-sm font-semibold text-gray-700 mb-2">
                        Other medical conditions (please specify):
                      </label>
                      <textarea
                        id="customMedicalConditions"
                        name="customMedicalConditions"
                        value={formData.customMedicalConditions}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                        placeholder="Enter any other medical conditions not listed above"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="medications" className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Medications
                  </label>
                  <textarea
                    id="medications"
                    name="medications"
                    value={formData.medications}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="List any current medications"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="dietaryNeeds" className="block text-sm font-semibold text-gray-700 mb-2">
                    Dietary Needs
                  </label>
                  <textarea
                    id="dietaryNeeds"
                    name="dietaryNeeds"
                    value={formData.dietaryNeeds}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="Special dietary requirements"
                  />
                </div>
              </div>
            </div>
            
            {/* Veterinarian Information */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gray-800 p-2 rounded-xl">
                  <FaSyringe className="text-white text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Veterinarian Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="vetName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Veterinarian Name
                  </label>
                  <input
                    type="text"
                    id="vetName"
                    name="vetName"
                    value={formData.vetName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter veterinarian name"
                  />
                </div>
                
                <div>
                  <label htmlFor="vetPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Veterinarian Phone
                  </label>
                  <input
                    type="tel"
                    id="vetPhone"
                    name="vetPhone"
                    value={formData.vetPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter veterinarian phone"
                  />
                </div>
              </div>
            </div>
            
            {/* Additional Notes */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gray-800 p-2 rounded-xl">
                  <FaPaw className="text-white text-xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Additional Notes</h2>
              </div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                placeholder="Any additional information about your pet"
              />
            </div>
          </div>
          
          {/* Enhanced Form Actions */}
          <div className="px-8 py-6 bg-white border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">*</span> Required fields
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/user/pets')}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 flex items-center gap-3 font-semibold shadow transition-all duration-150 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <FaPaw className="text-lg" />
                    <span>Update Pet Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
          </form>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserEditPet;
