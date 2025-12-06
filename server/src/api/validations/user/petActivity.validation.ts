import Joi from 'joi';

const activityTypeEnum = ['walking', 'food', 'water', 'play', 'sleep'];

export const petActivityValidation = {
    logActivity: {
        body: Joi.object({
            activityType: Joi.string().valid(...activityTypeEnum).required(),
            value: Joi.number().min(0).required(),
            unit: Joi.string().max(30).optional(),
            note: Joi.string().max(512).allow('', null),
            metadata: Joi.object().optional(),
            loggedAt: Joi.date().optional(),
        }),
        params: Joi.object({
            petId: Joi.number().integer().positive().required(),
        }),
    },
    getSummary: {
        params: Joi.object({
            petId: Joi.number().integer().positive().required(),
        }),
        query: Joi.object({
            days: Joi.number().integer().min(1).max(30).optional(),
        }),
    },
};

export default petActivityValidation;
