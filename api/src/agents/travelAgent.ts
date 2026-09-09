// Google Gen AI SDK (@google/genai) integration
import { GoogleGenAI, Type } from '@google/genai';
import { TravelAdviceRequest, TravelAdvice } from '../types/travel';
import { MockWeatherTool, weatherToolDeclaration } from '../tools/weatherTool';
import { MockFlightTool, flightToolDeclaration } from '../tools/flightTool';
import { MockHotelTool, hotelToolDeclaration } from '../tools/hotelTool';
import { MockPlacesTool, placesToolDeclaration } from '../tools/placesTool';

export class TravelAdvisorAgent {
    private ai: GoogleGenAI;
    private weatherTool = new MockWeatherTool();
    private flightTool = new MockFlightTool();
    private hotelTool = new MockHotelTool();
    private placesTool = new MockPlacesTool();

    constructor() {
        // Initialize the official Google Gen AI Client using environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        this.ai = new GoogleGenAI({
            apiKey: apiKey,
        });
    }

    /**
    * Executes multi-step agent reasoning with manual function execution loop
    * to guarantee precise tool routing and response structured validation.
    */
    async planTrip(request: TravelAdviceRequest): Promise<TravelAdvice> {
        console.log(`\n[Agent] Travel Advisor started for ${request.destination}`);
        console.log(`[Agent] Input specs: ${request.durationDays} days, ${request.month} ${request.year}, Adults: ${request.travelers.adults}, Children: ${request.travelers.children}`);
        const systemInstruction = `
            You are an expert, objective Travel Advisor AI Agent.
            Your responsibility is to generate a comprehensive travel briefing based strictly on reliable data.
            
            RULES:
            1. Never invent real-time prices. Clearly state that price outputs are estimates.
            2. Use available tools whenever climate, price ranges, or destination specifics are needed.
            3. Tailor choices to family-friendly options if children > 0.
            4. Synthesize all tool output into a complete, structured JSON schema response.
        `;
        const prompt = `
            Please plan a travel itinerary and briefing for:
            Destination: ${request.destination}
            Month: ${request.month} ${request.year}
            Duration: ${request.durationDays} Days
            Travelers: ${request.travelers.adults} Adults, ${request.travelers.children} Children
        `;
        const tools = [{
            functionDeclarations: [
                weatherToolDeclaration,
                flightToolDeclaration,
                hotelToolDeclaration,
                placesToolDeclaration
            ]
        }];

        // Step 1: Call Gemini with declared tools
        console.log(`[Agent] Evaluating required tools via Gemini model...`);
        const model = 'gemini-2.5-flash';
        const initialResponse = await this.ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                tools
            }
        });
        console.log('[Agent] Initial response:', initialResponse);
        // Step 2: Handle function calls returned by the agent model
        const toolResults: Record<string, unknown> = {};
        const functionCalls = initialResponse.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
                console.log(`[Agent] Model triggered function call: ${call.name}`);
                const args = call.arguments as any;
                
                if (call.name === 'getClimateInfo') {
                    toolResults.weather = await this.weatherTool.getClimate(args.destination, args.month);
                } else if (call.name === 'searchFlightEstimates') {
                    toolResults.flights = await this.flightTool.searchFlights(args.destination, args.month, args.adults, args.children);
                } else if (call.name === 'searchHotelEstimates') {
                toolResults.hotels = await this.hotelTool.searchHotels(args.destination, args.adults, args.children);
                } else if (call.name === 'getAttractionsAndFood') {
                toolResults.places = await this.placesTool.getAttractionsAndFood(args.destination);
                }
                
            }
        }
        else {
            console.log(`[Agent] Model executed without function calls; executing default fallback tools...`);
            toolResults.weather = await this.weatherTool.getClimate(request.destination, request.month);
            toolResults.flights = await this.flightTool.searchFlights(request.destination, request.month, request.travelers.adults, request.travelers.children);
            toolResults.hotels = await this.hotelTool.searchHotels(request.destination, request.travelers.adults, request.travelers.children);
            toolResults.places = await this.placesTool.getAttractionsAndFood(request.destination);
        }

        // Step 3: Synthesis phase with Structured JSON Output enforcement
        console.log(`[Agent] Generating structured recommendation using compiled tool inputs...`);
        const synthesisPrompt = `
            Synthesize the following tool output into a full TravelAdvice JSON object for a ${request.durationDays}-day trip to ${request.destination} in ${request.month} ${request.year}.
            
            Gathered Data Context:
            ${JSON.stringify(toolResults, null, 2)}
            
            Target Travelers: ${request.travelers.adults} Adults, ${request.travelers.children} Children.
        `;
        const finalResponse = await this.ai.models.generateContent({
            model,
            contents: synthesisPrompt,
            config: {
              systemInstruction: "You are a JSON synthesis engine. Output exclusively structured JSON matching the requested schema.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  destination: { type: Type.STRING },
                  period: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  weather: {
                    type: Type.OBJECT,
                    properties: {
                      averageHighC: { type: Type.NUMBER },
                      averageLowC: { type: Type.NUMBER },
                      rainfall: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["averageHighC", "averageLowC", "rainfall", "description"]
                  },
                  flights: {
                    type: Type.OBJECT,
                    properties: {
                      currency: { type: Type.STRING },
                      estimatedRoundTripPrice: {
                        type: Type.OBJECT,
                        properties: {
                          min: { type: Type.NUMBER },
                          max: { type: Type.NUMBER }
                        },
                        required: ["min", "max"]
                      },
                      note: { type: Type.STRING }
                    },
                    required: ["currency", "estimatedRoundTripPrice", "note"]
                  },
                  hotels: {
                    type: Type.OBJECT,
                    properties: {
                      currency: { type: Type.STRING },
                      pricePerNight: {
                        type: Type.OBJECT,
                        properties: {
                          budget: { type: Type.NUMBER },
                          midRange: { type: Type.NUMBER },
                          luxury: { type: Type.NUMBER }
                        },
                        required: ["budget", "midRange", "luxury"]
                      },
                      recommendedAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
                      note: { type: Type.STRING }
                    },
                    required: ["currency", "pricePerNight", "recommendedAreas", "note"]
                  },
                  placesToVisit: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        category: { type: Type.STRING },
                        description: { type: Type.STRING },
                        familyFriendly: { type: Type.BOOLEAN }
                      },
                      required: ["name", "category", "description", "familyFriendly"]
                    }
                  },
                  food: { type: Type.ARRAY, items: { type: Type.STRING } },
                  activities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  budget: {
                    type: Type.OBJECT,
                    properties: {
                      estimatedTotalCurrency: { type: Type.STRING },
                      lowEstimate: { type: Type.NUMBER },
                      highEstimate: { type: Type.NUMBER },
                      breakdownNote: { type: Type.STRING }
                    },
                    required: ["estimatedTotalCurrency", "lowEstimate", "highEstimate", "breakdownNote"]
                  },
                  itinerary: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        day: { type: Type.NUMBER },
                        title: { type: Type.STRING },
                        activities: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ["day", "title", "activities"]
                    }
                  },
                  tips: { type: Type.ARRAY, items: { type: Type.STRING } },
                  sources: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: [
                  "destination", "period", "summary", "weather", "flights", 
                  "hotels", "placesToVisit", "food", "activities", "budget", 
                  "itinerary", "tips", "sources"
                ]
              }
            }
        });
        const structuredAdvice: TravelAdvice = JSON.parse(finalResponse.text!);
        console.log('[Agent] Successfully generated structured travel advice:', structuredAdvice);
        return structuredAdvice;
   }
}   