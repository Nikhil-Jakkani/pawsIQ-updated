import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  FaArrowLeft,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaDownload,
  FaFilter,
  FaCheck,
  FaTimes,
  FaPaw,
  FaDog,
  FaCat,
  FaFeather,
  FaFish,
  FaHorse,
  FaUserCircle,
  FaCalendarAlt,
  FaVenus,
  FaMars,
  FaNeuter,
  FaBirthdayCake,
  FaWeight,
  FaRuler,
  FaTag,
  FaSyringe,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaCamera,

} from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import HealthRecords from '../../components/health/HealthRecords';
import useApi from '../../hooks/useApi';

const PetProfiles = () => {
  const api = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showPetModal, setShowPetModal] = useState(false);
  const [currentPet, setCurrentPet] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const { petId } = useParams();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Set active tab based on URL or default to 'details'
  useEffect(() => {
    const tabFromUrl = window.location.hash.replace('#', '');
    if (tabFromUrl === 'health-records' || tabFromUrl === 'details') {
      setActiveTab(tabFromUrl);
    } else if (window.location.pathname.includes('health-records')) {
      setActiveTab('health-records');
    }
  }, [window.location.pathname]);

  // Tab navigation
  const renderTabContent = () => {
    if (!petId) {
      return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <p className="text-gray-500">Select a pet to view details</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'health-records':
        return (
          <div className="mt-6">
            <div className="bg-white shadow rounded-lg p-6">
              <HealthRecords />
            </div>
          </div>
        );
      case 'details':
      default:
        // Find the current pet from dataset
        const pet = pets.find(p => p.id === parseInt(petId));

        if (!pet) {
          return (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <p className="text-gray-500">Pet not found</p>
            </div>
          );
        }

        return (
          <div className="mt-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{pet.name}'s Profile</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {pet.breed} • {pet.age}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                      <FaEdit className="inline mr-1" /> Edit
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                    <dl className="space-y-4">
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Species</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {pet.species === 'Dog' ? <FaDog className="inline mr-2" /> : <FaCat className="inline mr-2" />}
                          {pet.species}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Breed</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{pet.breed}</dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Age</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{pet.age}</dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Gender</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {pet.gender === 'Male' ? 
                            <FaMars className="inline mr-1 text-blue-500" /> : 
                            <FaVenus className="inline mr-1 text-pink-500" />
                          }
                          {pet.gender}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Weight</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{pet.weight} kg</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Health Information</h4>
                    <dl className="space-y-4">
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Last Checkup</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {pet.lastCheckup || 'No recent checkup'}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Vaccination Status</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {pet.vaccinationStatus === 'Up to date' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FaCheck className="mr-1" /> Up to date
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <FaExclamationTriangle className="mr-1" /> Due for update
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-500">Medical Notes</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {pet.medicalNotes || 'No medical notes available'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  // Fetch pets dynamically
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const qs = new URLSearchParams();
        qs.set('page', String(page));
        qs.set('limit', String(limit));
        if (searchTerm) qs.set('search', searchTerm);
        const data = await api.get(`/admin/piq/pets?${qs.toString()}`);
        if (!alive) return;
        const list = Array.isArray(data?.results) ? data.results : [];
        setPets(list.map(p => {
          // Calculate age from birthdate if available
          let calculatedAge = p.age || 0;
          if (p.birthdate || p.birthday || p.pet_birth_dtm) {
            const birthdate = p.birthdate || p.birthday || p.pet_birth_dtm;
            const dob = new Date(birthdate);
            const now = new Date();
            calculatedAge = Math.max(0, Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
          }
          
          return {
            id: p.id,
            name: p.name,
            species: p.species || 'Other',
            breed: p.breed || '',
            age: calculatedAge,
            gender: p.gender || 'Unknown',
            weight: p.weight || '',
            height: p.height || '',
            color: p.color || '',
            microchipped: !!p.microchipped,
            neutered: !!p.neutered,
            vaccinated: !!p.vaccinated,
            ownerName: p.ownerName || '',
            ownerEmail: p.ownerEmail || '',
            ownerPhone: p.ownerPhone || '',
            profileImage: p.profileImage,
            dateAdded: p.created_at ? new Date(p.created_at).toISOString().slice(0,10) : '',
            lastUpdated: p.lastUpdated || p.updated_at || '',
            status: p.status || 'active',
            medicalConditions: p.medicalConditions || [],
            medications: p.medications || [],
            dietaryRestrictions: p.dietaryRestrictions || [],
            notes: p.notes || '',
          };
        }));
        setTotalPages(Number(data?.totalPages) || 1);
        setTotalResults(Number(data?.totalResults) || 0);
      } catch (e) {
        if (!alive) return;
        setError('Failed to load pets');
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [api, page, limit, searchTerm]);

  // Get species icon
  const getSpeciesIcon = (species) => {
    switch (species.toLowerCase()) {
      case 'dog':
        return <FaDog className="text-amber-600" />;
      case 'cat':
        return <FaCat className="text-gray-600" />;
      case 'bird':
        return <FaFeather className="text-blue-500" />;
      case 'fish':
        return <FaFish className="text-indigo-500" />;
      case 'rabbit':
        return <FaPaw className="text-brown-500" />;
      case 'horse':
        return <FaHorse className="text-brown-700" />;
      default:
        return <FaPaw className="text-gray-500" />;
    }
  };

  // Get gender icon
  const getGenderIcon = (gender) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return <FaMars className="text-blue-500" />;
      case 'female':
        return <FaVenus className="text-pink-500" />;
      default:
        return <FaNeuter className="text-gray-500" />;
    }
  };

  // Filter and sort pets
  const filteredAndSortedPets = pets
    .filter(pet => {
      const matchesSearch = 
        pet.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSpecies = filterSpecies === 'all' || pet.species.toLowerCase() === filterSpecies.toLowerCase();
      const matchesStatus = filterStatus === 'all' || pet.status === filterStatus;
      
      return matchesSearch && matchesSpecies && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'species') {
        comparison = a.species.localeCompare(b.species);
      } else if (sortField === 'breed') {
        comparison = a.breed.localeCompare(b.breed);
      } else if (sortField === 'age') {
        comparison = a.age - b.age;
      } else if (sortField === 'ownerName') {
        comparison = a.ownerName.localeCompare(b.ownerName);
      } else if (sortField === 'lastUpdated') {
        comparison = new Date(b.lastUpdated) - new Date(a.lastUpdated);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Handle sort click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400" />;
    return sortDirection === 'asc' ? <FaSortUp className="ml-1 text-indigo-600" /> : <FaSortDown className="ml-1 text-indigo-600" />;
  };

  // Handle view pet details
  const handleViewPet = (pet) => {
    setCurrentPet(pet);
    setShowPetModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/pets" className="text-gray-500 hover:text-indigo-600">
              <FaArrowLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Pet Profiles</h1>
              <p className="text-gray-500">View and manage pet profiles on the platform</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={() => {
                // Create a CSV string from the filtered pets
                const headers = ['ID', 'Name', 'Species', 'Breed', 'Age', 'Gender', 'Owner Name', 'Owner Email', 'Status', 'Microchipped', 'Neutered', 'Vaccinated'];
                const csvRows = [headers];
                
                filteredAndSortedPets.forEach(pet => {
                  csvRows.push([
                    pet.id,
                    pet.name,
                    pet.species,
                    pet.breed,
                    pet.age,
                    pet.gender,
                    pet.ownerName,
                    pet.ownerEmail,
                    pet.status,
                    pet.microchipped ? 'Yes' : 'No',
                    pet.neutered ? 'Yes' : 'No',
                    pet.vaccinated ? 'Yes' : 'No'
                  ]);
                });
                
                const csvString = csvRows.map(row => row.join(',')).join('\n');
                
                // Create a Blob and download link
                const blob = new Blob([csvString], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('hidden', '');
                a.setAttribute('href', url);
                a.setAttribute('download', `pet-profiles-${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              <FaDownload /> Export Profiles
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Search pets by name, breed, owner..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Species Filter */}
            <select
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={filterSpecies}
              onChange={(e) => setFilterSpecies(e.target.value)}
            >
              <option value="all">All Species</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
              <option value="bird">Birds</option>
              <option value="fish">Fish</option>
              <option value="rabbit">Rabbits</option>
              <option value="other">Other</option>
            </select>
            
            {/* Status Filter */}
            <select
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Pets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedPets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={pet.profileImage} 
                  alt={pet.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${pet.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {pet.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
                  <div className="flex items-center gap-1">
                    {getSpeciesIcon(pet.species)}
                    {getGenderIcon(pet.gender)}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <p>{pet.breed}</p>
                  <p>{pet.age} {pet.age === 1 ? 'year' : 'years'} old</p>
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  <p>Owner: {pet.ownerName}</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {pet.microchipped && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Microchipped</span>
                  )}
                  {pet.neutered && (
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Neutered/Spayed</span>
                  )}
                  {pet.vaccinated && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Vaccinated</span>
                  )}
                </div>
                <button
                  onClick={() => handleViewPet(pet)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FaEye /> View Profile
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pet Details Modal */}
        {showPetModal && currentPet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Pet Profile: {currentPet.name}</h2>
                  <button 
                    onClick={() => setShowPetModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Pet Image */}
                  <div className="md:w-1/3">
                    <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200">
                      <img 
                        src={currentPet.profileImage} 
                        alt={currentPet.name} 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-500" />
                        <span className="text-sm text-gray-600">Added: {currentPet.dateAdded}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-gray-500" />
                        <span className="text-sm text-gray-600">Last Updated: {currentPet.lastUpdated}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${currentPet.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {currentPet.status === 'active' ? 'Active Profile' : 'Inactive Profile'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pet Details */}
                  <div className="md:w-2/3 space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-3">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <FaPaw className="text-indigo-600" />
                          <div>
                            <p className="text-sm text-gray-500">Species</p>
                            <p className="text-base text-gray-900">{currentPet.species}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaTag className="text-indigo-600" />
                          <div>
                            <p className="text-sm text-gray-500">Breed</p>
                            <p className="text-base text-gray-900">{currentPet.breed}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaBirthdayCake className="text-indigo-600" />
                          <div>
                            <p className="text-sm text-gray-500">Age</p>
                            <p className="text-base text-gray-900">{currentPet.age} {currentPet.age === 1 ? 'year' : 'years'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getGenderIcon(currentPet.gender)}
                          <div>
                            <p className="text-sm text-gray-500">Gender</p>
                            <p className="text-base text-gray-900">{currentPet.gender}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaWeight className="text-indigo-600" />
                          <div>
                            <p className="text-sm text-gray-500">Weight</p>
                            <p className="text-base text-gray-900">{currentPet.weight}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaRuler className="text-indigo-600" />
                          <div>
                            <p className="text-sm text-gray-500">Height</p>
                            <p className="text-base text-gray-900">{currentPet.height}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Health Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-3">Health Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center ${currentPet.microchipped ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {currentPet.microchipped ? <FaCheck className="text-green-600 text-xs" /> : <FaTimes className="text-gray-400 text-xs" />}
                          </div>
                          <span className="text-sm text-gray-700">Microchipped</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center ${currentPet.neutered ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {currentPet.neutered ? <FaCheck className="text-green-600 text-xs" /> : <FaTimes className="text-gray-400 text-xs" />}
                          </div>
                          <span className="text-sm text-gray-700">Neutered/Spayed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center ${currentPet.vaccinated ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {currentPet.vaccinated ? <FaCheck className="text-green-600 text-xs" /> : <FaTimes className="text-gray-400 text-xs" />}
                          </div>
                          <span className="text-sm text-gray-700">Vaccinated</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Medical Conditions</p>
                          <div className="flex flex-wrap gap-2">
                            {currentPet.medicalConditions.map((condition, index) => (
                              <span key={index} className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                {condition}
                              </span>
                            ))}
                            {currentPet.medicalConditions.length === 0 || (currentPet.medicalConditions.length === 1 && currentPet.medicalConditions[0] === 'None') ? (
                              <span className="text-sm text-gray-500">No known medical conditions</span>
                            ) : null}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Medications</p>
                          <div className="flex flex-wrap gap-2">
                            {currentPet.medications.map((medication, index) => (
                              <span key={index} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {medication}
                              </span>
                            ))}
                            {currentPet.medications.length === 0 ? (
                              <span className="text-sm text-gray-500">No medications</span>
                            ) : null}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Dietary Restrictions</p>
                          <div className="flex flex-wrap gap-2">
                            {currentPet.dietaryRestrictions.map((restriction, index) => (
                              <span key={index} className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                                {restriction}
                              </span>
                            ))}
                            {currentPet.dietaryRestrictions.length === 0 ? (
                              <span className="text-sm text-gray-500">No dietary restrictions</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Owner Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-3">Owner Information</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <FaUserCircle className="text-indigo-600" size={20} />
                          </div>
                          <div>
                            <p className="text-base font-medium text-gray-900">{currentPet.ownerName}</p>
                            <p className="text-sm text-gray-500">{currentPet.ownerEmail}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">
                          <p>Phone: {currentPet.ownerPhone}</p>
                          <p className="mt-1">Emergency Contact: {currentPet.emergencyContact}</p>
                          <p className="mt-1">Veterinarian: {currentPet.vetInfo}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notes */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Notes</h3>
                      <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{currentPet.notes}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowPetModal(false);
                    }}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // In a real app, this would open a form with the pet's current data
                      // For this demo, we'll use simple prompts to simulate editing
                      
                      const newName = prompt("Edit pet name:", currentPet.name);
                      if (!newName) return;
                      
                      const newAge = prompt("Edit pet age:", currentPet.age);
                      if (!newAge) return;
                      
                      const newWeight = prompt("Edit pet weight:", currentPet.weight);
                      if (!newWeight) return;
                      
                      // Update the pet data (in a real app, this would be an API call)
                      const updatedPet = {
                        ...currentPet,
                        name: newName,
                        age: parseInt(newAge),
                        weight: newWeight,
                        lastUpdated: new Date().toISOString().split('T')[0]
                      };
                      
                      console.log("Updated pet data:", updatedPet);
                      alert(`${newName}'s profile has been updated successfully!`);
                      
                      // Close the modal
                      setShowPetModal(false);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <FaEdit /> Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PetProfiles;