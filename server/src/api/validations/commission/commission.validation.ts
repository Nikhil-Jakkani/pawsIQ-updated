import Joi from 'joi';

const getCommissions = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'calculated', 'settled').optional(),
    provider_id: Joi.number().integer().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
};

const settleCommission = {
  params: Joi.object().keys({
    commissionId: Joi.number().integer().required(),
  }),
};

const getProviderCommissions = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
};

export const commissionValidation = {
  getCommissions,
  settleCommission,
  getProviderCommissions,
};
