import Joi from 'joi';

const requestPayout = {
  body: Joi.object().keys({
    amount: Joi.number().min(100).required(),
    currency: Joi.string().valid('INR').default('INR'),
    remarks: Joi.string().max(500).optional(),
  }),
};

const getPayouts = {
  query: Joi.object().keys({
    status: Joi.string().valid('Pending', 'Processing', 'Completed', 'Rejected').optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
};

const approvePayout = {
  params: Joi.object().keys({
    payoutId: Joi.number().integer().required(),
  }),
  body: Joi.object().keys({
    reference_number: Joi.string().max(100).optional(),
    remarks: Joi.string().max(500).optional(),
  }),
};

const completePayout = {
  params: Joi.object().keys({
    payoutId: Joi.number().integer().required(),
  }),
  body: Joi.object().keys({
    reference_number: Joi.string().max(100).optional(),
    remarks: Joi.string().max(500).optional(),
  }),
};

const rejectPayout = {
  params: Joi.object().keys({
    payoutId: Joi.number().integer().required(),
  }),
  body: Joi.object().keys({
    remarks: Joi.string().required().max(500),
  }),
};

export const payoutValidation = {
  requestPayout,
  getPayouts,
  approvePayout,
  completePayout,
  rejectPayout,
};
