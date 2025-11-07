import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPaw, FaArrowLeft, FaUpload, FaCalendarAlt, FaDog, FaCat, FaSyringe, FaShieldAlt, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

// Vaccination details will be uploaded via health records API

const UserEditPet = () => {
  const navigate = useNavigate();
  const { petId } = useParams();
  const { tokens, currentUser, authFetch } = useAuth();
  const accessToken = tokens?.access?.token;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    breed: '',
    gender: '',
    birthdate: '',
    weight: '',
    color: '',
    bloodGroup: '',
    microchipped: false,
    microchipNumber: '',
    neutered: false,
    allergies: [],
    customAllergies: '',
    other_allergies: '',
    medicalConditions: [],
    customMedicalConditions: '',
    other_conditions: '',
    medications: '',
    dietaryNeeds: '',
    vetName: '',
    vetPhone: '',
    notes: '',
  ageGroup: 'adult',
  vaccinationDetails: '',
  vaccinations: [],
  });
  
  // Vaccination state
  const [vaccineData, setVaccineData] = useState([]);
  const [filteredVaccines, setFilteredVaccines] = useState([]);
  const [selectedVaccines, setSelectedVaccines] = useState({});
  
  // State for breeds
  const [breeds, setBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(false);
  // State for blood groups
  const [bloodGroups, setBloodGroups] = useState([]);
  const [loadingBloodGroups, setLoadingBloodGroups] = useState(false);

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

  // Fetch blood groups based on pet type
  const fetchBloodGroups = async (petType) => {
    setLoadingBloodGroups(true);
    try {
      if (!petType) {
        setBloodGroups([]);
        return;
      }
      const response = await authFetch(`${API_URL}/pets/blood-groups?petType=${encodeURIComponent(petType)}`);
      const data = await response.json().catch(() => ({}));
      const list = Array.isArray(data?.bloodGroups) ? data.bloodGroups.filter(Boolean).map(String) : [];
      setBloodGroups(list);
    } catch (e) {
      console.warn('Failed to load blood groups', e);
      setBloodGroups([]);
    } finally {
      setLoadingBloodGroups(false);
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
        
        // Parse vaccinations data from backend
        let vaccinationsArray = [];
        const selectedVaccinesMap = {};
        if (petData.vaccinations) {
          if (typeof petData.vaccinations === 'object' && petData.vaccinations.selected_vaccines) {
            // New format: { selected_vaccines: [], vaccination_dates: {}, next_due_dates: {} }
            const { selected_vaccines, vaccination_dates, next_due_dates, custom_vaccines } = petData.vaccinations;
            vaccinationsArray = (selected_vaccines || []).map(vaccine => ({
              vaccine,
              date: vaccination_dates?.[vaccine] || '',
              nextDue: next_due_dates?.[vaccine] || '',
              notes: '',
              administered: true
            }));
            
            // Build selectedVaccines map for checkbox state
            (selected_vaccines || []).forEach(vaccine => {
              selectedVaccinesMap[vaccine] = {
                vaccine,
                date: vaccination_dates?.[vaccine] ? new Date(vaccination_dates[vaccine]).toISOString().slice(0, 10) : '',
                nextDue: next_due_dates?.[vaccine] ? new Date(next_due_dates[vaccine]).toISOString().slice(0, 10) : '',
                administered: true
              };
            });
          } else if (Array.isArray(petData.vaccinations)) {
            // Legacy format: array of vaccination objects
            vaccinationsArray = petData.vaccinations;
            petData.vaccinations.forEach(vacc => {
              if (vacc.vaccine) {
                selectedVaccinesMap[vacc.vaccine] = {
                  vaccine: vacc.vaccine,
                  date: vacc.date ? new Date(vacc.date).toISOString().slice(0, 10) : '',
                  nextDue: vacc.nextDue ? new Date(vacc.nextDue).toISOString().slice(0, 10) : '',
                  administered: true
                };
              }
            });
          }
        }
        
        setSelectedVaccines(selectedVaccinesMap);
        
        // Set image preview if pet has image
        if (petData.pet_image) {
          // We'll fetch signed URL for preview
          try {
            const qs = new URLSearchParams({ bucket: 'pets-photos', path: petData.pet_image, expiresIn: String(60 * 60 * 24) }).toString();
            const imgRes = await authFetch(`${API_URL}/media/signed-url?${qs}`);
            const imgPayload = await imgRes.json().catch(() => ({}));
            if (imgRes.ok && imgPayload?.url) {
              setPreviewImage(imgPayload.url);
            }
          } catch (e) {
            console.warn('Failed to load pet image:', e);
          }
        }

        // Map the pet data to form data
        // Derive selected vs custom for allergies/conditions if backend didn't store other_* on create
        const allAllergiesArr = petData.allergies
          ? String(petData.allergies).split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        const selectedKnownAllergies = allAllergiesArr.filter((a) => commonAllergies.includes(a));
        const derivedCustomAllergies = allAllergiesArr.filter((a) => !commonAllergies.includes(a)).join(', ');

        const allConditionsArr = petData.medical_conditions
          ? String(petData.medical_conditions).split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        const selectedKnownConditions = allConditionsArr.filter((c) => commonMedicalConditions.includes(c));
        const derivedCustomConditions = allConditionsArr.filter((c) => !commonMedicalConditions.includes(c)).join(', ');

        const finalType = mappedType || (petData.pet_type || petData.type || '').toLowerCase();
        const finalAgeGroup = petData.age_group || petData.ageGroup || 'adult';
        
        console.log('DEBUG: Pet data loaded - type:', finalType, 'ageGroup:', finalAgeGroup, 'petData:', petData);
        
        setFormData({
          name: petData.pet_name || petData.name || '',
          type: finalType,
          breed: petData.pet_breed || petData.breed || '',
          gender: petData.pet_gender || petData.gender || '',
          birthdate: (petData.pet_birth_dtm || petData.birthdate || '').split ? (petData.pet_birth_dtm || petData.birthdate || '').split('T')[0] : (petData.pet_birth_dtm || petData.birthdate || ''),
          weight: petData.pet_weight ?? petData.weight ?? '',
          color: petData.pet_colour || petData.color || '',
          bloodGroup: petData.pet_blood_grp || petData.bloodGroup || '',
          microchipped: petData.microchipped || false,
          microchipNumber: petData.microchip_number || '',
          neutered: petData.neutered || false,
          allergies: selectedKnownAllergies,
          customAllergies: petData.other_allergies || derivedCustomAllergies,
          other_allergies: petData.other_allergies || '',
          medicalConditions: selectedKnownConditions,
          customMedicalConditions: petData.other_medical_conditions || derivedCustomConditions,
          other_conditions: petData.other_medical_conditions || '',
          medications: petData.current_medications || petData.medications || '',
          dietaryNeeds: petData.dietary_needs || '',
          vetName: petData.vet_name || '',
          vetPhone: petData.vet_phone || '',
          notes: petData.notes || '',
          ageGroup: finalAgeGroup,
          vaccinations: vaccinationsArray,
        });

        // Fetch breeds and blood groups for the pet type
        if (mappedType) {
          await Promise.all([
            fetchBreeds(mappedType),
            fetchBloodGroups(mappedType)
          ]);
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

  // Load vaccine data from backend master based on current selections
  useEffect(() => {
    const fetchVaccineData = async () => {
      try {
        if (!formData.type || !formData.ageGroup) {
          console.log('DEBUG: Skipping vaccine fetch - type:', formData.type, 'ageGroup:', formData.ageGroup);
          setVaccineData([]);
          return;
        }
        const petType = formData.type.charAt(0).toUpperCase() + formData.type.slice(1);
        const ageGroup = formData.ageGroup.charAt(0).toUpperCase() + formData.ageGroup.slice(1);
        const params = new URLSearchParams();
        params.set('petType', petType);
        if (formData.breed) params.set('breed', formData.breed);
        params.set('ageGroup', ageGroup);
        console.log('DEBUG: Fetching vaccines with params:', params.toString());
        const response = await authFetch(`${API_URL}/vaccines/master?${params.toString()}`);
        const payload = await response.json().catch(() => ({}));
        const items = Array.isArray(payload?.vaccines) ? payload.vaccines : [];
        console.log('DEBUG: Vaccines fetched:', items);
        setVaccineData(items);
      } catch (error) {
        console.error('Error loading vaccine data:', error);
        setVaccineData([]);
      }
    };

    fetchVaccineData();
  }, [API_URL, authFetch, formData.type, formData.breed, formData.ageGroup]);
  
  // Filter vaccines based on pet type, breed, and age group
  useEffect(() => {
    if (vaccineData.length === 0 || !formData.type || !formData.ageGroup) {
      console.log('DEBUG: Resetting filtered vaccines - vaccineData.length:', vaccineData.length, 'type:', formData.type, 'ageGroup:', formData.ageGroup);
      setFilteredVaccines([]);
      return;
    }
    
    // Convert to title case for matching with JSON data
    const petType = formData.type.charAt(0).toUpperCase() + formData.type.slice(1);
    const ageGroup = formData.ageGroup.charAt(0).toUpperCase() + formData.ageGroup.slice(1);
    
    console.log('DEBUG: Filtering vaccines - petType:', petType, 'ageGroup:', ageGroup);
    
    // Filter vaccines based on pet type, breed (if available), and age group
    let filtered = vaccineData.filter(vaccine => 
      vaccine.pet_type === petType && 
      vaccine.age_group === ageGroup
    );
    
    console.log('DEBUG: Filtered result after type/ageGroup match:', filtered);
    
    // If breed is specified and there are breed-specific vaccines, prioritize those
    if (formData.breed) {
      const breedSpecificVaccines = filtered.filter((v) => {
        const vBreed = (v.pet_breed || v.breed || '').toLowerCase();
        const fBreed = (formData.breed || '').toLowerCase();
        return vBreed && fBreed && vBreed === fBreed;
      });
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
    
    const final = Object.values(groupedVaccines);
    console.log('DEBUG: Final filtered vaccines:', final);
    setFilteredVaccines(final);
  }, [vaccineData, formData.type, formData.breed, formData.ageGroup]);

  // Handle form input changes
  const handleChange = async (e) => {
    const { name, value, type, checked, files } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // If pet type changes, fetch breeds and blood groups, reset breed selection
    if (name === 'type') {
      fetchBreeds(value);
      fetchBloodGroups(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        breed: '', // Reset breed when type changes
        bloodGroup: ''
      }));
    }
  };

  // Handle allergy checkbox changes
  const handleAllergyChange = (allergy, isChecked) => {
    console.log('🔄 Allergy Change:', { allergy, isChecked });
    setFormData(prev => {
      const updated = {
        ...prev,
        allergies: isChecked 
          ? [...prev.allergies, allergy]
          : prev.allergies.filter(item => item !== allergy)
      };
      console.log('✅ Updated Allergies:', updated.allergies);
      return updated;
    });
  };

  // Handle medical condition checkbox changes
  const handleMedicalConditionChange = (condition, isChecked) => {
    console.log('🔄 Medical Condition Change:', { condition, isChecked });
    setFormData(prev => {
      const updated = {
        ...prev,
        medicalConditions: isChecked 
          ? [...prev.medicalConditions, condition]
          : prev.medicalConditions.filter(item => item !== condition)
      };
      console.log('✅ Updated Conditions:', updated.medicalConditions);
      return updated;
    });
  };

  // Handle vaccine checkbox changes
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
          administered: true,
          nextDue: nextDueDate,
          purpose: vaccineData.purpose,
          is_core: vaccineData.is_core,
          frequency: vaccineData.frequency,
          recommended_age: vaccineData.recommended_age
        };
      } else {
        delete updated[vaccineId];
      }
      
      return updated;
    });
  };
  
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

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a JPG, PNG, or WEBP image');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      // Store the file for upload
      setImageFile(file);
      
      // Show preview
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

      // Prepare allergies: send as array + separate other field
      const selected_allergies = formData.allergies && formData.allergies.length > 0 ? formData.allergies : undefined;
      const other_allergies = (formData.customAllergies && formData.customAllergies.trim()) || (formData.other_allergies && formData.other_allergies.trim()) || undefined;

      // Prepare conditions: send as array + separate other field
      const selected_conditions = formData.medicalConditions && formData.medicalConditions.length > 0 ? formData.medicalConditions : undefined;
      const other_conditions = (formData.customMedicalConditions && formData.customMedicalConditions.trim()) || (formData.other_conditions && formData.other_conditions.trim()) || undefined;

      const weightValue = formData.weight !== '' && formData.weight !== null && formData.weight !== undefined 
        ? (typeof formData.weight === 'number' ? formData.weight : Number(formData.weight))
        : null;
      
      if (weightValue !== null && Number.isNaN(weightValue)) {
        throw new Error('Please enter a valid numeric weight');
      }

      // Debug logging
      console.log('📋 Form Data Before Submit:', {
        allergies: formData.allergies,
        medicalConditions: formData.medicalConditions,
        customAllergies: formData.customAllergies,
        customMedicalConditions: formData.customMedicalConditions
      });

      console.log('📤 Prepared Payload Values:', {
        selected_allergies,
        other_allergies,
        selected_conditions,
        other_conditions
      });

      const payload = {
        name: formData.name.trim(),
        type: formData.type || undefined,
        breed: formData.breed || undefined,
        gender: formData.gender || undefined,
        birthdate: formData.birthdate || undefined,
        weight: weightValue !== null ? weightValue : undefined,
        color: formData.color || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        ageGroup: formData.ageGroup || undefined,
        microchipped: formData.microchipped,
        microchipNumber: formData.microchipNumber && formData.microchipNumber.toString().trim() ? formData.microchipNumber.toString() : undefined,
        neutered: formData.neutered,
        selected_allergies,
        other_allergies,
        selected_conditions,
        other_conditions,
        current_medications: formData.medications || undefined,
        dietary_needs: formData.dietaryNeeds || undefined,
        vetName: formData.vetName || undefined,
        vetPhone: formData.vetPhone || undefined,
        notes: formData.notes || undefined,
        // Transform selectedVaccines to backend format
        selected_vaccines: Object.values(selectedVaccines).map(v => v.vaccine).filter(Boolean),
        vaccination_dates: Object.values(selectedVaccines).reduce((acc, v) => {
          if (v.vaccine && v.date) acc[v.vaccine] = v.date;
          return acc;
        }, {}),
        next_due_dates: Object.values(selectedVaccines).reduce((acc, v) => {
          if (v.vaccine && v.nextDue) acc[v.vaccine] = v.nextDue;
          return acc;
        }, {}),
        region: "India"
      };

      console.log('🚀 Sending Payload to Backend:', JSON.stringify(payload, null, 2));

      const res = await authFetch(`${API_URL}/pets/${petId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to update pet');

      // Upload image if user selected a new one
      if (imageFile) {
        try {
          const ext = imageFile.name.split('.').pop().toLowerCase();
          const uploadRes = await authFetch(`${API_URL}/media/signed-upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket: 'pets-photos', entity: 'pet', entity_id: petId, file_ext: ext }),
          });
          const uploadPayload = await uploadRes.json().catch(() => ({}));
          if (uploadRes.ok) {
            const { path: imagePath, token } = uploadPayload;
            const { supabase } = await import('../../lib/supabaseClient');
            const { error: upErr } = await supabase.storage.from('pets-photos').uploadToSignedUrl(imagePath, token, imageFile);
            if (!upErr) {
              await authFetch(`${API_URL}/pets/${petId}/image`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: imagePath }),
              });
            }
          }
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr);
          // Don't fail the whole update if only image fails
        }
      }

      alert('✅ Pet profile updated successfully!');
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
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
                              ? 'bg-blue-500 border-blue-500 text-white shadow'
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 bg-white shadow-sm hover:shadow-md"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
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
                      <FaCalendarAlt className="text-[#145ae6] text-lg" />
                    </div>
                    <input
                      type="date"
                      id="birthdate"
                      max={new Date().toISOString().split('T')[0]}
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleChange}
                      className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
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
                    min="0.1"
                    max="200"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter color"
                  />
                </div>
                <div>
                  <label htmlFor="bloodGroup" className="block text-sm font-semibold text-gray-700 mb-2">
                    Blood Group
                  </label>
                  {loadingBloodGroups ? (
                    <input
                      type="text"
                      disabled
                      value="Loading..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed"
                    />
                  ) : bloodGroups.length > 0 ? (
                    <select
                      id="bloodGroup"
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                    >
                      <option value="">Select blood group</option>
                      {bloodGroups.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="bloodGroup"
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      placeholder="e.g., DEA 1.1+, A, B, AB, Unknown"
                    />
                  )}
                </div>
              
                
                <div>
                  <label htmlFor="ageGroup" className="block text-sm font-semibold text-gray-700 mb-2">
                    Age Group
                  </label>
                  <select
                    id="ageGroup"
                    name="ageGroup"
                    value={formData.ageGroup}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                  >
                    {ageGroups.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
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
            
            {/* Vaccination Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gray-800 p-2 rounded-xl">
                  <FaSyringe className="text-white text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Vaccination Details</h2>
              </div>
              
              <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Track the vaccinations your pet has received. Make sure to select your pet's type and age group above first.
                </p>
              </div>
              
              {formData.type && formData.ageGroup ? (
                Array.isArray(filteredVaccines) && filteredVaccines.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-md font-medium text-blue-800 mb-1 flex items-center gap-2">
                        <FaShieldAlt />
                        Recommended Vaccines for {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}s
                      </h3>
                      <p className="text-sm text-blue-700">
                        Check the vaccines that your pet has received. Core vaccines are essential for all pets of this type.
                      </p>
                    </div>
                    
                    {/* Vaccination Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredVaccines.map((vaccine, index) => {
                        const vaccineId = vaccine.vaccine;
                        const isSelected = !!selectedVaccines[vaccineId];
                        return (
                          <div
                            key={index}
                            className={`rounded-lg border-2 p-4 transition-all ${
                              vaccine.is_core
                                ? 'bg-yellow-50 border-yellow-300 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                            } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                          >
                            {/* Checkbox and Title */}
                            <div className="flex items-start gap-3 mb-3">
                              <input
                                type="checkbox"
                                id={`vaccine-${index}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  handleVaccineChange(vaccineId, e.target.checked, vaccine);
                                }}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 flex-shrink-0"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                                  {vaccine.vaccine}
                                  {vaccine.is_core && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Core
                                    </span>
                                  )}
                                </h4>
                              </div>
                            </div>

                            {/* Vaccine Details */}
                            <div className="space-y-2 mb-4 text-sm">
                              <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">Purpose</p>
                                <p className="text-gray-900">{vaccine.purpose}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">Recommended Age</p>
                                  <p className="text-gray-900 text-xs">{vaccine.recommended_age}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">Frequency</p>
                                  <p className="text-gray-900 text-xs">{vaccine.frequency}</p>
                                </div>
                              </div>
                            </div>

                            {/* Date Fields - Only enabled when checked */}
                            <div className="space-y-3 border-t border-gray-200 pt-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Date Given
                                </label>
                                <input
                                  type="date"
                                  value={selectedVaccines[vaccineId]?.date || ''}
                                  onChange={(e) => {
                                    if (!isSelected) {
                                      handleVaccineChange(vaccineId, true, vaccine);
                                    }
                                    handleVaccineDetailChange(vaccineId, 'date', e.target.value);
                                  }}
                                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    !isSelected
                                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                  disabled={!isSelected}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Next Due Date
                                </label>
                                <input
                                  type="date"
                                  value={selectedVaccines[vaccineId]?.nextDue || ''}
                                  onChange={(e) => {
                                    if (!isSelected) {
                                      handleVaccineChange(vaccineId, true, vaccine);
                                    }
                                    handleVaccineDetailChange(vaccineId, 'nextDue', e.target.value);
                                  }}
                                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    !isSelected
                                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                  disabled={!isSelected}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                    <p>No vaccines found for this pet type and age group.</p>
                    <p className="text-sm mt-2">Please ensure pet type and age group are selected.</p>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                  <p>Please select pet type and age group to view available vaccines.</p>
                </div>
              )}
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
