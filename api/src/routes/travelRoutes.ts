import { Router, Request, Response } from 'express';
import { TravelService } from '../services/travelService';
import { TravelAdviceRequest } from '../types/travel';

const router = Router();
const travelService = new TravelService();

router.post('/travel-advice', async (req: Request, res: Response) => {
  try {
    const { destination, month, year, travelers, durationDays } = req.body as TravelAdviceRequest;

    // Request Payload Validation
    if (!destination || !month || !year || !durationDays || !travelers) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required parameters: destination, month, year, durationDays, or travelers.'
        }
      });
    }

    if (travelers.adults < 1) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TRAVELERS',
          message: 'Trip must have at least 1 adult traveler.'
        }
      });
    }

    const advice = await travelService.getTravelAdvice({
      destination,
      month,
      year: Number(year),
      travelers: {
        adults: Number(travelers.adults),
        children: Number(travelers.children || 0)
      },
      durationDays: Number(durationDays)
    });

    return res.status(200).json(advice);
  } catch (error: any) {
    console.error('[API Error]', error);
    const message = typeof error?.message === 'string' ? error.message : '';
    const missingKey = message.includes('GEMINI_API_KEY');
    const overloaded = error?.status === 503 || /UNAVAILABLE|high demand/i.test(message);
    return res.status(missingKey || overloaded ? 503 : 500).json({
      error: {
        code: missingKey ? 'MISSING_API_KEY' : (overloaded ? 'MODEL_UNAVAILABLE' : 'TRAVEL_ADVISOR_ERROR'),
        message: missingKey
          ? 'GEMINI_API_KEY is not set. Add your Gemini API key to api/.env and restart the API.'
          : overloaded
            ? 'Gemini is temporarily overloaded. Please try again in a moment.'
            : (message || 'Unable to generate travel advice at this time.')
      }
    });
  }
});

export default router;