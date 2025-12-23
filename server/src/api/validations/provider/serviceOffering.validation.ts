import Joi from 'joi';

export const providerServiceOfferingValidation = {
  create: {
    body: Joi.object().keys({
      services_id: Joi.number().integer().positive().required(),
      custom_title: Joi.string().max(150).optional().allow(null, ''),
      custom_description: Joi.string().max(1000).optional().allow(null, ''),
      is_active: Joi.boolean().optional(),
      custom_price: Joi.number().precision(2).min(0).optional(),
      discount_percent: Joi.number().precision(2).min(0).max(100).optional(),
    }),
  },

  update: {
    body: Joi.object()
      .keys({
        custom_title: Joi.string().max(150).optional().allow(null, ''),
        custom_description: Joi.string().max(1000).optional().allow(null, ''),
        is_active: Joi.boolean().optional(),
        custom_price: Joi.number().precision(2).min(0).optional(),
        discount_percent: Joi.number().precision(2).min(0).max(100).optional(),
      })
      .min(1),
  },

  getById: {
    params: Joi.object().keys({
      offering_id: Joi.number().integer().positive().required(),
    }),
  },

  deleteById: {
    params: Joi.object().keys({
      offering_id: Joi.number().integer().positive().required(),
    }),
  },
};
