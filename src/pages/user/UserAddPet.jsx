import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPaw, FaArrowLeft, FaUpload, FaCalendarAlt, FaDog, FaCat, FaFish, FaHorse, FaSyringe, FaShieldAlt, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import { FaDove } from 'react-icons/fa6';
import { GiRabbit } from 'react-icons/gi';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserAddPet = () => {
  const navigate = useNavigate();
  const { tokens, currentUser } = useAuth();
  const accessToken = tokens?.access?.token;
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    // Custom vaccine fields
    customVaccineName: '',
    customVaccinePurpose: '',
    customVaccineDate: '',
    customVaccineNext: ''
  });
  
  // State for vaccine data
  const [vaccineData, setVaccineData] = useState([]);
  const [filteredVaccines, setFilteredVaccines] = useState([]);
  const [selectedVaccines, setSelectedVaccines] = useState({});
  
  // State for breeds
  const [breeds, setBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);

  // Fetch breeds based on pet type
  const fetchBreeds = async (petType) => {
    if (!petType || petType === 'other') {
      setBreeds(['Mixed Breed', 'Unknown', 'Crossbreed']);
      return;
    }
    
    setLoadingBreeds(true);
    try {
      const response = await fetch(`${API_URL}/pets/breeds/${petType}`);
      const data = await response.json();
      if (response.ok && data.breeds) {
        setBreeds(data.breeds);
      } else {
        setBreeds(['Mixed Breed', 'Unknown', 'Crossbreed']);
      }
    } catch (error) {
      console.error('Error fetching breeds:', error);
      setBreeds(['Mixed Breed', 'Unknown', 'Crossbreed']);
    } finally {
      setLoadingBreeds(false);
    }
  };

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
  
  // Handle vaccine selection
  const handleVaccineChange = (vaccineId, isSelected, vaccineData) => {
    setSelectedVaccines(prev => {
      const updated = { ...prev };
      
      if (isSelected) {
        // Calculate next due date based on frequency
        let nextDueDate = '';
        const today = new Date();
        
        if (vaccineData.frequency.includes('Annually')) {
          const nextYear = new Date(today);
          nextYear.setFullYear(today.getFullYear() + 1);
          nextDueDate = nextYear.toISOString().slice(0, 10);
        } else if (vaccineData.frequency.includes('3 years')) {
          const nextThreeYears = new Date(today);
          nextThreeYears.setFullYear(today.getFullYear() + 3);
          nextDueDate = nextThreeYears.toISOString().slice(0, 10);
        } else if (vaccineData.frequency.includes('6–12 months')) {
          const nextSixMonths = new Date(today);
          nextSixMonths.setMonth(today.getMonth() + 6);
          nextDueDate = nextSixMonths.toISOString().slice(0, 10);
        }
        
        updated[vaccineId] = {
          vaccine: vaccineData.vaccine,
          date: today.toISOString().slice(0, 10),
          notes: '',
          administered: false,
          nextDue: nextDueDate,
          purpose: vaccineData.purpose,
          is_core: vaccineData.is_core,
          frequency: vaccineData.frequency,
          recommended_age: vaccineData.recommended_age,
          batch_number: '',
          administered_by: '',
          clinic_name: ''
        };
      } else {
        delete updated[vaccineId];
      }
      
      // Return the updated state
      return updated;
    });
  };
  
  // Handle vaccine detail updates
  const handleVaccineDetailChange = (vaccineId, field, value) => {
    setSelectedVaccines(prev => {
      const updated = { ...prev };
      if (updated[vaccineId]) {
        updated[vaccineId] = {
          ...updated[vaccineId],
          [field]: value
        };
      }
      return updated;
    });
  };
  
  // Update formData with current vaccines before submission
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      vaccinations: Object.values(selectedVaccines)
    }));
  }, [selectedVaccines]);

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
    
    // Ensure we have the latest vaccine data
    const currentVaccinations = Object.values(selectedVaccines).map(vaccine => ({
      ...vaccine,
      // Add Indian standards specific fields
      indian_standard: true,
      region: "India"
    }));
    
    try {
      if (!accessToken) throw new Error('You must be logged in to add a pet.');

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
        vaccinations: currentVaccinations,
        region: "India" // Mark this pet profile as following Indian standards
      };

      const res = await fetch(`${API_URL}/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to create pet');

      navigate('/user/pets');
    } catch (err) {
      alert(err?.message || 'Failed to create pet');
    } finally {
      setIsSubmitting(false);
    }
  };

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
  
  // Load vaccine data from JSON file
  useEffect(() => {
    const fetchVaccineData = async () => {
      try {
        const response = await fetch('/pet_vaccine_master.json');
        const data = await response.json();
        setVaccineData(data);
      } catch (error) {
        console.error('Error loading vaccine data:', error);
      }
    };
    
    fetchVaccineData();
  }, []);
  
  // Filter vaccines based on pet type, breed, and age group
  useEffect(() => {
    if (vaccineData.length === 0 || !formData.type || !formData.ageGroup) {
      setFilteredVaccines([]);
      return;
    }
    
    // Convert to title case for matching with JSON data
    const petType = formData.type.charAt(0).toUpperCase() + formData.type.slice(1);
    const ageGroup = formData.ageGroup.charAt(0).toUpperCase() + formData.ageGroup.slice(1);
    
    // Filter vaccines based on pet type, breed (if available), and age group
    let filtered = vaccineData.filter(vaccine => 
      vaccine.pet_type === petType && 
      vaccine.age_group === ageGroup
    );
    
    // If breed is specified and there are breed-specific vaccines, prioritize those
    if (formData.breed) {
      const breedSpecificVaccines = filtered.filter(vaccine => 
        vaccine.breed.toLowerCase() === formData.breed.toLowerCase()
      );
      
      // If breed-specific vaccines exist, use those; otherwise, use general vaccines for the pet type
      if (breedSpecificVaccines.length > 0) {
        filtered = breedSpecificVaccines;
      }
    }
    
    // Group vaccines by name to avoid duplicates
    const groupedVaccines = filtered.reduce((acc, vaccine) => {
      if (!acc[vaccine.vaccine]) {
        acc[vaccine.vaccine] = vaccine;
      }
      return acc;
    }, {});
    
    setFilteredVaccines(Object.values(groupedVaccines));
  }, [vaccineData, formData.type, formData.breed, formData.ageGroup]);
  
  // Load breed options from Supabase and filter by selected species (dog/cat)
  useEffect(() => {
    let cancelled = false;
    const fetchBreeds = async () => {
      setBreedsLoading(true);
      try {
        const { data, error } = await supabase
          .from('PIQ_Petbreed_Master')
          .select('pet_breed_name,pet_type');
        if (error) {
          setBreedsError(error.message);
          setAllBreeds([]);
        } else {
          const rows = Array.isArray(data) ? data : [];
          if (!cancelled) setAllBreeds(rows);
        }
      } catch (error) {
        if (!cancelled) setBreedsError(error.message);
      } finally {
        if (!cancelled) setBreedsLoading(false);
      }
    };
    fetchBreeds();
    return () => { cancelled = true; };
  }, []);

  // Recompute breedOptions when type or allBreeds changes
  useEffect(() => {
    if (!allBreeds.length) { setBreedOptions([]); return; }
    const type = formData.type; // 'dog' | 'cat' | 'other'
    if (!type || type === 'other') { setBreedOptions([]); return; }
    const wanted = type === 'dog' ? 'dog' : 'cat';
    const names = allBreeds
      .filter(r => (r.pet_type || '').toString().toLowerCase() === wanted)
      .map(r => r.pet_breed_name)
      .filter(Boolean);
    // de-duplicate and sort
    const unique = Array.from(new Set(names)).sort((a,b)=>a.localeCompare(b));
    setBreedOptions(unique);
  }, [formData.type, allBreeds]);

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
              <h1 className="text-2xl font-bold text-gray-800">Add a New Pet</h1>
            </div>
            <p className="text-gray-500 mt-1">Enter your pet's information to create a profile</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Pet Photo Upload */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center relative">
                {previewImage ? (
                  <img src={previewImage} alt="Pet preview" className="w-full h-full object-cover" />
                ) : (
                  <FaPaw className="text-gray-400 text-4xl" />
                )}
                <input 
                  type="file" 
                  id="pet-photo" 
                  accept="image/*" 
                  className="opacity-0 absolute inset-0 cursor-pointer" 
                  onChange={handleImageChange}
                />
              </div>
              <label htmlFor="pet-photo" className="mt-2 flex items-center gap-1 text-sm text-pink-600 cursor-pointer">
                <FaUpload />
                Upload Photo
              </label>
            </div>
            
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Pet Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Enter pet name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pet Type*
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                  <div className="grid grid-cols-3 gap-2">
                    {petTypes.map((type) => (
                      <label 
                        key={type.value}
                        className={`flex flex-col items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors
                          ${formData.type === type.value 
                            ? 'bg-pink-50 border-pink-500 text-pink-700' 
                            : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        <div className="text-xl mb-1">
                          {type.icon}
                        </div>
                        <span className="text-xs">{type.label}</span>
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
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
                    Breed
                  </label>
                  {breedOptions && breedOptions.length > 0 ? (
                    <select
                      id="breed"
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="">Select breed</option>
                      {breedOptions.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="breed"
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Enter breed"
                    />
                  )}
                  {breedsLoading && (
                    <p className="text-xs text-gray-500 mt-1">Loading breeds…</p>
                  )}
                  {breedsError && (
                    <p className="text-xs text-red-600 mt-1">{breedsError}</p>
                  )}
                  <select
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    disabled={loadingBreeds || !formData.type}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="birthdate"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Enter weight"
                  />
                </div>
                
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Enter color"
                  />
                </div>
              </div>
            </div>
            
            {/* Health Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Health Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="microchipped"
                    name="microchipped"
                    checked={formData.microchipped}
                    onChange={handleChange}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="microchipped" className="ml-2 block text-sm text-gray-700">
                    Microchipped
                  </label>
                </div>
                
                {formData.microchipped && (
                  <div>
                    <label htmlFor="microchipNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Microchip Number
                    </label>
                    <input
                      type="text"
                      id="microchipNumber"
                      name="microchipNumber"
                      value={formData.microchipNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Enter microchip number"
                    />
                  </div>
                )}
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="neutered"
                    name="neutered"
                    checked={formData.neutered}
                    onChange={handleChange}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="neutered" className="ml-2 block text-sm text-gray-700">
                    Spayed/Neutered
                  </label>
                </div>
                
                {/* Allergies Section */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Allergies
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">Select any allergies that apply to your pet:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {commonAllergies.map((allergy, index) => (
                        <label key={index} className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.allergies.includes(allergy)}
                            onChange={(e) => handleAllergyChange(allergy, e.target.checked)}
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded mt-0.5 flex-shrink-0"
                          />
                          <span className="text-gray-700">{allergy}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label htmlFor="customAllergies" className="block text-sm font-medium text-gray-700 mb-1">
                        Other allergies (please specify):
                      </label>
                      <input
                        type="text"
                        id="customAllergies"
                        name="customAllergies"
                        value={formData.customAllergies}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Enter any other allergies not listed above"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Medical Conditions Section */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Medical Conditions
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">Select any medical conditions that apply to your pet:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {commonMedicalConditions.map((condition, index) => (
                        <label key={index} className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.medicalConditions.includes(condition)}
                            onChange={(e) => handleMedicalConditionChange(condition, e.target.checked)}
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded mt-0.5 flex-shrink-0"
                          />
                          <span className="text-gray-700">{condition}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label htmlFor="customMedicalConditions" className="block text-sm font-medium text-gray-700 mb-1">
                        Other medical conditions (please specify):
                      </label>
                      <textarea
                        id="customMedicalConditions"
                        name="customMedicalConditions"
                        value={formData.customMedicalConditions}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Enter any other medical conditions not listed above"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="medications" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Medications
                  </label>
                  <textarea
                    id="medications"
                    name="medications"
                    value={formData.medications}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="List any current medications"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="dietaryNeeds" className="block text-sm font-medium text-gray-700 mb-1">
                    Dietary Needs
                  </label>
                  <textarea
                    id="dietaryNeeds"
                    name="dietaryNeeds"
                    value={formData.dietaryNeeds}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Special dietary requirements"
                  />
                </div>
              </div>
            </div>
            
            {/* Vaccination Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <FaSyringe className="text-pink-500" />
                Vaccination Information (Indian Standards)
              </h2>
              <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Important for Indian Pet Owners:</strong> Vaccinations are crucial for your pet's health in India's climate and environment. 
                  The recommended vaccines below follow Indian veterinary guidelines and may differ from other countries.
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700 mb-1">
                  Pet Age Group
                </label>
                <select
                  id="ageGroup"
                  name="ageGroup"
                  value={formData.ageGroup}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {ageGroups.map(group => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the appropriate age group to see recommended vaccines
                </p>
              </div>
              
              {formData.type && formData.ageGroup ? (
                filteredVaccines.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-md font-medium text-blue-800 mb-1 flex items-center gap-2">
                        <FaShieldAlt />
                        Recommended Vaccines for {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}s in India
                      </h3>
                      <p className="text-sm text-blue-700">
                        Select the vaccines that are relevant for your pet. Core vaccines are essential for all pets of this type.
                      </p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-700">Available Vaccines for {formData.ageGroup.charAt(0).toUpperCase() + formData.ageGroup.slice(1)}s</h4>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Core
                            </span>
                            <span className="text-gray-500">= Essential</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Vaccine
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Purpose
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Recommended Age
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Frequency
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Add to Profile
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredVaccines.map((vaccine, index) => (
                              <tr 
                                key={index} 
                                className={`${vaccine.is_core ? 'bg-yellow-50' : ''} hover:bg-gray-50 cursor-pointer`}
                                onClick={() => {
                                  const vaccineId = `${vaccine.vaccine}-${index}`;
                                  const isCurrentlySelected = !!selectedVaccines[vaccineId];
                                  handleVaccineChange(vaccineId, !isCurrentlySelected, vaccine);
                                }}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center">
                                    <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                      {vaccine.vaccine}
                                      {vaccine.is_core && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                          Core
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm text-gray-500">{vaccine.purpose}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm text-gray-500">{vaccine.recommended_age}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm text-gray-500">{vaccine.frequency}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  <div className="flex items-center justify-center">
                                    <input
                                      type="checkbox"
                                      id={`vaccine-${index}`}
                                      checked={!!selectedVaccines[`${vaccine.vaccine}-${index}`]}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleVaccineChange(`${vaccine.vaccine}-${index}`, e.target.checked, vaccine);
                                      }}
                                      className="h-5 w-5 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {filteredVaccines.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                          No specific vaccines found for this pet type and age group. Please select a different combination.
                        </div>
                      )}
                    </div>
                    
                    {/* Add Custom Vaccine */}
                    <div className="mt-4 border border-gray-200 rounded-lg p-4">
                      <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <FaPlus className="text-pink-500" />
                        Add Custom Vaccine
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        If your pet has received a vaccine that's not listed above, you can add it manually here.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="custom-vaccine-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Vaccine Name*
                          </label>
                          <input
                            type="text"
                            id="custom-vaccine-name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            placeholder="Enter vaccine name"
                            value={formData.customVaccineName || ''}
                            onChange={(e) => setFormData({...formData, customVaccineName: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="custom-vaccine-purpose" className="block text-sm font-medium text-gray-700 mb-1">
                            Purpose
                          </label>
                          <input
                            type="text"
                            id="custom-vaccine-purpose"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            placeholder="What is this vaccine for?"
                            value={formData.customVaccinePurpose || ''}
                            onChange={(e) => setFormData({...formData, customVaccinePurpose: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="custom-vaccine-date" className="block text-sm font-medium text-gray-700 mb-1">
                            Date Administered
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaCalendarAlt className="text-gray-400" />
                            </div>
                            <input
                              type="date"
                              id="custom-vaccine-date"
                              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                              value={formData.customVaccineDate || ''}
                              onChange={(e) => setFormData({...formData, customVaccineDate: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="custom-vaccine-next" className="block text-sm font-medium text-gray-700 mb-1">
                            Next Due Date
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaCalendarAlt className="text-gray-400" />
                            </div>
                            <input
                              type="date"
                              id="custom-vaccine-next"
                              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                              value={formData.customVaccineNext || ''}
                              onChange={(e) => setFormData({...formData, customVaccineNext: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!formData.customVaccineName) {
                              alert('Please enter a vaccine name');
                              return;
                            }
                            
                            const customId = `custom-${Date.now()}`;
                            handleVaccineChange(customId, true, {
                              vaccine: formData.customVaccineName,
                              purpose: formData.customVaccinePurpose || 'Custom vaccine',
                              is_core: false,
                              frequency: 'As recommended by veterinarian',
                              recommended_age: 'As recommended by veterinarian'
                            });
                            
                            // Update specific fields for the custom vaccine
                            if (formData.customVaccineDate) {
                              handleVaccineDetailChange(customId, 'date', formData.customVaccineDate);
                            }
                            
                            if (formData.customVaccineNext) {
                              handleVaccineDetailChange(customId, 'nextDue', formData.customVaccineNext);
                            }
                            
                            // Reset custom vaccine form
                            setFormData({
                              ...formData,
                              customVaccineName: '',
                              customVaccinePurpose: '',
                              customVaccineDate: '',
                              customVaccineNext: ''
                            });
                          }}
                          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 flex items-center gap-2"
                        >
                          <FaPlus />
                          Add Custom Vaccine
                        </button>
                      </div>
                    </div>
                    
                    {/* Selected Vaccines Details */}
                    {Object.keys(selectedVaccines).length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <FaSyringe className="text-pink-500" />
                          Selected Vaccines Details
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(selectedVaccines).map(([id, vaccine]) => (
                            <div key={id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <FaSyringe className="text-pink-500" />
                                  <span className="font-medium">{vaccine.vaccine}</span>
                                  {vaccine.is_core && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Core
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleVaccineChange(id, false)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                              
                              <div className="flex items-center mb-4 bg-gray-50 p-3 rounded-lg">
                                <input
                                  type="checkbox"
                                  id={`vaccine-administered-${id}`}
                                  checked={vaccine.administered || false}
                                  onChange={(e) => handleVaccineDetailChange(id, 'administered', e.target.checked)}
                                  className="h-5 w-5 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`vaccine-administered-${id}`} className="ml-2 block text-sm font-medium text-gray-700">
                                  This vaccine has already been administered to my pet
                                </label>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label htmlFor={`vaccine-date-${id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Date Administered
                                  </label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <FaCalendarAlt className="text-gray-400" />
                                    </div>
                                    <input
                                      type="date"
                                      id={`vaccine-date-${id}`}
                                      value={vaccine.date || ''}
                                      onChange={(e) => handleVaccineDetailChange(id, 'date', e.target.value)}
                                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label htmlFor={`vaccine-next-${id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Next Due Date
                                  </label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <FaCalendarAlt className="text-gray-400" />
                                    </div>
                                    <input
                                      type="date"
                                      id={`vaccine-next-${id}`}
                                      value={vaccine.nextDue || ''}
                                      onChange={(e) => handleVaccineDetailChange(id, 'nextDue', e.target.value)}
                                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">Based on {vaccine.frequency}</p>
                                </div>
                                
                                {vaccine.administered && (
                                  <>
                                    <div>
                                      <label htmlFor={`vaccine-batch-${id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                        Batch/Serial Number
                                      </label>
                                      <input
                                        type="text"
                                        id={`vaccine-batch-${id}`}
                                        value={vaccine.batch_number || ''}
                                        onChange={(e) => handleVaccineDetailChange(id, 'batch_number', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        placeholder="Enter vaccine batch number"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label htmlFor={`vaccine-by-${id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                        Administered By
                                      </label>
                                      <input
                                        type="text"
                                        id={`vaccine-by-${id}`}
                                        value={vaccine.administered_by || ''}
                                        onChange={(e) => handleVaccineDetailChange(id, 'administered_by', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        placeholder="Veterinarian name"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label htmlFor={`vaccine-clinic-${id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                        Clinic/Hospital Name
                                      </label>
                                      <input
                                        type="text"
                                        id={`vaccine-clinic-${id}`}
                                        value={vaccine.clinic_name || ''}
                                        onChange={(e) => handleVaccineDetailChange(id, 'clinic_name', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                        placeholder="Enter clinic name"
                                      />
                                    </div>
                                  </>
                                )}
                                
                                <div className={vaccine.administered ? "md:col-span-2" : "md:col-span-2"}>
                                  <label htmlFor={`vaccine-notes-${id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Additional Notes
                                  </label>
                                  <textarea
                                    id={`vaccine-notes-${id}`}
                                    value={vaccine.notes || ''}
                                    onChange={(e) => handleVaccineDetailChange(id, 'notes', e.target.value)}
                                    rows="2"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                    placeholder="Any additional information about this vaccination"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      No specific vaccine data available for this pet type and age group in Indian standards. Please consult with your veterinarian.
                    </p>
                  </div>
                )
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">
                    Please select a pet type and age group to see recommended vaccines according to Indian standards.
                  </p>
                </div>
              )}
            </div>
            
            {/* Veterinarian Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Veterinarian Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vetName" className="block text-sm font-medium text-gray-700 mb-1">
                    Veterinarian Name
                  </label>
                  <input
                    type="text"
                    id="vetName"
                    name="vetName"
                    value={formData.vetName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Enter veterinarian name"
                  />
                </div>
                
                <div>
                  <label htmlFor="vetPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Veterinarian Phone
                  </label>
                  <input
                    type="tel"
                    id="vetPhone"
                    name="vetPhone"
                    value={formData.vetPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Enter veterinarian phone"
                  />
                </div>
              </div>
            </div>
            
            {/* Additional Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Any additional information about your pet"
              />
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/user/pets')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 flex items-center gap-2 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaPaw />
                  <span>Save Pet Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      </div>
    </UserLayout>
  );
};

export default UserAddPet;