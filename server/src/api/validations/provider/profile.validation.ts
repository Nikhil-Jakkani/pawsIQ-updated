import Joi from 'joi';

export const providerProfileValidation = {
  update: {
    body: Joi.object()
      .keys({
        provider_name: Joi.string().min(2).max(120),
        provider_contact_number: Joi.string().min(5).max(30),
        provider_desc: Joi.string().max(1000),
        provider_experience_years: Joi.alternatives(Joi.string(), Joi.number()),
        provider_certificates: Joi.string().max(1000),
        provider_insta: Joi.string().max(255),
        provider_fb: Joi.string().max(255),
      })
      .min(1),
  },
};
