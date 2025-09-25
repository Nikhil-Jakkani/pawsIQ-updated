const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const getToken = () => {
  // Prefer new storage written by AuthContext
  try {
    const raw = localStorage.getItem('authTokens');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.access?.token) return parsed.access.token;
    }
  } catch (_) {}
  // Fallback to legacy combined storage
  try {
    const stored = localStorage.getItem('pawsiq_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.tokens?.access?.token || null;
    }
  } catch (_) {}
  return null;
};

export const analyzeFoodImage = async ({ imageUrl, base64 }) => {
  const token = getToken();
  if (!token) throw new Error('Authentication token not found. Please log in again.');

  const resp = await fetch(`${API_URL}/user/ai/nutrition-from-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ imageUrl, base64 }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to analyze image');
  }
  return resp.json();
};

export const saveFoodCalories = async ({ pet_id, calories, note, image_url }) => {
  const token = getToken();
  if (!token) throw new Error('Authentication token not found. Please log in again.');

  const resp = await fetch(`${API_URL}/user/activities/food`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ pet_id, calories, note, image_url }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to save food calories');
  }
  const json = await resp.json();
  try {
    // Notify listeners that an activity was logged
    window.dispatchEvent(new CustomEvent('pawsiq:activity:foodLogged', {
      detail: { pet_id, calories, note, image_url, at: Date.now() }
    }));
  } catch (_) {}
  return json;
};