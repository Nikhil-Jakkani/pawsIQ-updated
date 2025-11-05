import express from 'express';
import { auth } from '../../../middlewares/auth.js';
import { validate } from '../../../middlewares/validate.js';
import { ticketController } from '../../controllers/support/ticket.controller.js';
import { supportTicketValidation } from '../../validations/support/ticket.validation.js';

const router = express.Router();

router
  .route('/')
  .post(auth('user'), validate(supportTicketValidation.createTicket), ticketController.createTicket)
  .get(auth('admin'), validate(supportTicketValidation.listTickets), ticketController.listAllTickets);

router
  .route('/mine')
  .get(auth('user'), validate(supportTicketValidation.listMyTickets), ticketController.listMyTickets);

router
  .route('/:ticketId')
  .get(auth('user', 'admin'), validate(supportTicketValidation.getTicket), ticketController.getTicket)
  .patch(auth('admin'), validate(supportTicketValidation.updateStatus), ticketController.updateStatus);

router
  .route('/:ticketId/messages')
  .post(auth('user', 'admin'), validate(supportTicketValidation.addMessage), ticketController.addMessage);

router
  .route('/:ticketId/assign')
  .post(auth('admin'), validate(supportTicketValidation.assignTicket), ticketController.assignTicket);

export default router;
