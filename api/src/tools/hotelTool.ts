import { IHotelTool } from './interfaces';

export class MockHotelTool implements IHotelTool {
  async searchHotels(destination: string, adults: number, children: number): Promise<Record<string, unknown>> {
    console.log(`[Tool] hotelTool executed for ${destination}`);
    return {
      destination,
      currency: "AED",
      pricePerNight: {
        budget: 250,
        midRange: 600,
        luxury: 1800
      },
      recommendedAreas: [
        "Dubai Marina (Beach & Nightlife access)",
        "Downtown Dubai (Sightseeing & Shopping)",
        "Jumeirah Beach (Family & Resorts)"
      ],
      note: "Estimated nightly rates; actual prices subject to seasonality.",
      dataSource: "Hotel Price Aggregator (Mock API)"
    };
  }
}

export const hotelToolDeclaration = {
  name: 'searchHotelEstimates',
  description: 'Fetches hotel nightly rate ranges and recommended neighborhood areas.',
  parameters: {
    type: 'OBJECT',
    properties: {
      destination: { type: 'STRING', description: 'Destination city' },
      adults: { type: 'NUMBER', description: 'Adult count' },
      children: { type: 'NUMBER', description: 'Child count' }
    },
    required: ['destination', 'adults', 'children']
  }
};