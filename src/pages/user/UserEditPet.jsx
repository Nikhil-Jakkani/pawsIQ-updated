import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPaw, FaArrowLeft, FaUpload, FaCalendarAlt, FaDog, FaCat, FaSyringe, FaShieldAlt, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserEditPet = () => {
  const navigate = useNavigate();
  const { petId } = useParams();
  const { tokens, currentUser } = useAuth();
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

  // Load pet data
  useEffect(() => {
    const loadPetData = async () => {
      if (!petId || !accessToken) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/pets/${petId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to load pet data');
        }
        
        const petData = await response.json();
        
        // Map the pet data to form data
        setFormData({
          name: petData.pet_name || '',
          type: petData.pet_type || '',
          breed: petData.pet_breed || '',
          gender: petData.pet_gender || '',
          birthdate: petData.pet_birth_dtm ? petData.pet_birth_dtm.split('T')[0] : '',
          weight: petData.pet_weight || '',
          color: petData.pet_colour || '',
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
          ageGroup: petData.age_group || 'adult',
          vaccinations: petData.vaccinations || [],
        });
        
        // Fetch breeds for the pet type
        if (petData.pet_type) {
          await fetchBreeds(petData.pet_type);
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
  }, [petId, accessToken, navigate]);

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

      const res = await fetch(`${API_URL}/pets/${petId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
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
              <h1 className="text-2xl font-bold text-gray-800">Edit Pet Profile</h1>
            </div>
            <p className="text-gray-500 mt-1">Update your pet's information</p>
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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <FaPaw />
                  <span>Update Pet Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </UserLayout>
  );
};

export default UserEditPet;
