import '../loadEnv';
import { GoogleGenAI, Type } from '@google/genai';
import { TravelAdviceRequest, TravelAdvice } from '../types/travel';
import { MockWeatherTool, weatherToolDeclaration } from '../tools/weatherTool';
import { MockFlightTool, flightToolDeclaration } from '../tools/flightTool';
import { MockHotelTool, hotelToolDeclaration } from '../tools/hotelTool';
import { MockPlacesTool, placesToolDeclaration } from '../tools/placesTool';

function isRetryableGeminiError(error: unknown): boolean {
    const status = (error as { status?: number }).status;
    const message = String((error as { message?: string }).message ?? '');
    return status === 503 || status === 429 || /UNAVAILABLE|high demand|try again later/i.test(message);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TravelAdvisorAgent {
    private ai: GoogleGenAI;
    private weatherTool = new MockWeatherTool();
    private flightTool = new MockFlightTool();
    private hotelTool = new MockHotelTool();
    private placesTool = new MockPlacesTool();

    constructor() {
        // Initialize the official Google Gen AI Client using environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            throw new Error(
                'GEMINI_API_KEY is not set. Add your Gemini API key to api/.env (see api/.env.example).'
            );
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
        const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
        const toolResults: Record<string, unknown> = {};
        let functionCalls: Array<{ name?: string; args?: Record<string, unknown> }> | undefined;

        try {
            const initialResponse = await this.generateContentWithRetry({
                model,
                contents: prompt,
                config: {
                    systemInstruction,
                    tools
                }
            });
            console.log('[Agent] Initial response:', initialResponse);
            functionCalls = initialResponse.functionCalls;
        } catch (error) {
            if (!isRetryableGeminiError(error)) {
                throw error;
            }
            console.warn('[Agent] Gemini unavailable for tool routing; using local tools only.');
        }

        if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
                console.log(`[Agent] Model triggered function call: ${call.name}`);
                const args = (call.args ?? {}) as Record<string, any>;
                const destination = String(args.destination || request.destination);
                const month = String(args.month || request.month);
                const adults = Number(args.adults ?? request.travelers.adults);
                const children = Number(args.children ?? request.travelers.children);

                if (call.name === 'getClimateInfo') {
                    toolResults.weather = await this.weatherTool.getClimate(destination, month);
                } else if (call.name === 'searchFlightEstimates') {
                    toolResults.flights = await this.flightTool.searchFlights(destination, month, adults, children);
                } else if (call.name === 'searchHotelEstimates') {
                    toolResults.hotels = await this.hotelTool.searchHotels(destination, adults, children);
                } else if (call.name === 'getAttractionsAndFood') {
                    toolResults.places = await this.placesTool.getAttractionsAndFood(destination);
                }
            }
        }

        if (!toolResults.weather || !toolResults.flights || !toolResults.hotels || !toolResults.places) {
            console.log(`[Agent] Filling missing tool results from the original request...`);
            if (!toolResults.weather) {
                toolResults.weather = await this.weatherTool.getClimate(request.destination, request.month);
            }
            if (!toolResults.flights) {
                toolResults.flights = await this.flightTool.searchFlights(
                    request.destination,
                    request.month,
                    request.travelers.adults,
                    request.travelers.children
                );
            }
            if (!toolResults.hotels) {
                toolResults.hotels = await this.hotelTool.searchHotels(
                    request.destination,
                    request.travelers.adults,
                    request.travelers.children
                );
            }
            if (!toolResults.places) {
                toolResults.places = await this.placesTool.getAttractionsAndFood(request.destination);
            }
        }

        // Step 3: Synthesis phase with Structured JSON Output enforcement
        console.log(`[Agent] Generating structured recommendation using compiled tool inputs...`);
        const synthesisPrompt = `
            Synthesize the following tool output into a full TravelAdvice JSON object for a ${request.durationDays}-day trip to ${request.destination} in ${request.month} ${request.year}.
            
            Gathered Data Context:
            ${JSON.stringify(toolResults, null, 2)}
            
            Target Travelers: ${request.travelers.adults} Adults, ${request.travelers.children} Children.
        `;
        try {
            const finalResponse = await this.generateContentWithRetry({
                model,
                contents: synthesisPrompt,
                config: {
                  systemInstruction: "You are a JSON synthesis engine. Output exclusively structured JSON matching the requested schema.",
                  responseMimeType: "application/json",
                  responseSchema: this.travelAdviceSchema()
                }
            });
            const rawText = finalResponse.text;
            if (!rawText) {
                throw new Error('Gemini returned an empty synthesis response.');
            }
            const structuredAdvice: TravelAdvice = JSON.parse(rawText);
            console.log('[Agent] Successfully generated structured travel advice:', structuredAdvice);
            return structuredAdvice;
        } catch (error) {
            if (!isRetryableGeminiError(error)) {
                throw error;
            }
            console.warn('[Agent] Gemini unavailable for synthesis; assembling briefing from tool results.');
            return this.assembleAdviceFromTools(request, toolResults);
        }
   }

    private async generateContentWithRetry(params: {
        model: string;
        contents: string;
        config: Record<string, unknown>;
    }) {
        const maxAttempts = 3;
        let lastError: unknown;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await this.ai.models.generateContent(params as any);
            } catch (error) {
                lastError = error;
                if (!isRetryableGeminiError(error) || attempt === maxAttempts) {
                    throw error;
                }
                const delayMs = 1000 * 2 ** (attempt - 1);
                console.warn(`[Agent] Gemini unavailable (attempt ${attempt}/${maxAttempts}); retrying in ${delayMs}ms...`);
                await sleep(delayMs);
            }
        }
        throw lastError;
    }

    private travelAdviceSchema() {
        return {
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
        };
    }

    private assembleAdviceFromTools(request: TravelAdviceRequest, toolResults: Record<string, unknown>): TravelAdvice {
        const weather = (toolResults.weather ?? {}) as Record<string, any>;
        const flights = (toolResults.flights ?? {}) as Record<string, any>;
        const hotels = (toolResults.hotels ?? {}) as Record<string, any>;
        const places = (toolResults.places ?? {}) as Record<string, any>;
        const duration = request.durationDays;
        const partySize = request.travelers.adults + request.travelers.children;
        const flightMin = Number(flights.estimatedRoundTripPrice?.min ?? 0);
        const flightMax = Number(flights.estimatedRoundTripPrice?.max ?? 0);
        const attractions = Array.isArray(places.attractions) ? places.attractions : [];
        const food = Array.isArray(places.localFood) ? places.localFood : [];

        return {
            destination: request.destination,
            period: `${request.month} ${request.year}`,
            summary: `A ${duration}-day trip to ${request.destination} for ${request.travelers.adults} adult(s) and ${request.travelers.children} child(ren). ${weather.description ?? ''}`.trim(),
            weather: {
                averageHighC: Number(weather.averageHighC ?? 0),
                averageLowC: Number(weather.averageLowC ?? 0),
                rainfall: String(weather.rainfall ?? 'Unavailable'),
                description: String(weather.description ?? '')
            },
            flights: {
                currency: String(flights.currency ?? 'USD'),
                estimatedRoundTripPrice: { min: flightMin, max: flightMax },
                note: String(flights.note ?? 'Estimates only.')
            },
            hotels: {
                currency: String(hotels.currency ?? 'USD'),
                pricePerNight: {
                    budget: Number(hotels.pricePerNight?.budget ?? 0),
                    midRange: Number(hotels.pricePerNight?.midRange ?? 0),
                    luxury: Number(hotels.pricePerNight?.luxury ?? 0)
                },
                recommendedAreas: Array.isArray(hotels.recommendedAreas) ? hotels.recommendedAreas : [],
                note: String(hotels.note ?? 'Estimates only.')
            },
            placesToVisit: attractions,
            food,
            activities: attractions.filter((place: any) => place.familyFriendly).map((place: any) => place.name),
            budget: {
                estimatedTotalCurrency: String(flights.currency || hotels.currency || 'USD'),
                lowEstimate: Math.round(flightMin + Number(hotels.pricePerNight?.budget ?? 0) * duration),
                highEstimate: Math.round(flightMax + Number(hotels.pricePerNight?.luxury ?? 0) * duration),
                breakdownNote: `Includes estimated round-trip flights and ${duration} nights of lodging for ${partySize} traveler(s). Food and activities are extra.`
            },
            itinerary: Array.from({ length: duration }, (_, index) => {
                const place = attractions[index % Math.max(attractions.length, 1)];
                return {
                    day: index + 1,
                    title: place?.name ? String(place.name) : `Explore ${request.destination}`,
                    activities: place
                        ? [`Visit ${place.name}`, String(place.description ?? '')].filter(Boolean)
                        : [`Explore ${request.destination}`]
                };
            }),
            tips: [
                'Prices are estimates from tool data, not live bookings.',
                request.travelers.children > 0
                    ? 'Look for family-friendly hotel rooms and attraction tickets.'
                    : 'Book popular attractions in advance.'
            ],
            sources: [
                weather.dataSource,
                flights.dataSource,
                hotels.dataSource,
                places.dataSource,
                'Assembled locally after Gemini returned high demand (503).'
            ].filter(Boolean)
        } as TravelAdvice;
    }
}   