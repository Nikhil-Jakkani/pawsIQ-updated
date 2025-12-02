import React, { useState, useEffect, useMemo, useRef } from 'react';

import { FaHeart, FaWeight, FaBirthdayCake, FaSyringe, FaStethoscope, FaCalendarCheck, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { PetIcon } from '../layout/PetIcons';
import { generatePetCareSuggestions } from '../../services/geminiService';

const PetHealthCard = ({ pet }) => {
  const navigate = useNavigate();
  const [showInsights, setShowInsights] = useState(false);

  const getHealthStatus = (pet) => {
    const today = new Date();
    const lastCheckup = new Date(pet.lastCheckup);
    const daysSinceCheckup = Math.floor((today - lastCheckup) / (1000 * 60 * 60 * 24));

    if (daysSinceCheckup < 90) return { status: 'excellent', color: 'green', message: 'Great health!' };
    if (daysSinceCheckup < 180) return { status: 'good', color: 'yellow', message: 'Checkup due soon' };
    return { status: 'needs-attention', color: 'red', message: 'Checkup overdue' };
  };

  const healthStatus = getHealthStatus(pet);

  const today = new Date();
  const lastCheckupDate = new Date(pet.lastCheckup);
  const daysSinceCheckup = Math.floor((today - lastCheckupDate) / (1000 * 60 * 60 * 24));

  const [ai, setAi] = useState({ loading: false, error: '', data: null });
  const lastPetIdRef = useRef(pet?.id);

  useEffect(() => {
    if (lastPetIdRef.current !== pet?.id) {
      lastPetIdRef.current = pet?.id;
      setAi({ loading: false, error: '', data: null });
    }
  }, [pet?.id]);

  const petPayload = useMemo(() => ({
    id: pet?.id,
    name: pet?.name,
    type: pet?.type,
    breed: pet?.breed,
    age: pet?.age,
    weight: pet?.weight,
    gender: pet?.gender,
    lastCheckup: pet?.lastCheckup,
    vaccinations: pet?.vaccinations,
  }), [
    pet?.id,
    pet?.name,
    pet?.type,
    pet?.breed,
    pet?.age,
    pet?.weight,
    pet?.gender,
    pet?.lastCheckup,
    pet?.vaccinations,
  ]);

  const parseMaybeJson = (value) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (_) {
        return value;
      }
    }
    return value;
  };

  const normalizeKey = (key = '') => key.toString().toLowerCase().replace(/[^a-z]/g, '');

  const categoryAliases = {
    health: ['healthrecommendations', 'wellness', 'medical', 'generalhealth', 'overallhealth'],
    grooming: ['groomingcare', 'coatcare', 'hygiene'],
    vaccinations: ['vaccination', 'shots', 'immunization', 'immunisations'],
    nutrition: ['diet', 'food', 'mealplan', 'nutritional', 'feeding'],
    exercise: ['activity', 'fitness', 'workout', 'trainingplan'],
    behavioral: ['behavior', 'behaviour', 'training', 'enrichment'],
    preventive: ['preventative', 'proactive', 'safety', 'seasonalcare']
  };

  const matchesCategory = (needle, haystackKey) => {
    const normalizedNeedle = normalizeKey(needle);
    const normalizedHaystack = normalizeKey(haystackKey);
    if (!normalizedNeedle || !normalizedHaystack) return false;
    if (normalizedNeedle === normalizedHaystack) return true;
    if (normalizedNeedle.includes(normalizedHaystack) || normalizedHaystack.includes(normalizedNeedle)) return true;
    const aliases = categoryAliases[needle] || [];
    return aliases.some((alias) => normalizedHaystack.includes(alias));
  };

  const normalizeRecommendation = (item) => {
    if (item == null) return null;
    if (typeof item === 'string' || typeof item === 'number') {
      return {
        suggestion: String(item),
        details: '',
      };
    }
    if (typeof item === 'object') {
      const suggestion = item.suggestion || item.title || item.heading || item.name || item.tip || item.label || '';
      const details = item.details || item.description || item.text || item.tipDetails || item.summary || item.notes || '';
      return {
        ...item,
        suggestion: suggestion || details || '',
        details,
      };
    }
    return null;
  };

  const normalizeCategory = (rawEntry) => {
    if (rawEntry == null) return null;
    const entry = parseMaybeJson(rawEntry);

    if (Array.isArray(entry)) {
      const recommendations = entry.map(normalizeRecommendation).filter(Boolean);
      return recommendations.length ? { recommendations } : null;
    }

    if (typeof entry !== 'object') {
      const recommendations = [normalizeRecommendation(entry)].filter(Boolean);
      return recommendations.length ? { recommendations } : null;
    }

    const listCandidate = entry.recommendations
      || entry.items
      || entry.points
      || entry.list
      || entry.suggestions
      || entry.tips
      || entry.advice;

    const collection = listCandidate != null ? listCandidate : entry;
    const arr = Array.isArray(collection) ? collection : [collection];
    const recommendations = arr.map(normalizeRecommendation).filter(Boolean);

    return {
      ...entry,
      recommendations,
    };
  };

  const normalizeAiPayload = (payload) => {
    const base = parseMaybeJson(payload);
    if (!base || (typeof base !== 'object' && !Array.isArray(base))) return null;

    const stack = [base];
    const candidates = [];

    while (stack.length) {
      const current = parseMaybeJson(stack.pop());
      if (current == null) continue;
      if (Array.isArray(current)) {
        stack.push(...current);
        continue;
      }
      if (typeof current !== 'object') continue;
      candidates.push(current);
      ['data', 'payload', 'result', 'response', 'suggestions', 'insights', 'categories']
        .forEach((key) => {
          if (current[key] != null) stack.push(current[key]);
        });
    }

    const findCategoryValue = (targetKey) => {
      const normalizedTarget = normalizeKey(targetKey);
      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object') continue;
        if (candidate[targetKey]) return candidate[targetKey];
        for (const [key, value] of Object.entries(candidate)) {
          if (normalizeKey(key) === normalizedTarget || matchesCategory(targetKey, key)) return value;
        }
        if (candidate.category && (normalizeKey(candidate.category) === normalizedTarget || matchesCategory(targetKey, candidate.category))) {
          return candidate;
        }
        if (candidate.type && (normalizeKey(candidate.type) === normalizedTarget || matchesCategory(targetKey, candidate.type))) {
          return candidate;
        }
      }
      return null;
    };

    const normalized = {
      health: normalizeCategory(findCategoryValue('health')),
      grooming: normalizeCategory(findCategoryValue('grooming')),
      vaccinations: normalizeCategory(findCategoryValue('vaccinations')),
      nutrition: normalizeCategory(findCategoryValue('nutrition')),
      exercise: normalizeCategory(findCategoryValue('exercise')),
      behavioral: normalizeCategory(findCategoryValue('behavioral')),
      preventive: normalizeCategory(findCategoryValue('preventive')),
    };

    const hasData = Object.values(normalized).some(Boolean);
    if (hasData) return normalized;

    const fallbackCategory = normalizeCategory(base);
    if (fallbackCategory) {
      return { health: fallbackCategory };
    }

    return null;
  };

  const getRecommendations = (categoryData) => {
    if (!categoryData) return [];
    if (Array.isArray(categoryData)) {
      return categoryData.map(normalizeRecommendation).filter(Boolean);
    }
    if (Array.isArray(categoryData?.recommendations)) {
      return categoryData.recommendations.map(normalizeRecommendation).filter(Boolean);
    }
    if (categoryData.recommendations) {
      return [normalizeRecommendation(categoryData.recommendations)].filter(Boolean);
    }
    if (categoryData.suggestion || categoryData.details) {
      return [normalizeRecommendation(categoryData)].filter(Boolean);
    }
    const listCandidate = categoryData.items
      || categoryData.points
      || categoryData.list
      || categoryData.suggestions
      || categoryData.tips
      || categoryData.advice;
    if (Array.isArray(listCandidate)) {
      return listCandidate.map(normalizeRecommendation).filter(Boolean);
    }
    if (listCandidate) {
      return [normalizeRecommendation(listCandidate)].filter(Boolean);
    }
    return [];
  };

  const BulletList = ({ items = [], colorClass = '' }) => (
    <ul className="list-disc pl-5 space-y-1 text-xs">
      {(items || []).slice(0, 5).map((item, i) => {
        const content = (() => {
          if (typeof item === 'string' || typeof item === 'number') return <span>{item}</span>;
          if (item && typeof item === 'object') {
            const title = item.suggestion || item.title || item.heading || '';
            const details = item.details || item.description || item.text || '';
            return (
              <div className="space-y-0.5">
                {title && <span className="font-semibold text-gray-800">{title}</span>}
                {details && <span className="block text-gray-600 text-[11px] leading-snug">{details}</span>}
              </div>
            );
          }
          return null;
        })();

        return (
          <li key={i} className={colorClass}>
            {content}
          </li>
        );
      })}
    </ul>
  );

  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const fetchAI = async () => {
      if (!showInsights || ai.data || ai.loading) return;
      try {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        setAi((s) => ({ ...s, loading: true, error: '' }));

        const payload = await generatePetCareSuggestions({
          name: petPayload.name,
          type: petPayload.type,
          breed: petPayload.breed,
          age: petPayload.age,
          weight: petPayload.weight,
          gender: petPayload.gender,
          lastCheckup: petPayload.lastCheckup,
          vaccinations: petPayload.vaccinations,
        });
        if (cancelled || requestIdRef.current !== requestId) return;
        const normalized = normalizeAiPayload(payload);
        setAi({ loading: false, error: '', data: normalized });
      } catch (e) {
        if (cancelled) return;
        setAi({ loading: false, error: e?.message || 'Failed to load insights', data: null });
      }
    };

    fetchAI();
    return () => { cancelled = true; };
  }, [showInsights, petPayload, ai.data]);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)' }}>
      <div className="flex items-start gap-4">
        {/* Pet Image */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img
              src={pet.image}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${healthStatus.color === 'green' ? 'bg-green-400' :
            healthStatus.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'
            }`}>
            <FaHeart className="w-3 h-3 text-white m-auto mt-1" />
          </div>
        </div>

        {/* Pet Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>{pet.name}</span>
              {pet.breed && (
                <span className="text-sm font-normal text-gray-600">• {pet.breed}</span>
              )}
            </h3>
            <PetIcon type={pet.type} className="text-lg" style={{ color: '#145ae6' }} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            {pet.age && pet.age !== 'Unknown' && (
              <span className="text-sm font-medium text-gray-700">{pet.age}</span>
            )}
            {pet.age && pet.age !== 'Unknown' && pet.weight && pet.weight !== 'Unknown' && (
              <span className="text-gray-400">•</span>
            )}
            {pet.weight && pet.weight !== 'Unknown' && (
              <span className="text-sm font-medium text-gray-700">{pet.weight}</span>
            )}
          </div>






        </div>
      </div>

      {/* Health Stats Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1" style={{ color: '#145ae6' }}>
            <FaSyringe className="text-sm" />
            <span className="text-xs font-medium">Vaccines</span>
          </div>
          <p className="text-sm font-semibold text-gray-800">{pet.vaccinations}</p>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1" style={{ color: '#145ae6' }}>
            <FaStethoscope className="text-sm" />
            <span className="text-xs font-medium">Last Checkup</span>
          </div>
          <p className="text-sm font-semibold text-gray-800">
            {(() => {
              if (!pet.lastCheckup) {
                return (
                  <button
                    onClick={() => navigate(`/user/appointments/new?petId=${pet.id}`)}
                    className="text-xs underline hover:no-underline"
                    style={{ color: '#145ae6' }}
                  >
                    Book first appointment
                  </button>
                );
              }
              const d = new Date(pet.lastCheckup);
              const now = new Date();
              const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
              if (Number.isNaN(diffDays)) return 'Unknown';
              if (diffDays === 0) return 'Today';
              if (diffDays === 1) return '1 day ago';
              if (diffDays < 30) return `${diffDays} days ago`;
              const diffMonths = Math.floor(diffDays / 30);
              if (diffMonths === 1) return '1 month ago';
              if (diffMonths < 12) return `${diffMonths} months ago`;
              const diffYears = Math.floor(diffMonths / 12);
              return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
            })()}
          </p>
        </div>
      </div>

      {/* View More Insights Button */}
      <div className="mt-4">
        <button
          onClick={() => setShowInsights(!showInsights)}
          className="w-full flex items-center justify-center gap-2 rounded-lg p-3 border transition-all duration-200"
          style={{
            background: 'linear-gradient(to right, #f0f7ff, #e6f2ff)',
            borderColor: '#145ae6'
          }}
        >
          <div className="p-1.5 rounded-lg" style={{ background: '#145ae6' }}>
            <FaStethoscope className="text-white text-xs" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {showInsights ? 'Hide' : 'View'} AI Insights
          </span>
          <div className="text-white text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: '#145ae6' }}>
            AI
          </div>
          {showInsights ?
            <FaChevronUp className="text-gray-500 text-sm ml-auto" /> :
            <FaChevronDown className="text-gray-500 text-sm ml-auto" />
          }
        </button>

        {/* Pet Insights (Collapsible) */}
        {showInsights && (
          <div className="mt-3 space-y-2">
            {ai.loading && (
              <div className="text-xs text-gray-600">Generating insights for {pet.name}…</div>
            )}
            {ai.error && (
              <div className="text-xs text-red-600">{ai.error}</div>
            )}

            {ai.data && (
              <>
                {/* Health */}
                {ai.data.health && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border" style={{ borderColor: '#e3f2fd' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#145ae6' }}></div>
                      <span className="font-semibold text-sm" style={{ color: '#145ae6' }}>Health</span>
                      {ai.data.health.priority && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#e8eefc', color: '#145ae6' }}>{String(ai.data.health.priority)}</span>
                      )}
                    </div>
                    <BulletList items={getRecommendations(ai.data.health)} colorClass="text-blue-800" />
                    {ai.data.health.nextCheckup && (
                      <p className="text-[11px] mt-1 text-blue-700">Next checkup: {ai.data.health.nextCheckup}</p>
                    )}
                  </div>
                )}

                {/* Nutrition */}
                {ai.data.nutrition && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-green-800 text-sm">Nutrition</span>
                    </div>
                    <BulletList items={getRecommendations(ai.data.nutrition)} colorClass="text-green-800" />
                    {(ai.data.nutrition.dailyCalories || ai.data.nutrition.feedingSchedule) && (
                      <p className="text-[11px] mt-1 text-green-700">
                        {ai.data.nutrition.dailyCalories && `Calories: ${ai.data.nutrition.dailyCalories}. `}
                        {ai.data.nutrition.feedingSchedule && `Schedule: ${ai.data.nutrition.feedingSchedule}.`}
                      </p>
                    )}
                  </div>
                )}

                {/* Exercise */}
                {ai.data.exercise && (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 border border-yellow-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-yellow-800 text-sm">Exercise</span>
                    </div>
                    <BulletList items={getRecommendations(ai.data.exercise)} colorClass="text-yellow-800" />
                    {ai.data.exercise.duration && (
                      <p className="text-[11px] mt-1 text-yellow-700">Daily: {ai.data.exercise.duration}</p>
                    )}
                  </div>
                )}

                {/* Vaccinations */}
                {ai.data.vaccinations && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border" style={{ borderColor: '#ede9fe' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#7c3aed' }}></div>
                      <span className="font-semibold text-sm" style={{ color: '#5b21b6' }}>Vaccinations</span>
                    </div>
                    <BulletList items={getRecommendations(ai.data.vaccinations)} colorClass="text-purple-800" />
                    {ai.data.vaccinations.schedule && (
                      <p className="text-[11px] mt-1" style={{ color: '#5b21b6' }}>Schedule: {ai.data.vaccinations.schedule}</p>
                    )}
                  </div>
                )}

                {/* Preventive */}
                {ai.data.preventive && (
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-gray-800 text-sm">Preventive Care</span>
                    </div>
                    <BulletList items={getRecommendations(ai.data.preventive)} colorClass="text-gray-800" />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => navigate(`/user/appointments/new?petId=${pet.id}`)}
          className="flex-1 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 hover:bg-blue-600"
          style={{ backgroundColor: '#145ae6' }}
        >
          <FaCalendarCheck />
          Book Checkup
        </button>
        <button
          onClick={() => navigate(`/user/pets/${pet.id}`)}
          className="flex-1 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors hover:bg-blue-600"
          style={{ backgroundColor: '#145ae6' }}
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default PetHealthCard;