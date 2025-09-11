import { Joi } from 'celebrate';

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
      name: Joi.string(),
      type: Joi.string().valid('dog', 'cat', 'other'),
      breed: Joi.string(),
      birthYear: Joi.number().integer().min(1900).max(new Date().getFullYear()),
    }),
  },
};
