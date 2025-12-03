const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const getToken = () => {
  try {
    const raw = localStorage.getItem('authTokens');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.access?.token) return parsed.access.token;
    }
  } catch (_) { }
  try {
    const legacy = localStorage.getItem('pawsiq_user');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      return parsed?.tokens?.access?.token || null;
    }
  } catch (_) { }
  return null;
};

export const generatePetCareSuggestions = async (petData, authFetchInstance) => {
  try {
    if (!petData || typeof petData !== 'object') {
      throw new Error('Pet information is required to fetch insights.');
    }

    const requestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(petData),
    };

    let response;
    if (typeof authFetchInstance === 'function') {
      response = await authFetchInstance(`${API_URL}/user/ai/suggestions`, requestInit);
    } else {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }
      requestInit.headers.Authorization = `Bearer ${token}`;
      response = await fetch(`${API_URL}/user/ai/suggestions`, requestInit);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch suggestions');
    }

    const json = await response.json();
    return json;
  } catch (error) {
    throw new Error(error.message || 'Failed to generate pet care suggestions. Please try again.');
  }
};

export const analyzePetSymptoms = async (petData, symptoms) => {
  try {
    if (!petData || !symptoms) {
      throw new Error('Pet information and symptoms are required.');
    }

    const body = JSON.stringify({ pet: petData, symptoms });
    const requestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    };

    let response;
    if (typeof authFetchInstance === 'function') {
      response = await authFetchInstance(`${API_URL}/user/ai/analyze-symptoms`, requestInit);
    } else {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }
      requestInit.headers.Authorization = `Bearer ${token}`;
      response = await fetch(`${API_URL}/user/ai/analyze-symptoms`, requestInit);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to analyze symptoms');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Failed to analyze symptoms. Please try again.');
  }
};