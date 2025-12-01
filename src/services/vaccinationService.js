const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const vaccinationService = {
  // Get available vaccinations from the vaccine master
  getAvailableVaccines: async (token, petType = '', breed = '', ageGroup = '') => {
    try {
      const params = new URLSearchParams();
      if (petType) params.append('petType', petType);
      if (breed) params.append('breed', breed);
      if (ageGroup) params.append('ageGroup', ageGroup);

      const queryString = params.toString();
      const url = `${API_URL}/vaccines/master${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to load vaccines: ${response.status}`);
      }

      const data = await response.json();
      const vaccinesList = Array.isArray(data?.vaccines) ? data.vaccines : [];
      const uniqueVaccines = [...new Set(vaccinesList.map(item => item.vaccine))].filter(v => v && v.trim()).sort();
      
      return uniqueVaccines;
    } catch (err) {
      console.error('Error loading vaccinations:', err);
      return [];
    }
  },

  // Get pet-specific vaccinations from PIQ_Pet_Vaccination table
  getPetVaccinations: async (petId, token) => {
    try {
      if (!petId || !token) {
        throw new Error('Pet ID and token are required');
      }

      const response = await fetch(`${API_URL}/vaccines/pets/${petId}/vaccinations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to load pet vaccinations: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error loading pet vaccinations:', err);
      return [];
    }
  },

  // Save vaccination for pet
  savePetVaccination: async (petId, vaccinationData, token) => {
    try {
      if (!petId || !token) {
        throw new Error('Pet ID and token are required');
      }

      const response = await fetch(`${API_URL}/vaccines/pets/${petId}/vaccinations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vaccinationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save vaccination');
      }

      return await response.json();
    } catch (err) {
      console.error('Error saving vaccination:', err);
      throw err;
    }
  },
};

export default vaccinationService;