import { GoogleGenerativeAI } from '@google/generative-ai';

import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const ensureGenAi = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Gemini API key is not configured');
  }
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

const generatePetCareSuggestions = async (pet: any) => {
  if (!pet || Object.keys(pet).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Pet data is required');
  }

  // Using the new simplified pet object structure from the frontend
  const { name, type, breed, age, gender, health_details } = pet;

  try {
    const model = ensureGenAi();

    const prompt = `
      You are a professional veterinary assistant. Based on the following pet details, provide a comprehensive set of personalized care recommendations.

      Pet Details:
      - Name: ${name}
      - Type: ${type}
      - Breed: ${breed}
      - Age: ${age}
      - Gender: ${gender}
      - Known Health Details: ${health_details}

      Please generate recommendations covering the following categories: health, grooming, vaccinations, nutrition, exercise, behavioral, and preventive.
      
      IMPORTANT: Your entire response must be a single, valid JSON object. Do not include any text, explanations, or markdown formatting before or after the JSON object. The JSON object should have the following structure, with each category containing a 'suggestion' (a brief title) and 'details' (a 1-2 sentence explanation):
      {
        "health": { "suggestion": "Annual Check-up", "details": "Schedule a yearly wellness exam with the vet." },
        "grooming": { "suggestion": "Regular Brushing", "details": "Brush the coat 2-3 times a week to prevent matting." },
        "vaccinations": { "suggestion": "Core Vaccinations", "details": "Ensure core vaccines like Rabies and Distemper are up to date." },
        "nutrition": { "suggestion": "High-Quality Diet", "details": "Feed a balanced diet appropriate for the pet's age and breed." },
        "exercise": { "suggestion": "Daily Walks", "details": "Provide at least 30-60 minutes of exercise daily." },
        "behavioral": { "suggestion": "Positive Reinforcement", "details": "Use positive reinforcement for training and good behavior." },
        "preventive": { "suggestion": "Flea and Tick Control", "details": "Use a monthly flea and tick preventive treatment." }
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Find the start and end of the JSON object to handle cases where the AI wraps it in text
      const startIndex = text.indexOf('{');
      const endIndex = text.lastIndexOf('}');
      if (startIndex === -1 || endIndex === -1) {
        throw new Error('No JSON object found in AI response.');
      }
      const jsonString = text.substring(startIndex, endIndex + 1);
      const suggestions = JSON.parse(jsonString);
      return suggestions;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error processing AI suggestions.');
    }
  } catch (error) {
    console.error('Error generating pet care suggestions:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate pet care suggestions.');
  }
};

const analyzeFoodFromImage = async (payload: { imageUrl?: string; base64?: string }) => {
  if (!payload || (!payload.imageUrl && !payload.base64)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'imageUrl or base64 image is required');
  }

  try {
    // Use Gemini with image input if URL or base64 provided
    const model = ensureGenAi();

    const instructions = `You are a nutrition analyzer for pet food. From the provided image, identify the food and estimate a nutrition breakdown suitable for dogs/cats where applicable. Return a strict JSON with keys: name, confidence (0-1), servingSize (string), calories (number), macros { protein_g, fat_g, carbs_g }, micronutrients { fiber_g, sodium_mg }, warnings [string], and notes (string). If uncertain, include a low confidence and add a helpful note.`;

    const parts: any[] = [{ text: instructions }];

    if (payload.base64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: payload.base64.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    } else if (payload.imageUrl) {
      parts.push({
        imageUrl: payload.imageUrl,
      } as any);
    }

    const result = await (model as any).generateContent(parts);
    const response = await (result as any).response;
    const text: string = response.text();

    // Extract JSON safely
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new Error('No JSON found in AI response');
    }
    const json = JSON.parse(text.substring(start, end + 1));

    return json;
  } catch (error) {
    console.error('Error analyzing food image:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to analyze food image');
  }
};

const analyzePetSymptoms = async (payload: { pet: any; symptoms: string }) => {
  if (!payload?.pet || !payload?.symptoms) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Pet details and symptoms are required');
  }

  const { pet, symptoms } = payload;
  const { name, type, breed, age, weight, gender } = pet;

  try {
    const model = ensureGenAi();
    const prompt = `
    As a professional veterinarian, analyze the following symptoms for this pet and provide guidance.

    IMPORTANT DISCLAIMER: This is for informational purposes only and should not replace professional veterinary care.

    Pet Information:
    - Name: ${name || 'Unknown'}
    - Type: ${type || 'Unknown'}
    - Breed: ${breed || 'Unknown'}
    - Age: ${age || 'Unknown'}
    - Weight: ${weight || 'Unknown'}
    - Gender: ${gender || 'Unknown'}

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

    const extractJson = () => {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      const slice = text.substring(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch (err) {
        console.error('Error parsing symptom analysis JSON:', err);
        return null;
      }
    };

    const parsed = extractJson();
    if (parsed) return parsed;

    return {
      urgencyLevel: 'moderate',
      urgencyColor: 'yellow',
      summary: 'Unable to analyze symptoms properly. Please consult with a veterinarian.',
      possibleCauses: ['Various conditions possible'],
      recommendations: {
        immediate: ['Monitor your pet closely'],
        monitoring: ['Watch for changes in behavior', 'Monitor eating and drinking'],
        whenToSeekHelp: ['If symptoms worsen', 'If new symptoms appear'],
      },
      homeCareTips: ['Ensure pet is comfortable', 'Provide fresh water', 'Monitor closely'],
      redFlags: ['Difficulty breathing', 'Severe lethargy', 'Loss of consciousness'],
      vetVisit: {
        recommended: true,
        timeframe: 'within 24 hours',
        reason: 'Professional evaluation needed for proper diagnosis',
      },
      disclaimer: 'This analysis is for informational purposes only. Always consult with a qualified veterinarian for proper diagnosis and treatment.',
    };
  } catch (error) {
    console.error('Error analyzing pet symptoms:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to analyze symptoms. Please try again.');
  }
};

export default {
  generatePetCareSuggestions,
  analyzeFoodFromImage,
  analyzePetSymptoms,
};
