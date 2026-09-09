/**
 * Abstract interfaces for agent tools.
 * Defining these abstractions allows swapping Mock implementations for live APIs 
 * without modifying agent orchestration logic.
 */

export interface IWeatherTool {
    getClimate(destination: string, month: string): Promise<Record<string, unknown>>;
}

export interface IFlightTool {
    searchFlights(destination: string, month: string, adults: number, children: number): Promise<Record<string, unknown>>;
}

export interface IHotelTool {
    searchHotels(destination: string, adults: number, children: number): Promise<Record<string, unknown>>;
}
  
export interface IPlacesTool {
    getAttractionsAndFood(destination: string): Promise<Record<string, unknown>>;
}