import express from 'express';
import { auth } from '../../../middlewares/auth.js';
import { validate } from '../../../middlewares/validate.js';
import { chatController } from '../../controllers/chat/chat.controller.js';
import { chatValidation } from '../../validations/chat/chat.validation.js';

const router = express.Router();

router
  .route('/conversations')
  .post(auth('user', 'provider', 'admin'), validate(chatValidation.createConversation), chatController.createConversation)
  .get(auth('user', 'provider', 'admin'), validate(chatValidation.listConversations), chatController.listConversations);

router
  .route('/conversations/:conversationId')
  .get(auth('user', 'provider', 'admin'), validate(chatValidation.getConversation), chatController.getConversation)
  .patch(auth('user', 'provider', 'admin'), validate(chatValidation.updateConversation), chatController.updateConversation);

router
  .route('/conversations/:conversationId/messages')
  .get(auth('user', 'provider', 'admin'), validate(chatValidation.listMessages), chatController.listMessages)
  .post(auth('user', 'provider', 'admin'), validate(chatValidation.sendMessage), chatController.sendMessage);

router
  .post(
    '/conversations/:conversationId/read',
    auth('user', 'provider', 'admin'),
    validate(chatValidation.markRead),
    chatController.markRead
  );

export default router;
