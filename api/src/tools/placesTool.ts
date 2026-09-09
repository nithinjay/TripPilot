import { IPlacesTool } from './interfaces';

export class MockPlacesTool implements IPlacesTool {
  async getAttractionsAndFood(destination: string): Promise<Record<string, unknown>> {
    console.log(`[Tool] placesTool executed for ${destination}`);
    return {
      destination,
      attractions: [
        { name: "Burj Khalifa", category: "Landmark", description: "World's tallest building with observation deck.", familyFriendly: true },
        { name: "Dubai Mall & Aquarium", category: "Shopping & Entertainment", description: "Massive retail complex with an underwater zoo.", familyFriendly: true },
        { name: "Desert Safari", category: "Adventure", description: "Dune bashing, camel rides, and traditional dinner.", familyFriendly: true },
        { name: "Museum of the Future", category: "Culture/Tech", description: "Interactive futuristic exhibits.", familyFriendly: true }
      ],
      localFood: ["Shawarma", "Machboos (Spiced rice and meat)", "Al Harees", "Luqaimat (Sweet dumplings)"],
      dataSource: "Local Attractions Database (Mock API)"
    };
  }
}

export const placesToolDeclaration = {
  name: 'getAttractionsAndFood',
  description: 'Retrieves top local attractions, points of interest, and regional food recommendations.',
  parameters: {
    type: 'OBJECT',
    properties: {
      destination: { type: 'STRING', description: 'Destination city' }
    },
    required: ['destination']
  }
};