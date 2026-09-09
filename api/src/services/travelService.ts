import { TravelAdviceRequest, TravelAdvice } from '../types/travel';
import { TravelAdvisorAgent } from '../agents/travelAgent';

export class TravelService {
    private agent = new TravelAdvisorAgent();

    constructor() {
        this.agent = new TravelAdvisorAgent();
    }

    async getTravelAdvice(request: TravelAdviceRequest): Promise<TravelAdvice> {
        // Decouples Express HTTP controllers from Agent execution details
        // and allows for easy testing and mocking of Agent behavior.

        try {
            return await this.agent.planTrip(request);
        } catch (error) {
            console.error('[Service] Error planning trip:', error);
            throw new Error('Failed to plan trip. Please try again later.');
        }
    }
}