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
    return res.status(500).json({
      error: {
        code: 'TRAVEL_ADVISOR_ERROR',
        message: 'Unable to generate travel advice at this time.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

export default router;