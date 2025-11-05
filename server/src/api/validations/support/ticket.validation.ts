import Joi from 'joi';

const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
};

const statusValues = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
const priorityValues = ['low', 'medium', 'high', 'critical'];

export const supportTicketValidation = {
  createTicket: {
    body: Joi.object({
      subject: Joi.string().max(200).required(),
      description: Joi.string().max(2000).allow('', null),
      category: Joi.string().max(50).allow('', null),
      priority: Joi.string().valid(...priorityValues).default('medium'),
      service_provider_id: Joi.number().integer().positive().allow(null),
      source: Joi.string().max(30).allow('', null),
      sla_response_due: Joi.date().iso().allow(null),
      sla_resolution_due: Joi.date().iso().allow(null),
    }),
  },

  listMyTickets: {
    query: Joi.object({
      ...paginationSchema,
      status: Joi.string().valid(...statusValues).allow(null),
      priority: Joi.string().valid(...priorityValues).allow(null),
    }),
  },

  listTickets: {
    query: Joi.object({
      ...paginationSchema,
      status: Joi.string().valid(...statusValues).allow(null),
      priority: Joi.string().valid(...priorityValues).allow(null),
      category: Joi.string().max(50).allow('', null),
      requester_id: Joi.number().integer().positive().allow(null),
      service_provider_id: Joi.number().integer().positive().allow(null),
    }),
  },

  getTicket: {
    params: Joi.object({
      ticketId: Joi.number().integer().positive().required(),
    }),
  },

  addMessage: {
    params: Joi.object({
      ticketId: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      message_body: Joi.string().max(2000).required(),
      attachments: Joi.array().items(Joi.object()).default([]),
    }),
  },

  updateStatus: {
    params: Joi.object({
      ticketId: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      status: Joi.string().valid(...statusValues).required(),
    }),
  },

  assignTicket: {
    params: Joi.object({
      ticketId: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      assigned_to_admin_id: Joi.number().integer().positive().required(),
    }),
  },
};
