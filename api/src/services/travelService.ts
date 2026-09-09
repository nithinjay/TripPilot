import { TravelAdviceRequest, TravelAdvice } from '../types/travel';
import { TravelAdvisorAgent } from '../agents/travelAgent';

export class TravelService {
    private agent: TravelAdvisorAgent | null = null;

    private getAgent(): TravelAdvisorAgent {
        if (!this.agent) {
            this.agent = new TravelAdvisorAgent();
        }
        return this.agent;
    }

    async getTravelAdvice(request: TravelAdviceRequest): Promise<TravelAdvice> {
        // Decouples Express HTTP controllers from Agent execution details
        // and allows for easy testing and mocking of Agent behavior.

        try {
            return await this.getAgent().planTrip(request);
        } catch (error) {
            console.error('[Service] Error planning trip:', error);
            throw error;
        }
    }
}