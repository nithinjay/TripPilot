/**
* Shared REST API Contract definitions.
* This file models the exact shape of request payloads and backend response schemas.
* It's used to generate TypeScript interfaces and validate request/response data.
* It's also used to generate OpenAPI (Swagger) documentation.
*/

export interface TravelerSpecs {
    adults: number;
    children: number;
}

export interface TravelAdviceRequest {
    destination: string;
    month: string;
    year: number;
    travelers: TravelerSpecs;
    durationDays: number;
}

export interface WeatherInfo {
    averageHighC: number;
    averageLowC: number;
    rainfall: string;
    description: string;
}

export interface FlightInfo {
    currency: string;
    estimatedRoundTripPrice: {
        min: number;
        max: number;
    };
    notes: string;
}

export interface HotelInfo {
    currency: string;
    estimatedRoundTripPrice: {
        min: number;
        max: number;
    };
    notes: string;
}

export interface HotelInfo {
    currency: string;
    pricePerNight: {
      budget: number;
      midRange: number;
      luxury: number;
    };
    recommendedAreas: string[];
    note: string;
  }
  
  export interface PlaceRecommendation {
    name: string;
    category: string;
    description: string;
    familyFriendly: boolean;
  }
  
  export interface DailyItinerary {
    day: number;
    title: string;
    activities: string[];
  }
  
  export interface TravelAdvice {
    destination: string;
    period: string;
    summary: string;
    weather: WeatherInfo;
    flights: FlightInfo;
    hotels: HotelInfo;
    placesToVisit: PlaceRecommendation[];
    food: string[];
    activities: string[];
    budget: {
      estimatedTotalCurrency: string;
      lowEstimate: number;
      highEstimate: number;
      breakdownNote: string;
    };
    itinerary: DailyItinerary[];
    tips: string[];
    sources: string[];
  }