import React, { useState, useEffect, useRef, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import { FaCalendarCheck, FaShoppingCart, FaPaw, FaDog, FaCat, FaBone, FaRobot, FaStethoscope, FaHeart, FaStar, FaBell, FaChartLine, FaMagic, FaArrowRight, FaRunning, FaUtensils, FaCut, FaHeartbeat, FaBrain, FaThermometerHalf, FaClock, FaTint, FaPlay, FaMinus, FaWeight, FaBirthdayCake, FaPlus } from 'react-icons/fa';

import { PetIcon, PetIconButton } from '../../components/layout/PetIcons';
import UserStatCard from '../../components/user/UserStatCard';
// import UserAppointments from '../../components/user/UserAppointments';
import PetProfiles from '../../components/user/PetProfiles';
import AIPetCareSuggestions from '../../components/user/AIPetCareSuggestions';
import AISymptomChecker from '../../components/user/AISymptomChecker';
import PetSelector from '../../components/user/PetSelector';
import PetHealthCard from '../../components/user/PetHealthCard';
import SmartInsights from '../../components/user/SmartInsights';

import WeatherWidget from '../../components/user/WeatherWidget';

import AIAssistantPopup from '../../components/user/AIAssistantPopup';
import UpcomingSchedule from '../../components/user/UpcomingSchedule';
import CareReminders from '../../components/user/CareReminders';
import PetActivityTracker from '../../components/user/PetActivityTracker';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserDashboard = () => {

  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [activeService, setActiveService] = useState('suggestions');
  const [showAllTips, setShowAllTips] = useState(false);
  const [selectedPetForAI, setSelectedPetForAI] = useState(null);
  const { currentUser, tokens, authFetch, loading: authLoading, fetchUserDashboard } = useAuth();

  const accessToken = tokens?.access?.token;

  const [pets, setPets] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const careRemRef = useRef(null);

  // In-memory cache for signed image URLs with persistence to localStorage
  const imageCacheRef = useRef(new Map());

  const formatWeight = (petLike = {}) => {
    const candidates = [
      petLike.weight,
      petLike.pet_weight,
      petLike.pet_weight_kg,
      petLike.weight_kg,
    ];

    const raw = candidates.find((value) => {
      if (value === undefined || value === null) return false;
      const str = String(value).trim();
      return str.length > 0 && str.toLowerCase() !== 'unknown';
    });

    if (raw === undefined) return null;

    const numeric = Number(raw);
    if (!Number.isNaN(numeric)) return `${numeric} kg`;

    const stringValue = String(raw).trim();
    if (!stringValue.length) return null;
    if (/[a-zA-Z]/.test(stringValue)) return stringValue;
    return `${stringValue} kg`;
  };

  const petsCacheKey = React.useMemo(() => {
    if (!currentUser) return null;
    const uid = currentUser.id || currentUser.user_id || currentUser.email || 'me';
    return `pawsiq:pets:${uid}`;
  }, [currentUser]);

  useEffect(() => {
    // Hydrate cache from localStorage (drop expired entries)
    try {
      const persisted = localStorage.getItem('petImageUrlCache');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        const now = Date.now();
        const map = new Map();
        Object.entries(parsed).forEach(([path, entry]) => {
          if (entry?.url && entry?.expiry > now) {
            map.set(path, { url: entry.url, expiry: entry.expiry });
          }
        });
        imageCacheRef.current = map;
      }
    } catch (e) {
      console.warn('Failed to load image cache', e);
    }
  }, []);

  // Immediate paint from cached pets while we revalidate in background
  useEffect(() => {
    if (!petsCacheKey) return;
    try {
      const raw = localStorage.getItem(petsCacheKey);
      if (raw) {
        const cachedPets = JSON.parse(raw);
        if (Array.isArray(cachedPets) && cachedPets.length) {
          const sanitized = cachedPets
            .filter((p) => (p.status || '').toLowerCase() !== 'inactive')
            .map((p) => {
              const badLegacy = typeof p.image === 'string' && /\/user\/\d+\/pet\/\d+\//.test(p.image);
              return {
                ...p,
                image: badLegacy ? (p.profileImage || 'https://placehold.co/600x400?text=Pet') : p.image,
              };
            });
          setPets(sanitized);
          if (!selectedPetForAI && sanitized.length) setSelectedPetForAI(sanitized[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to read cached pets', e);
    }
  }, [petsCacheKey]);

  const persistImageCache = () => {
    try {
      const obj = {};
      imageCacheRef.current.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem('petImageUrlCache', JSON.stringify(obj));
    } catch {
      // ignore storage errors
    }
  };

  const getSignedUrlForPath = async (path) => {
    if (!path) return null;
    const cached = imageCacheRef.current.get(path);
    const now = Date.now();
    if (cached && cached.expiry > now) return cached.url;

    const expiresInSec = 60 * 60 * 24 * 6; // 6 days
    try {
      const qs = new URLSearchParams({ bucket: 'pets-photos', path, expiresIn: String(expiresInSec) }).toString();
      const urlRes = await authFetch(`${API_URL}/media/signed-url?${qs}`);
      const urlPayload = await urlRes.json().catch(() => ({}));
      if (urlRes.ok && urlPayload?.url) {
        const expiry = now + expiresInSec * 1000;
        imageCacheRef.current.set(path, { url: urlPayload.url, expiry });
        persistImageCache();
        return urlPayload.url;
      }
    } catch (error) {
      console.error('Failed to fetch signed URL:', error);
    }
    return null;
  };

  // Fast synchronous cache read (no network)
  const getCachedUrlIfFresh = (path) => {
    if (!path) return null;
    const now = Date.now();
    const cached = imageCacheRef.current.get(path);
    if (cached && cached.expiry > now && cached.url) return cached.url;
    return null;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Load pet data and cache image URLs
  useEffect(() => {
    if (authLoading || !currentUser) return;
    
    let isMounted = true;
    
    const loadPets = async () => {
      try {
        // Prefer aggregated dashboard data (single round-trip)
        let payload = null;
        try {
          payload = await fetchUserDashboard();
          if (payload) setDashboardData(payload);
        } catch (_) {}
        let rawPets = [];
        if (payload?.pets) {
          rawPets = payload.pets;
        } else {
          const userId = Number(currentUser?.user_id ?? currentUser?.id);
          if (!userId) throw new Error('Missing user id');
          const res = await authFetch(`${API_URL}/pets/user/${userId}`);
          const arr = await res.json().catch(() => ([]));
          if (!res.ok) throw new Error((arr && arr.message) || 'Failed to load pets');
          rawPets = Array.isArray(arr) ? arr : (arr?.pets || []);
        }
        
        // Fetch appointments to get last checkup dates
        let appointmentsMap = new Map();
        try {
          // Try user-specific appointments endpoint
          const userId = Number(currentUser?.user_id ?? currentUser?.id);
          const apptRes = await authFetch(`${API_URL}/user/${userId}/appointments`);
          if (apptRes.ok) {
            const apptData = await apptRes.json();
            const appointments = Array.isArray(apptData?.items) ? apptData.items : (Array.isArray(apptData) ? apptData : []);
            
            console.log('Fetched appointments for last checkup:', appointments.length);
            
            // Group completed appointments by pet_id and find the most recent
            appointments
              .filter(a => {
                const status = (a.appointment_status || a.booking_status || '').toLowerCase();
                return status === 'completed';
              })
              .forEach(a => {
                const petId = Number(a.pet_id);
                const apptDate = new Date(a.appointment_date || a.booked_dtm || a.appointment_dtm);
                if (isNaN(apptDate.getTime())) return; // Skip invalid dates
                
                if (!appointmentsMap.has(petId) || apptDate > appointmentsMap.get(petId)) {
                  appointmentsMap.set(petId, apptDate);
                  console.log(`Set last checkup for pet ${petId}:`, apptDate.toISOString());
                }
              });
          }
        } catch (err) {
          console.warn('Failed to fetch appointments for last checkup:', err);
        }

        // Phase 1: map pet data synchronously using cached image URLs (if present)
        rawPets = rawPets
          .filter((p) => (p.status || '').toLowerCase() !== 'inactive')
          .map((p) => {
          const imagePath = p.pet_image || p.imagePath || '';
          const cachedUrl = getCachedUrlIfFresh(imagePath);
          const placeholder = p.profileImage || `https://source.unsplash.com/random/400x300?${encodeURIComponent(p.pet_type || p.type || 'pet')}`;
          const legacy = typeof (p.image || '') === 'string' && /\/user\/\d+\/pet\/\d+\//.test(p.image || '');
          const ageText = p.pet_birth_dtm
            ? (() => {
                const dob = new Date(p.pet_birth_dtm);
                const now = new Date();
                const years = Math.max(0, Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
                return `${years} years`;
              })()
            : (typeof p.age === 'number' ? `${p.age} years` : (p.pet_age != null ? `${p.pet_age} years` : 'Unknown'));
          const weightDisplay = formatWeight(p);
          const petId = Number(p.id || p.pet_id);
          const lastCompletedAppt = appointmentsMap.get(petId);
          
          return {
            id: petId,
            name: p.name || p.pet_name || 'Pet',
            type: (p.type || p.pet_type || '').toString().toLowerCase(),
            breed: p.breed || p.pet_breed || '',
            age: ageText,
            weight: weightDisplay,
            gender: (p.gender || p.pet_gender || ''),
            birthday: p.birthday || p.pet_birth_dtm || p.pet_birthday || null,
            createdAt: p.createdAt || p.created_at || null,
            imagePath,
            image: cachedUrl || (legacy ? placeholder : (p.image || p.profileImage || 'https://placehold.co/600x400?text=Pet')),
            lastCheckup: lastCompletedAppt ? lastCompletedAppt.toISOString().slice(0, 10) : null,
            vaccinations: p.vaccinations || 'Unknown',
          };
        });
        
        // Enforce oldest-first ordering to avoid jumps
        rawPets = rawPets.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return da - db;
        });

        
        if (!isMounted) return;
        
        // Paint immediately with cached/placeholder images
        setPets(rawPets);
        // Persist for instant paint on next load
        if (petsCacheKey) {
          try {
            const sortedPets = rawPets.map(pet => ({ ...pet, createdAt: pet.createdAt || new Date().toISOString() }));
            sortedPets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            localStorage.setItem(petsCacheKey, JSON.stringify(sortedPets));
          } catch {}
        }
        if (rawPets.length > 0 && !selectedPetForAI) {
          setSelectedPetForAI(rawPets[0]);
        }

        // Phase 2: for pets missing a fresh signed URL, fetch in background and patch state incrementally
        const missing = rawPets.filter((p) => p.imagePath && !getCachedUrlIfFresh(p.imagePath));
        if (missing.length) {
          // Fire all requests concurrently but update state as each resolves
          missing.forEach(async (p) => {
            try {
              const url = await getSignedUrlForPath(p.imagePath);
              if (url) {
                setPets((prev) => prev.map((x) => (x.id === p.id ? { ...x, image: url } : x)));
                // Also refresh the persisted cache snapshot
                if (petsCacheKey) {
                  try {
                    const snapshot = JSON.parse(localStorage.getItem(petsCacheKey) || '[]');
                    const updated = snapshot.map((x) => (x.id === p.id ? { ...x, image: url } : x));
                    localStorage.setItem(petsCacheKey, JSON.stringify(updated));
                  } catch {}
                }
              }
            } catch (e) {
              // Ignore individual image failures
            }
          });
        }
      } catch (e) {
        console.error('Failed to load pets:', e);
        if (isMounted) {
          setPets([]);
        }
      }
    };
    
    loadPets();
    
    return () => {
      isMounted = false;
    };
  }, [authLoading, currentUser, authFetch]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning! ☀️';
    if (hour < 17) return 'Good Afternoon! 🌤️';
    return 'Good Evening! 🌙';
  };

  const getAIPetCareTips = () => {
    const tips = [];
    const currentDate = new Date();
    const currentSeason = getCurrentSeason();
    const currentHour = currentDate.getHours();
    
    pets.forEach(pet => {
      const petAge = parseInt(pet.age);
      const petWeight = parseInt(pet.weight);
      
      // Walking & Activity Tips
      if (pet.type === 'dog') {
        const walkingTime = pet.breed === 'Golden Retriever' ? '90-120' : 
                           pet.breed === 'Labrador' ? '60-90' : '45-60';
        tips.push({
          id: `walking-${pet.id}`,
          petName: pet.name,
          petType: pet.type,
          icon: FaRunning,
          color: 'blue',
          title: `${pet.name}'s Daily Walking Plan`,
          tip: `${pet.breed}s like ${pet.name} (${pet.age}) need ${walkingTime} minutes of walking daily. ${currentSeason === 'summer' ? 'Walk during cooler morning/evening hours to prevent overheating.' : currentSeason === 'winter' ? 'Indoor activities and shorter outdoor walks are recommended.' : 'Perfect weather for outdoor activities!'}`,
          aiGenerated: true
        });
      } else if (pet.type === 'cat') {
        tips.push({
          id: `activity-${pet.id}`,
          petName: pet.name,
          petType: pet.type,
          icon: FaCat,
          color: 'blue',
          title: `${pet.name}'s Mental Stimulation`,
          tip: `${pet.breed} cats like ${pet.name} are ${petAge < 3 ? 'young and energetic' : petAge > 7 ? 'mature and need gentle activities' : 'in their prime'}. Provide 15-20 minutes of interactive play ${currentHour < 12 ? 'this morning' : currentHour < 18 ? 'this afternoon' : 'this evening'} with feather toys or laser pointers.`,
          aiGenerated: true
        });
      }

      // Nutrition Tips
      const feedingSchedule = pet.type === 'dog' ? (petAge < 1 ? '3-4 times daily' : '2 times daily') : 
                             pet.type === 'cat' ? (petAge < 1 ? '3-4 times daily' : '2-3 times daily') : '2 times daily';
      tips.push({
        id: `nutrition-${pet.id}`,
        petName: pet.name,
        petType: pet.type,
        icon: FaUtensils,
        color: 'green',
        title: `${pet.name}'s Nutrition Guide`,
        tip: `For a ${petAge}-year-old ${pet.breed} weighing ${pet.weight}, feed ${feedingSchedule}. ${petWeight > 70 ? 'Monitor portion sizes to maintain healthy weight.' : petWeight < 10 ? 'Small frequent meals are ideal.' : 'Current weight seems optimal.'} ${currentSeason === 'winter' ? 'Pets may need slightly more calories in cold weather.' : 'Ensure fresh water is always available.'}`,
        aiGenerated: true
      });

      // Health & Grooming Tips
      const groomingFreq = pet.type === 'dog' ? (pet.breed.includes('Retriever') ? 'weekly' : 'bi-weekly') : 'daily';
      tips.push({
        id: `grooming-${pet.id}`,
        petName: pet.name,
        petType: pet.type,
        icon: FaCut,
        color: 'blue',
        title: `${pet.name}'s Grooming Schedule`,
        tip: `${pet.breed}s require ${groomingFreq} brushing. ${pet.type === 'dog' ? 'Check ears weekly and trim nails monthly.' : 'Daily brushing prevents matting and reduces shedding.'} ${currentSeason === 'spring' ? 'Shedding season - brush more frequently!' : currentSeason === 'summer' ? 'Consider a summer trim for comfort.' : 'Regular grooming maintains healthy coat.'}`,
        aiGenerated: true
      });

      // Health Monitoring
      const lastCheckupDate = new Date(pet.lastCheckup);
      const daysSinceCheckup = Math.floor((currentDate - lastCheckupDate) / (1000 * 60 * 60 * 24));
      tips.push({
        id: `health-${pet.id}`,
        petName: pet.name,
        petType: pet.type,
        icon: FaHeartbeat,
        color: 'green',
        title: `${pet.name}'s Health Monitoring`,
        tip: `Last checkup was ${daysSinceCheckup} days ago. ${daysSinceCheckup > 365 ? 'Annual checkup is overdue!' : daysSinceCheckup > 180 ? 'Consider scheduling next checkup soon.' : 'Health checkup is up to date.'} ${petAge > 7 ? 'Senior pets need bi-annual checkups.' : 'Watch for changes in appetite, energy, or behavior.'} Vaccinations: ${pet.vaccinations}.`,
        aiGenerated: true
      });

      // Behavioral & Training Tips
      if (pet.type === 'dog') {
        tips.push({
          id: `training-${pet.id}`,
          petName: pet.name,
          petType: pet.type,
          icon: FaBrain,
          color: 'blue',
          title: `${pet.name}'s Training Focus`,
          tip: `${petAge < 2 ? 'Young dogs benefit from basic obedience training and socialization.' : petAge < 5 ? 'Perfect age for advanced training and new tricks.' : 'Maintain mental stimulation with puzzle games.'} ${pet.breed === 'Golden Retriever' ? 'Retrievers excel at fetch and water activities.' : pet.breed === 'Labrador' ? 'Labs love learning new commands and tasks.' : 'Consistent positive reinforcement works best.'}`,
          aiGenerated: true
        });
      }

      // Seasonal Care Tips
      tips.push({
        id: `seasonal-${pet.id}`,
        petName: 'All Pets',
        petType: pet.type,
        icon: FaThermometerHalf,
        color: 'green',
        title: `${getCurrentSeason().charAt(0).toUpperCase() + getCurrentSeason().slice(1)} Care for ${pet.name}`,
        tip: getSeasonalTip(pet, getCurrentSeason()),
        aiGenerated: true
      });
    });

    // Multi-pet household tips
    if (pets.length > 1) {
      tips.push({
        id: 'multi-pet-harmony',
        petName: 'All Pets',
        petType: 'general',
        icon: FaHeart,
        color: 'blue',
        title: 'Multi-Pet Household Harmony',
        tip: `Managing ${pets.length} pets requires individual attention and resources. Ensure separate feeding areas, provide multiple water sources, and create individual safe spaces. ${pets.some(p => p.type === 'dog') && pets.some(p => p.type === 'cat') ? 'Dogs and cats can coexist peacefully with proper introduction and supervision.' : 'Similar pets may compete for attention - rotate one-on-one time.'}`,
        aiGenerated: true
      });

      tips.push({
        id: 'multi-pet-schedule',
        petName: 'All Pets',
        petType: 'general',
        icon: FaClock,
        color: 'blue',
        title: 'Daily Routine Management',
        tip: `With multiple pets, establish consistent daily routines. ${currentHour < 8 ? 'Morning feeding time approaching!' : currentHour < 12 ? 'Mid-morning activity time.' : currentHour < 18 ? 'Afternoon play session recommended.' : 'Evening wind-down time.'} Stagger activities to give each pet individual attention and prevent overwhelming.`,
        aiGenerated: true
      });
    }

    return tips.slice(0, 9); // Limit to 9 tips for better UI
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const getSeasonalTip = (pet, season) => {
    const seasonTips = {
      spring: `Spring is shedding season for ${pet.name}! Increase brushing frequency and watch for seasonal allergies. Perfect time for outdoor activities and fresh air.`,
      summer: `Keep ${pet.name} cool and hydrated. ${pet.type === 'dog' ? 'Avoid hot pavement and provide shade during walks.' : 'Ensure cool indoor spaces and fresh water.'} Never leave pets in cars.`,
      fall: `Prepare ${pet.name} for cooler weather. ${pet.type === 'dog' ? 'Consider a light jacket for short-haired breeds.' : 'Indoor cats may become more active as temperatures drop.'} Check heating systems are pet-safe.`,
      winter: `Winter care for ${pet.name}: ${pet.type === 'dog' ? 'Protect paws from salt and ice, limit outdoor time in extreme cold.' : 'Provide warm sleeping areas and maintain indoor humidity.'} Watch for dry skin and static.`
    };
    return seasonTips[season];
  };

  // Pets are loaded from the API and stored in state

  // Memoize AI tips to avoid recomputation on every render
  const tipsMemo = useMemo(() => getAIPetCareTips(), [pets, currentTime]);

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Modern Header with Dynamic Greeting */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 rounded-3xl p-8 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-blue-200/20 to-indigo-100/20"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-500 to-[#145ae6] p-4 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
                    <FaPaw className="text-white text-3xl" />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 animate-bounce">
                    <FaMagic className="text-yellow-800 text-xs" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-[#145ae6] to-indigo-600 bg-clip-text text-transparent mb-2">
                    {getGreeting()}
                  </h1>
                  <p className="text-gray-600 text-lg">Your furry friends are excited to see you!</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex -space-x-2">
                      {pets.map((pet, index) => (
                        <div key={pet.id} className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden " style={{ zIndex: pets.length - index }}>
                          <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">{pets.length} pets waiting for you</span>
                  </div>
                </div>
              </div>
              {/* Advertisement Section */}
              <div className="hidden md:flex items-center gap-4">
                {/* Premium Pet Food Ad */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg group-">
                      <FaBone className="text-white text-lg" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-green-800">Premium Pet Food</div>
                      <div className="text-xs text-green-600">20% OFF Today!</div>
                    </div>
                  </div>
                </div>

                {/* Vet Services Ad */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 rounded-lg group-">
                      <FaStethoscope className="text-white text-lg" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-blue-800">Vet Checkup</div>
                      <div className="text-xs text-blue-600">Book Now!</div>
                    </div>
                  </div>
                </div>

                {/* Pet Toys Ad */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-[#145ae6] p-2 rounded-lg group-">
                      <FaStar className="text-white text-lg" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-blue-800">New Toys</div>
                      <div className="text-xs text-blue-600">Free Shipping</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Quick Actions Overview */}
        <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 rounded-2xl p-4 border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              onClick={() => navigate('/user/community')}
              className="group bg-white rounded-xl p-3 text-center border border-orange-100 hover:shadow-md transition-all duration-300  hover:border-orange-200"
            >
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 group-">
                <FaHeart className="text-orange-600 text-lg" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Community</h3>
            </button>

            <button
              onClick={() => navigate('/user/appointments/new')}
              className="group bg-white rounded-xl p-3 text-center border border-blue-100 hover:shadow-md transition-all duration-300  hover:border-blue-200"
            >
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 group-">
                <FaCalendarCheck className="text-[#145ae6] text-lg" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Book Service</h3>
            </button>

            <button
              onClick={() => navigate('/user/marketplace')}
              className="group bg-white rounded-xl p-3 text-center border border-blue-100 hover:shadow-md transition-all duration-300  hover:border-blue-200"
            >
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 group-">
                <FaShoppingCart className="text-blue-600 text-lg" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Shop</h3>
            </button>

            <button
              onClick={() => {
                setShowAIPopup(true);
                // Set active service to suggestions when opening AI Care
                setActiveService('suggestions');
              }}
              className="group bg-white rounded-xl p-3 text-center border border-green-100 hover:shadow-md transition-all duration-300  hover:border-green-200"
            >
              <div className="bg-gradient-to-br from-green-100 to-green-200 w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 group-">
                <FaHeart className="text-green-600 text-lg" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">AI Care</h3>
            </button>

            <button
              onClick={() => {
                setShowAIPopup(true);
                // Set active service to symptom-checker when opening Symptom Checker
                setActiveService('symptom-checker');
              }}
              className="group bg-white rounded-xl p-3 text-center border border-red-100 hover:shadow-md transition-all duration-300  hover:border-red-200"
            >
              <div className="bg-gradient-to-br from-red-100 to-red-200 w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 group-">
                <FaStethoscope className="text-red-600 text-lg" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">Symptom Checker</h3>
            </button>
          </div>
        </div>

        {/* Main Content Grid with Enhanced Styling */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column - Pet Health Cards with Smart Insights */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-pink-50">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-red-500 p-2 rounded-xl">
                  <FaHeart className="text-white text-lg" />
                </div>
                My Pets Health
                <div className="ml-auto bg-pink-100 text-pink-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {pets.length} pets
                </div>
              </h2>
              {/* Pet Health Cards with Individual Smart Insights */}
              <div className="space-y-6">
                {pets.map((pet) => {
                  const lastCheckupDate = new Date(pet.lastCheckup);
                  const daysSinceCheckup = Math.floor((new Date() - lastCheckupDate) / (1000 * 60 * 60 * 24));
                  const age = parseInt(pet.age);

                  // Health status based on actual pet data
                  const healthStatus = daysSinceCheckup < 90 ? 'excellent' : daysSinceCheckup < 180 ? 'good' : 'needs-attention';
                  const statusColors = {
                    excellent: { bg: 'from-green-50 to-emerald-50', border: 'border-green-100', dot: 'bg-green-400', text: 'text-green-800', desc: 'text-green-700' },
                    good: { bg: 'from-yellow-50 to-orange-50', border: 'border-yellow-100', dot: 'bg-yellow-400', text: 'text-yellow-800', desc: 'text-yellow-700' },
                    'needs-attention': { bg: 'from-red-50 to-pink-50', border: 'border-red-100', dot: 'bg-red-400', text: 'text-red-800', desc: 'text-red-700' }
                  };
                  const colors = statusColors[healthStatus];

                  return (
                    <div key={pet.id} className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-pink-50">
                      {/* Pet Health Card */}
                      <div className="transform  mb-4">
                        <PetHealthCard pet={pet} />
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Middle Column - Schedule and Reminders */}
          <div className="lg:col-span-1 space-y-4">
            {/* Today's Schedule - Pass pets data to prevent duplicate loading */}
            <UpcomingSchedule pets={pets} accessToken={accessToken} />

            {/* Care Reminders */}
            <div className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-50 relative">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-[#145ae6] p-2 rounded-xl">
                  <FaBell className="text-white text-lg" />
                </div>
                Care Reminders
                <div className="ml-auto flex items-center gap-2">
                  <div className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Upcoming
                  </div>
                  <button
                    onClick={() => careRemRef.current?.openAddModal?.()}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm transition-colors"
                    aria-label="Add reminder"
                    title="Add reminder"
                  >
                    <FaPlus className="text-xs" />
                  </button>
                </div>
              </h2>
              <CareReminders ref={careRemRef} pets={pets} initialItems={dashboardData?.reminders || null} />
            </div>

          </div>

          {/* Right Column - AI Pet Care Tips */}
          <div className="lg:col-span-1 space-y-4">
            {/* Enhanced Pet Activity Tracker with Carousel */}
            <PetActivityTracker pets={pets} />

            {/* AI Pet Care Tips Section */}
            <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-500 border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-2 rounded-xl shadow-lg">
                    <FaRobot className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                      AI Pet Care Tips
                    </h2>
                    <p className="text-gray-600 text-xs">Personalized recommendations 🤖</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllTips(!showAllTips)}
                  className="flex items-center gap-1 bg-white/70 hover:bg-white backdrop-blur-sm rounded-lg px-3 py-1.5 border border-orange-200 hover:border-orange-300 transition-all duration-200 text-xs font-medium text-orange-700 hover:text-orange-800"
                >
                  {showAllTips ? (
                    <>
                      <FaMinus className="text-xs" />
                      <span>Less</span>
                    </>
                  ) : (
                    <>
                      <FaArrowRight className="text-xs" />
                      <span>More</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tipsMemo.slice(0, showAllTips ? undefined : 3).map((tip) => {
                  const IconComponent = tip.icon;
                  const colorClasses = {
                    blue: {
                      bg: 'from-blue-100 to-blue-200',
                      text: 'text-blue-600',
                      border: 'hover:border-blue-200',
                      gradient: 'from-blue-400 to-[#145ae6]'
                    },
                    pink: {
                      bg: 'from-pink-100 to-pink-200',
                      text: 'text-pink-600',
                      border: 'hover:border-pink-200',
                      gradient: 'from-pink-400 to-pink-600'
                    },
                    purple: {
                      bg: 'from-purple-100 to-purple-200',
                      text: 'text-purple-600',
                      border: 'hover:border-purple-200',
                      gradient: 'from-purple-400 to-purple-600'
                    },
                    green: {
                      bg: 'from-green-100 to-green-200',
                      text: 'text-green-600',
                      border: 'hover:border-green-200',
                      gradient: 'from-green-400 to-green-600'
                    }
                  };
                  const colors = colorClasses[tip.color];

                  return (
                    <div key={tip.id} className={`group bg-white rounded-lg p-3 shadow-sm border border-orange-50 hover:shadow-md transition-all duration-300 ${colors.border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`bg-gradient-to-br ${colors.bg} p-1.5 rounded-lg group-`}>
                          <IconComponent className={`${colors.text} text-sm`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800 text-xs truncate">{tip.title}</h3>
                            {tip.aiGenerated && (
                              <div className="bg-gradient-to-r from-blue-400 to-purple-500 text-white text-xs px-1 py-0.5 rounded-full flex-shrink-0">
                                AI
                              </div>
                            )}
                          </div>
                          <div className={`w-6 h-0.5 bg-gradient-to-r ${colors.gradient} rounded-full mt-1`}></div>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed text-xs mb-2" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tip.tip}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 truncate">For: {tip.petName}</span>
                        <div className={`${colors.text} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                          <FaPlay className="text-xs" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!showAllTips && tipsMemo.length > 3 && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    Showing 3 of {tipsMemo.length} tips
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-40">
          <button
            onClick={() => {
              setShowAIPopup(true);
              setActiveService('suggestions');
            }}
            className="group bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
            title="AI Pet Care"
          >
            <div className="relative">
              <FaHeart className="text-2xl" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              AI Pet Care
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
            </div>
          </button>
        </div>

        {/* AI Assistant Popup */}
        <AIAssistantPopup 
          isOpen={showAIPopup}
          onClose={() => setShowAIPopup(false)}
          pets={pets}
          initialActiveService={activeService}
        />
      </div>
    </UserLayout>
  );
};

export default UserDashboard;