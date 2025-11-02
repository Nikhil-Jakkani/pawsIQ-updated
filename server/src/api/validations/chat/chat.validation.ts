import Joi from 'joi';

const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

const roleValues = ['user', 'provider', 'admin'] as const;

type ParticipantRole = (typeof roleValues)[number];

const participantSchema = Joi.object({
  role: Joi.string()
    .valid(...roleValues)
    .required(),
  id: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().regex(/^\d+$/))
    .required(),
});

export const chatValidation = {
  createConversation: {
    body: Joi.object({
      topic: Joi.string().max(200).allow(null, ''),
      context_type: Joi.string().max(30).allow(null, ''),
      participants: Joi.array().items(participantSchema).default([]),
      initial_message: Joi.object({
        message_body: Joi.string().max(4000).required(),
        attachments: Joi.array().items(Joi.object()).default([]),
      }).allow(null),
    }),
  },

  listConversations: {
    query: Joi.object({
      ...pagination,
      is_archived: Joi.boolean(),
    }),
  },

  getConversation: {
    params: Joi.object({
      conversationId: Joi.number().integer().positive().required(),
    }),
  },

  listMessages: {
    params: Joi.object({
      conversationId: Joi.number().integer().positive().required(),
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(200).default(50),
      cursor: Joi.number().integer().positive().allow(null),
    }),
  },

  sendMessage: {
    params: Joi.object({
      conversationId: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      message_body: Joi.string().max(4000).required(),
      attachments: Joi.array().items(Joi.object()).default([]),
    }),
  },

  updateConversation: {
    params: Joi.object({
      conversationId: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      is_archived: Joi.boolean().optional(),
    }).min(1),
  },

  markRead: {
    params: Joi.object({
      conversationId: Joi.number().integer().positive().required(),
    }),
  },
};
