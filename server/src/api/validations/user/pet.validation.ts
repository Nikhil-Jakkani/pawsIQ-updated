import Joi from 'joi';

export const petValidation = {
  createPet: {
    body: Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('dog', 'cat', 'other').required(),
      breed: Joi.string().required(),
      birthYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
    }),
  },
  updatePetProfile: {
    body: Joi.object({
      // Primary fields used by the frontend
      name: Joi.string(),
      type: Joi.string().valid('dog', 'cat', 'other'),
      breed: Joi.string(),
      gender: Joi.string(),
      birthdate: Joi.alternatives().try(Joi.date().iso(), Joi.string()),
      color: Joi.string(),
      ageGroup: Joi.string(),
      microchipped: Joi.boolean(),
      microchipNumber: Joi.string().allow(''),
      neutered: Joi.boolean(),
      allergies: Joi.string().allow(''),
      medicalConditions: Joi.string().allow(''),
      medications: Joi.string().allow(''),
      dietaryNeeds: Joi.string().allow(''),
      vetName: Joi.string().allow(''),
      vetPhone: Joi.string().allow(''),
      notes: Joi.string().allow(''),
      vaccinations: Joi.array().items(Joi.any()),
      region: Joi.string().allow(''),

      // Backward-compatible aliases used elsewhere
      pet_name: Joi.string(),
      pet_type: Joi.string(),
      pet_species: Joi.string(),
      pet_breed: Joi.string(),
      pet_gender: Joi.string(),
      pet_birth_dtm: Joi.alternatives().try(Joi.date().iso(), Joi.string()),
      pet_colour: Joi.string(),
    }),
  },
};