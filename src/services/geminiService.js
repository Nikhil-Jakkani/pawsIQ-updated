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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
    As a professional veterinarian, analyze the following symptoms for this pet and provide guidance. 
    
    IMPORTANT DISCLAIMER: This is for informational purposes only and should not replace professional veterinary care.

    Pet Information:
    - Name: ${petData.name}
    - Type: ${petData.type}
    - Breed: ${petData.breed}
    - Age: ${petData.age}
    - Weight: ${petData.weight}
    - Gender: ${petData.gender}

    Reported Symptoms:
    ${symptoms}

    Please provide your analysis in the following JSON format:

    {
      "urgencyLevel": "emergency/urgent/moderate/mild",
      "urgencyColor": "red/orange/yellow/green",
      "summary": "Brief summary of the situation",
      "possibleCauses": ["cause 1", "cause 2", "cause 3"],
      "recommendations": {
        "immediate": ["immediate action 1", "immediate action 2"],
        "monitoring": ["what to monitor 1", "what to monitor 2"],
        "whenToSeekHelp": ["condition 1", "condition 2"]
      },
      "homeCareTips": ["tip 1", "tip 2", "tip 3"],
      "redFlags": ["warning sign 1", "warning sign 2"],
      "vetVisit": {
        "recommended": true/false,
        "timeframe": "immediately/within 24 hours/within a few days/routine checkup",
        "reason": "explanation of why vet visit is needed"
      },
      "disclaimer": "This analysis is for informational purposes only. Always consult with a qualified veterinarian for proper diagnosis and treatment."
    }

    Consider the pet's breed-specific health concerns and age-related factors in your analysis.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
    }

    // Fallback if JSON parsing fails
    return {
      urgencyLevel: "moderate",
      urgencyColor: "yellow",
      summary: "Unable to analyze symptoms properly. Please consult with a veterinarian.",
      possibleCauses: ["Various conditions possible"],
      recommendations: {
        immediate: ["Monitor your pet closely"],
        monitoring: ["Watch for changes in behavior", "Monitor eating and drinking"],
        whenToSeekHelp: ["If symptoms worsen", "If new symptoms appear"]
      },
      homeCareTips: ["Ensure pet is comfortable", "Provide fresh water", "Monitor closely"],
      redFlags: ["Difficulty breathing", "Severe lethargy", "Loss of consciousness"],
      vetVisit: {
        recommended: true,
        timeframe: "within 24 hours",
        reason: "Professional evaluation needed for proper diagnosis"
      },
      disclaimer: "This analysis is for informational purposes only. Always consult with a qualified veterinarian for proper diagnosis and treatment."
    };

  } catch (error) {
    console.error('Error analyzing pet symptoms:', error);
    throw new Error('Failed to analyze symptoms. Please try again.');
  }
};