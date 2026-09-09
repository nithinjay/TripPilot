import { TravelAdviceRequest, TravelAdvice } from '../types/travel';

const API_BASE_URL = 'http://localhost:3000/api';

export async function fetchTravelAdvice(request: TravelAdviceRequest): Promise<TravelAdvice> {
  const response = await fetch(`${API_BASE_URL}/travel-advice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || 'Failed to fetch travel advice from server.'
    );
  }

  return response.json();
}