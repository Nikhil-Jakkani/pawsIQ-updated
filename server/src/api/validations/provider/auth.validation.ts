import Joi from 'joi';

const password = (value: string, helpers: any) => {
  if (value.length < 8) {
    return helpers.message('Password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message('Password must contain at least 1 letter and 1 number');
  }
  return value;
};

export const providerAuthValidation = {
  register: {
    body: Joi.object().keys({
      provider_name: Joi.string().required(),
      provider_email: Joi.string().required().email(),
      provider_password: Joi.string().required().custom(password),
      provider_contact_number: Joi.string().required(),
      services_offered: Joi.string().required(),
      provider_type: Joi.string().optional(),
      provider_src: Joi.string().optional(),
      provider_desc: Joi.string().allow('', null),
      provider_experience_years: Joi.string().allow('', null),
      provider_certificates: Joi.string().allow('', null),
      provider_insta: Joi.string().allow('', null),
      provider_fb: Joi.string().allow('', null),
      how_hear_about_us: Joi.string().allow('', null),
      is_provider_bgchecked: Joi.boolean().optional(),
    }),
  },
  login: {
    body: Joi.object().keys({
      provider_email: Joi.string().required().email(),
      provider_password: Joi.string().required(),
    }),
  },
};
