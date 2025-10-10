/**
 * Utility for transforming pet data to frontend format
 */

interface PetData {
  pet_id: any;
  pet_name: string;
  pet_type?: string;
  pet_species?: string;
  pet_breed?: string;
  pet_gender?: string;
  pet_birth_dtm?: Date | string;
  pet_weight?: number;
  pet_image?: string;
  pet_status?: string;
  microchipped?: boolean;
  neutered?: boolean;
  vaccinated?: boolean;
  created_at?: Date | string;
  last_updated_dtm?: Date | string;
}

interface TransformedPet {
  pet_id: string;
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  age: string;
  weight: string;
  image: string;
  imagePath: string | null;
  status: string;
  microchipped: boolean;
  neutered: boolean;
  vaccinated: boolean;
  createdAt?: Date | string;
  lastUpdated?: Date | string;
}

/**
 * Calculate age in years from birthdate
 */
const calculateAge = (birthDate: Date | string | undefined): number | null => {
  if (!birthDate) return null;
  
  const dob = new Date(birthDate);
  if (isNaN(dob.getTime())) return null;
  
  const now = new Date();
  const ageYears = Math.max(
    0, 
    Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  );
  
  return ageYears;
};

/**
 * Get placeholder image URL based on pet type
 */
const getPlaceholderImage = (petType: string): string => {
  const type = (petType || 'pet').toLowerCase();
  
  // Use source.unsplash.com as fallback
  // TODO: Replace with local placeholder images in production
  return `https://source.unsplash.com/random/400x300?${encodeURIComponent(type)}`;
};

/**
 * Transform raw pet data to frontend-friendly format
 * @param pet - Raw pet data from database
 * @returns Transformed pet data
 */
export const transformPet = (pet: any): TransformedPet => {
  const ageYears = calculateAge(pet.pet_birth_dtm);
  const petType = pet.pet_type || pet.pet_species || 'other';
  
  return {
    pet_id: pet.pet_id?.toString() || String(pet.pet_id),
    id: pet.pet_id?.toString() || String(pet.pet_id),
    name: pet.pet_name || 'Unknown',
    type: petType,
    breed: pet.pet_breed || '',
    gender: pet.pet_gender || 'Unknown',
    age: ageYears !== null ? `${ageYears} years` : 'Unknown',
    weight: pet.pet_weight ? `${pet.pet_weight} kg` : 'Unknown',
    image: pet.pet_image || getPlaceholderImage(petType),
    imagePath: pet.pet_image || null,
    status: pet.pet_status || 'active',
    microchipped: pet.microchipped || false,
    neutered: pet.neutered || false,
    vaccinated: pet.vaccinated || false,
    createdAt: pet.created_at,
    lastUpdated: pet.last_updated_dtm,
  };
};

/**
 * Transform array of pets
 * @param pets - Array of raw pet data
 * @returns Array of transformed pets
 */
export const transformPets = (pets: any[]): TransformedPet[] => {
  return pets.map(transformPet);
};
