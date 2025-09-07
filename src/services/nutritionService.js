const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const getToken = () => {
  const stored = localStorage.getItem('pawsiq_user');
  const parsed = stored ? JSON.parse(stored) : null;
  return parsed?.tokens?.access?.token;
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
  return resp.json();
};