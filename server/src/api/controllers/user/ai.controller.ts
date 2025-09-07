import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { aiService } from '../../services/user/index.js';

const generatePetCareSuggestions = catchAsync(async (req: Request, res: Response) => {
  const pet = req.body;
  const suggestions = await aiService.generatePetCareSuggestions(pet);
  res.status(httpStatus.OK).send(suggestions);
});

const analyzeFoodFromImage = catchAsync(async (req: Request, res: Response) => {
  // Expect: { imageUrl?: string, base64?: string }
  const payload = req.body;
  const result = await aiService.analyzeFoodFromImage(payload);
  res.status(httpStatus.OK).send(result);
});

export default {
  generatePetCareSuggestions,
  analyzeFoodFromImage,
};
