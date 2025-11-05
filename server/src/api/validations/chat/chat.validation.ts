import Joi from 'joi';

const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const attachmentSchema = Joi.object({
  id: Joi.string().max(200).optional(),
  bucket: Joi.string().max(100).default('chat-attachments'),
  path: Joi.string().max(512).required(),
  name: Joi.string().max(200).required(),
  mime_type: Joi.string().max(150).allow(null, ''),
  size: Joi.number().integer().min(0).max(MAX_ATTACHMENT_SIZE_BYTES).required(),
  url: Joi.string().uri().allow(null, ''),
}).unknown(false);

const roleValues = ['user', 'provider', 'admin'] as const;

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
        attachments: Joi.array().items(attachmentSchema).max(5).default([]),
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
      attachments: Joi.array().items(attachmentSchema).max(5).default([]),
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

  requestAttachmentUpload: {
    params: Joi.object({
      conversationId: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
      file_name: Joi.string().max(200).required(),
      file_size: Joi.number().integer().min(1).max(MAX_ATTACHMENT_SIZE_BYTES).required(),
      file_type: Joi.string().max(150).allow(null, ''),
    }).required(),
  },
};
