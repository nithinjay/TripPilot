import { IFlightTool } from './interfaces';

export class MockFlightTool implements IFlightTool {
  async searchFlights(destination: string, month: string, adults: number, children: number): Promise<Record<string, unknown>> {
    console.log(`[Tool] flightTool executed for ${destination} (${adults} Adults, ${children} Children)`);
    return {
      destination,
      month,
      currency: "AED",
      estimatedRoundTripPrice: {
        min: 1800 * (adults + children * 0.75),
        max: 3200 * (adults + children * 0.75)
      },
      note: "Sample statistical estimation based on historical averages. Not live GDS inventory.",
      dataSource: "Flight Price Index (Mock API)"
    };
  }
}

export const flightToolDeclaration = {
  name: 'searchFlightEstimates',
  description: 'Searches estimated round-trip flight prices for specified passengers.',
  parameters: {
    type: 'OBJECT',
    properties: {
      destination: { type: 'STRING', description: 'Target destination city' },
      month: { type: 'STRING', description: 'Travel month' },
      adults: { type: 'NUMBER', description: 'Number of adult passengers' },
      children: { type: 'NUMBER', description: 'Number of child passengers' }
    },
    required: ['destination', 'month', 'adults', 'children']
  }
};