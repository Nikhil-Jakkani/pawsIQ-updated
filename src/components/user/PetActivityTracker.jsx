import React, { useEffect, useMemo, useState } from 'react';
import { FaRunning, FaBone, FaPlay, FaChartLine, FaChevronLeft, FaChevronRight, FaPaw, FaPlus, FaTimes, FaWater, FaBed, FaCheck, FaHeart, FaSmile } from 'react-icons/fa';

// Accept pets and optional realtime fetcher via props
const PetActivityTracker = ({ pets: petsProp = [], fetchActivities }) => {
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [activityType, setActivityType] = useState('walking'); // renamed from exercise
  const [activityValue, setActivityValue] = useState('');
  const [activityNote, setActivityNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [foodImage, setFoodImage] = useState(null); // { base64, preview }
  const [nutrition, setNutrition] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Map incoming pets to minimal structure this component needs
  const pets = useMemo(() => {
    const fallback = [
      { 
        name: 'Max', 
        breed: 'Golden Retriever', 
        type: 'dog',
        image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=60',
        color: 'from-amber-500 to-orange-600'
      },
      { 
        name: 'Luna', 
        breed: 'Siamese Cat', 
        type: 'cat',
        image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=60',
        color: 'from-purple-500 to-blue-600'
      }
    ];
    const list = (Array.isArray(petsProp) && petsProp.length ? petsProp : fallback).map((p, idx) => ({
      name: p.name || `Pet ${idx + 1}`,
      breed: p.breed || '',
      type: (p.type || '').toLowerCase(),
      image: p.image || p.imagePath || 'https://placehold.co/100x100?text=Pet',
      color: p.color || (idx % 2 ? 'from-purple-500 to-blue-600' : 'from-amber-500 to-orange-600')
    }));
    return list;
  }, [petsProp]);

  // Local simulated activity store keyed by pet name
  const [activities, setActivities] = useState(() => ({
    [pets[0]?.name || 'Max']: {
      today: {
        walking: { value: 45, goal: 60, unit: 'min' },
        food: { value: 2, goal: 3, unit: 'portions' },
        play: { value: 30, goal: 45, unit: 'min' }
      },
      week: [
        { day: 'Mon', walking: 60, food: 3, play: 45 },
        { day: 'Tue', walking: 45, food: 3, play: 30 },
        { day: 'Wed', walking: 55, food: 2, play: 40 },
        { day: 'Thu', walking: 40, food: 3, play: 35 },
        { day: 'Fri', walking: 50, food: 3, play: 50 },
        { day: 'Sat', walking: 70, food: 3, play: 60 },
        { day: 'Sun', walking: 45, food: 2, play: 30 }
      ]
    }
  }));

  // Optional realtime polling hook (every 20s) if fetchActivities provided
  useEffect(() => {
    if (!fetchActivities) return;
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchActivities(); // expected shape should match setActivities
        if (mounted && data) setActivities(data);
      } catch {}
    };
    load();
    const id = setInterval(load, 20000);
    return () => { mounted = false; clearInterval(id); };
  }, [fetchActivities]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'walking': return FaRunning;
      case 'food': return FaBone;
      case 'play': return FaPlay;
      case 'water': return FaWater;
      case 'sleep': return FaBed;
      default: return FaRunning;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'walking': return 'text-red-600 bg-red-100';
      case 'food': return 'text-orange-600 bg-orange-100';
      case 'water': return 'text-blue-600 bg-blue-100';
      case 'sleep': return 'text-purple-600 bg-purple-100';
      case 'play': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  const getActivityUnit = (type) => {
    switch (type) {
      case 'walking': return 'min';
      case 'food': return 'portions';
      case 'water': return 'cups';
      case 'sleep': return 'hours';
      case 'play': return 'min';
      default: return '';
    }
  };
  
  const handleSubmitActivity = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentPetName = pets[currentPetIndex].name;

      // If food activity, persist calories only
      if (activityType === 'food') {
        const calories = parseInt(activityValue || '0', 10);
        try {
          const mod = await import('../../services/nutritionService');
          await mod.saveFoodCalories({
            pet_id: currentPetIndex + 1, // TODO: replace with real pet_id from your store
            calories,
            note: activityNote || undefined,
            image_url: foodImage?.preview || undefined,
          });
        } catch (err) {
          console.error('Failed to save food calories:', err);
        }
      }

      // Local UI update simulation (keeps UI in sync immediately)
      setActivities((prev) => {
        const copy = { ...(prev || {}) };
        copy[currentPetName] = copy[currentPetName] || { today: {}, week: [] };
        const today = copy[currentPetName].today;
        const currentActivity = today[activityType];
        if (currentActivity) {
          currentActivity.value = Math.min(
            parseInt(currentActivity.value) + parseInt(activityValue || 0),
            (currentActivity.goal || 0) * 1.5 || 9999
          );
        } else {
          today[activityType] = {
            value: parseInt(activityValue || 0),
            goal: Math.max(10, parseInt(activityValue || 0) * 1.2),
            unit: getActivityUnit(activityType)
          };
        }
        return { ...copy };
      });

      setShowPopup(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setActivityValue('');
      setActivityNote('');
      setFoodImage(null);
      setNutrition(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const currentPet = pets[currentPetIndex];
  const currentPetData = activities[currentPet?.name] || { today: {}, week: [] };

  const nextPet = () => {
    const nextIndex = (currentPetIndex + 1) % pets.length;
    setCurrentPetIndex(nextIndex);
  };

  const prevPet = () => {
    const prevIndex = currentPetIndex === 0 ? pets.length - 1 : currentPetIndex - 1;
    setCurrentPetIndex(prevIndex);
  };

  const selectPet = (index) => {
    setCurrentPetIndex(index);
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-3 border border-gray-100">
      {/* Success Toast */}
      {showSuccess && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full z-50 animate-bounce">
          <div className="bg-green-500 text-white px-4 py-2 rounded-t-lg rounded-b-lg shadow-lg flex items-center gap-2">
            <FaCheck className="text-white" />
            <span>Activity logged successfully!</span>
          </div>
        </div>
      )}
      
      {/* Activity Log Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 relative animate-scaleIn">
            {/* Close button */}
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
            
            {/* Popup header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                <FaPaw className="text-indigo-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Log {pets[currentPetIndex].name}'s Activity</h3>
              <p className="text-gray-500 text-sm mt-1">Keep track of your pet's daily activities</p>
            </div>
            
            {/* Activity form */}
            <form onSubmit={handleSubmitActivity}>
              {/* Activity type selector */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {['walking', 'food', 'water', 'play', 'sleep'].map((type) => {
                    const IconComponent = getActivityIcon(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setActivityType(type)}
                        className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${
                          activityType === type 
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className={`h-5 w-5 ${activityType === type ? 'text-indigo-500' : 'text-gray-400'}`} />
                        <span className="mt-1 text-xs font-medium capitalize">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Amount/Portion input */}
              <div className="mb-5">
                <label htmlFor="activityValue" className="block text-sm font-medium text-gray-700 mb-2">
                  {activityType === 'food' ? 'Portion of meal' : 'Amount'} ({getActivityUnit(activityType)})
                </label>
                <input
                  type="number"
                  id="activityValue"
                  value={activityValue}
                  onChange={(e) => setActivityValue(e.target.value)}
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={activityType === 'food' ? 'Enter portion count' : `Enter ${activityType} amount`}
                />
              </div>
              
              {/* Notes input */}
              <div className="mb-6">
                <label htmlFor="activityNote" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  id="activityNote"
                  value={activityNote}
                  onChange={(e) => setActivityNote(e.target.value)}
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add any notes about this activity"
                ></textarea>
              </div>

              {/* Nutrition analyzer (visible when food selected) */}
              {activityType === 'food' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Analyze food from image</label>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
                      <span className="text-sm text-gray-700">Choose / Capture</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setFoodImage({ base64: reader.result, preview: reader.result });
                            setNutrition(null);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!foodImage?.base64) return;
                        try {
                          setAnalyzing(true);
                          const mod = await import('../../services/nutritionService');
                          const data = await mod.analyzeFoodImage({ base64: String(foodImage.base64) });
                          setNutrition(data);
                          // Auto-fill amount with calories only
                          if (typeof data?.calories === 'number') {
                            setActivityType('food');
                            setActivityValue(String(Math.max(1, Math.round(data.calories))));
                          }
                        } catch (e) {
                          console.error(e);
                        } finally {
                          setAnalyzing(false);
                        }
                      }}
                      disabled={!foodImage || analyzing}
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded-md disabled:opacity-50"
                    >
                      {analyzing ? 'Analyzing…' : 'Analyze'}
                    </button>
                  </div>
                  {foodImage?.preview && (
                    <div className="mt-3 flex items-center gap-3">
                      <img src={foodImage.preview} alt="food" className="w-16 h-16 object-cover rounded border" />
                      {nutrition && (
                        <div className="text-xs text-gray-700">
                          <div className="font-semibold">{nutrition.name} ({Math.round((nutrition.confidence||0)*100)}%)</div>
                          <div>Calories: {nutrition.calories}</div>
                          <div className="italic text-gray-500">Amount auto-filled with calories. You can edit if needed.</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || !activityValue}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    Log Activity
                  </>
                )}
              </button>
              
              {/* Pet illustration */}
              <div className="mt-6 text-center">
                <div className="inline-block">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden mx-auto border-2 border-indigo-100">
                      <img 
                        src={pets[currentPetIndex].image} 
                        alt={pets[currentPetIndex].name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-1">
                      <FaHeart className="text-white text-xs" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Keeping {pets[currentPetIndex].name} happy & healthy!</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-1.5 rounded-lg shadow-sm flex-shrink-0">
            <FaChartLine className="text-white text-sm" />
          </div>
          <div className="min-w-0">
            <h2 className="text-md font-bold text-gray-800">Activity Tracker</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">
            Live
          </div>
          <button 
            onClick={() => setShowPopup(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm transition-colors flex-shrink-0"
            aria-label="Log activity"
          >
            <FaPlus className="text-xs" />
          </button>
        </div>
      </div>

      {/* Pet Carousel Header */}
      <div className="mb-4">

        {/* Compact Pet Selector */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <img 
                  src={currentPet.image} 
                  alt={currentPet.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">{currentPet.name}</h3>
                <p className="text-xs text-gray-500">{currentPet.breed}</p>
              </div>
            </div>
            
            {pets.length > 1 && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={prevPet}
                  className="p-1 rounded-full bg-white hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  <FaChevronLeft className="text-gray-600 text-xs" />
                </button>
                <span className="text-xs text-gray-500 px-2">{currentPetIndex + 1}/{pets.length}</span>
                <button 
                  onClick={nextPet}
                  className="p-1 rounded-full bg-white hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  <FaChevronRight className="text-gray-600 text-xs" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Today's Progress</h3>
        
        <div className="space-y-2">
          {Object.entries(currentPetData.today).map(([activity, data]) => {
            const IconComponent = getActivityIcon(activity);
            const percentage = Math.min((data.value / data.goal) * 100, 100);
            
            return (
              <div key={activity} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getActivityColor(activity)} flex-shrink-0`}>
                    <IconComponent className="text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800 capitalize">{activity}</span>
                      <span className="text-xs text-gray-500">{data.value}/{data.goal} {data.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                    percentage >= 100 ? 'bg-green-100 text-green-700' : 
                    percentage >= 75 ? 'bg-yellow-100 text-yellow-700' : 
                    percentage >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {Math.round(percentage)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Compact Daily Summary */}
        <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-800">Daily Summary</h4>
              <p className="text-xs text-gray-600">{currentPet.name}'s progress</p>
            </div>
            <div className="text-right">
              {(() => {
                const totalActivities = Object.keys(currentPetData.today).length;
                const completedActivities = Object.values(currentPetData.today).filter(
                  data => (data.value / data.goal) >= 1
                ).length;
                const overallPercentage = Math.round(
                  Object.values(currentPetData.today).reduce(
                    (sum, data) => sum + Math.min((data.value / data.goal) * 100, 100), 0
                  ) / totalActivities
                );
                
                return (
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {completedActivities}/{totalActivities}
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                      overallPercentage >= 80 ? 'bg-green-100 text-green-700' :
                      overallPercentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {overallPercentage}%
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default PetActivityTracker;