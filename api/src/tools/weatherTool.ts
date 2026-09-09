import { IWeatherTool } from "./interfaces";

// Educational Tool abstraction layer: Swappable with OpenWeatherTool later.
export class MockWeatherTool implements IWeatherTool {
    async getClimate(destination: string, month: string): Promise<Record<string, unknown>> {
        console.log(`[Tool] weatherTool executed for ${destination} in ${month}`);
        return {
            destination,
            month,
            averageHighC: 25,
            averageLowC: 15,
            rainfall: "Low (less than 10mm)",
            description: "Hot, sunny, and dry conditions suitable for beach activity.",
            dataSource: "Historical Climate Records (Mock API)"
        };
    }
}

// ADK / GenAI SDK Schema Definition for tool registration
export const weatherToolDeclaration = {
    name: 'getClimateInfo',
    description: 'Retrieves historical climate and weather metrics for a destination and month.',
    parameters: {
        type: 'OBJECT',
        properties: {
            destination: { type: 'STRING', description: 'Target destination city or region' },
            month: { type: 'STRING', description: 'Month of travel (e.g., April)' }
        },
        required: ['destination', 'month']
    }
};