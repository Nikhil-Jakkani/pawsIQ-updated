import { Router } from 'express';
import { auth } from '../../../middlewares/auth.js'; // Use correct auth middleware
import suggestionController from '../../../api/controllers/user/suggestion.controller.js';

const router = Router();

router.use(auth('user'));

router
  .route('/')
  .post(suggestionController.createSuggestion)
  .get(suggestionController.getUserSuggestions);

router
  .route('/:id')
  .patch(suggestionController.updateSuggestion)
  .delete(suggestionController.deleteSuggestion);

export default router;
