import React, { useState } from 'react';
import { TravelForm } from './components/TravelForm';
import { TravelBriefing } from './components/TravelBriefing';
import { TravelAdviceRequest, TravelAdvice } from './types/travel';
import { fetchTravelAdvice } from './services/api';
import './App.css';

export const App: React.FC = () => {
  const [advice, setAdvice] = useState<TravelAdvice | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlanTrip = async (request: TravelAdviceRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTravelAdvice(request);
      setAdvice(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred while contacting the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-inner">
          <div className="brand-row">
            <div className="brand">
              <span className="brand-mark" aria-hidden="true">T</span>
              TripPilot
            </div>
          </div>
          <p className="hero-kicker">AI travel briefing</p>
          <h1>Plan a trip with a clear, practical briefing</h1>
          <p className="lede">
            Describe where you want to go. TripPilot gathers climate, stay, and activity
            estimates into one readable plan for your dates and group.
          </p>
        </div>
      </header>

      <main className="container">
        {error && <div className="error-banner" role="alert">{error}</div>}

        <TravelForm onSubmit={handlePlanTrip} isLoading={loading} />

        {advice && <TravelBriefing advice={advice} />}
      </main>

      <footer className="site-footer">
        Estimates are for planning only and are not live booking prices.
      </footer>
    </div>
  );
};

export default App;
