import Joi from 'joi';

export const providerAppointmentValidation = {
  updateStatus: {
    params: Joi.object().keys({
      id: Joi.number().integer().required(),
    }),
    body: Joi.object().keys({
      status: Joi.string().valid('Scheduled', 'Cancelled', 'Completed').required(),
    }),
  },
};
