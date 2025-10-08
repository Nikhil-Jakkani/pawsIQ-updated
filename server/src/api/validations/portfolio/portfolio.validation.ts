import Joi from 'joi';

export const portfolioValidation = {
  getPublicPortfolio: {
    params: Joi.object().keys({
      providerId: Joi.number().integer().positive().required(),
    }),
  },
  getItem: {
    params: Joi.object().keys({
      id: Joi.number().integer().positive().required(),
    }),
  },
  create: {
    body: Joi.object().keys({
      title: Joi.string().max(200).required(),
      description: Joi.string().max(1000).allow('', null),
      image_url: Joi.string().max(512).required(),
      display_order: Joi.number().integer().min(0),
      is_featured: Joi.boolean(),
    }),
  },
  update: {
    params: Joi.object().keys({
      id: Joi.number().integer().positive().required(),
    }),
    body: Joi.object().keys({
      title: Joi.string().max(200),
      description: Joi.string().max(1000).allow('', null),
      image_url: Joi.string().max(512),
      display_order: Joi.number().integer().min(0),
      is_featured: Joi.boolean(),
    }),
  },
  remove: {
    params: Joi.object().keys({
      id: Joi.number().integer().positive().required(),
    }),
  },
  generateUploadUrl: {
    body: Joi.object().keys({
      file_name: Joi.string().required(),
    }),
  },
};
